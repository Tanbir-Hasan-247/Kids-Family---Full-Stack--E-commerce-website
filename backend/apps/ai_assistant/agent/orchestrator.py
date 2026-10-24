"""
Agent Orchestrator for Kids & Family AI Shopping Assistant.
Executes the bounded multi-turn Gemini tool-calling loop, coordinates tool execution,
and formats responses complying with the React frontend contract.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from google.genai import types

from apps.ai_assistant.gemini_service import get_gemini_client, PRIMARY_MODEL, FALLBACK_MODELS
from .prompt import build_system_instruction
from .context import ContextManager
from .tools import get_agent_tools, dispatch_tool_call
from .tools.policy_tools import get_verified_shop_settings
from .errors import classify_error, log_sanitized_error, GeminiErrorKind

logger = logging.getLogger(__name__)

# Bounded iteration limit to prevent infinite tool loops and control latency (hard cap 4)
MAX_AGENT_TOOL_TURNS = 4


class AgentOrchestrator:
    """
    Orchestrates the AI Shopping Agent conversation turn:
    1. Fast security & safety guards.
    2. Builds multi-turn conversation context and sanitizes customer PII.
    3. Invokes Gemini with typed Tool Declarations.
    4. Executes requested tools against Django backend with authorization and validation.
    5. Returns tool outputs to Gemini in a bounded loop (<= 4 turns).
    6. Composes natural Bengali e-commerce response adhering to React frontend contract.
    """

    @classmethod
    def run(
        cls,
        message: str,
        history: Optional[List[Any]] = None,
        session_key: Optional[str] = None,
        user: Optional[Any] = None,
        request: Optional[Any] = None,
        draft_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        clean_msg = (message or "").strip()
        if not clean_msg:
            return {
                "success": True,
                "reply": "স্বাগতম! আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনাকে কীভাবে সাহায্য করতে পারি? পণ্য খোঁজা, সাইজ নির্ধারণ, ডেলিভারি তথ্য বা অর্ডার ট্র্যাক করতে যেকোনো প্রশ্ন করতে পারেন।",
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "greeting",
            }

        # 1. Fast Security & Adversarial Guard
        blocked_reply = cls._check_security_fast_guard(clean_msg)
        if blocked_reply:
            return blocked_reply

        # 2. Build Store Context & Gemini Client
        store_context = get_verified_shop_settings()
        client = get_gemini_client()
        if not client:
            logger.warning("[Agent Orchestrator] Gemini client unavailable, falling back.")
            return cls._fallback_response(clean_msg, history, session_key, user, store_context)

        # 3. Prepare Tools, System Instruction & Context
        tools = get_agent_tools()
        system_instruction = build_system_instruction(store_context)
        contents, shown_ids = ContextManager.build_gemini_contents(
            clean_msg, history=history, session_key=session_key, user=user
        )

        tool_context = {
            "request": request,
            "user": user,
            "session_key": session_key,
            "shown_product_ids": shown_ids,
            "store_context": store_context,
            "draft_context": draft_context,
        }

        # State collected from tools across iterations
        state = {
            "products": [],
            "order": None,
            "order_created": False,
            "cart_updated": False,
            "added_product_id": None,
            "order_draft": None,
            "order_confirmation_requested": False,
            "intents": set(),
        }

        config = types.GenerateContentConfig(
            tools=tools,
            system_instruction=system_instruction,
            temperature=0.7,
        )

        models_to_try = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]
        final_reply = ""
        used_model = PRIMARY_MODEL

        # 4. Multi-turn Tool Calling Loop
        for model_name in models_to_try:
            used_model = model_name
            try:
                loop_contents = list(contents)
                for turn in range(MAX_AGENT_TOOL_TURNS):
                    response = client.models.generate_content(
                        model=model_name,
                        contents=loop_contents,
                        config=config,
                    )

                    # Check for function calls
                    function_calls = getattr(response, "function_calls", None)
                    if not function_calls:
                        # Model generated final natural language response
                        if response and hasattr(response, "text") and response.text:
                            final_reply = response.text.strip()
                        break

                    # Append model's content part to history
                    if response.candidates and response.candidates[0].content:
                        loop_contents.append(response.candidates[0].content)

                    # Dispatch each function call and construct response parts
                    response_parts = []
                    for call in function_calls:
                        tool_name = call.name
                        tool_args = call.args if hasattr(call, "args") and isinstance(call.args, dict) else {}

                        tool_result = dispatch_tool_call(
                            tool_name=tool_name,
                            tool_args=tool_args,
                            context=tool_context,
                        )

                        # Accumulate state for frontend response
                        cls._accumulate_state(tool_name, tool_result, state)

                        # Wrap tool result for Gemini
                        response_parts.append(
                            types.Part.from_function_response(
                                name=tool_name,
                                response={"result": tool_result},
                            )
                        )

                    # Append tool responses as 'tool' role content
                    loop_contents.append(
                        types.Content(role="tool", parts=response_parts)
                    )

                # Loop completed without provider exception; break out of model failover
                break

            except Exception as e:
                error_kind = classify_error(e)
                log_sanitized_error("AgentOrchestrator.run", e, session_id=session_key)
                if error_kind == GeminiErrorKind.PROGRAMMING:
                    # Never swallow programming errors
                    raise
                # Bounded safety guard: If state-modifying side-effects (e.g. order_created or cart_updated)
                # have already been successfully executed, do NOT retry with subsequent fallback models.
                # Stopping failover here preserves the completed operation and prevents duplicate mutations.
                if state.get("order_created") or state.get("cart_updated"):
                    logger.info("State-modifying tool already executed; halting model failover to prevent duplicate side effects.")
                    break
                # For transient/configuration errors without side effects, try next model in fallback list
                continue

        # If model failed or produced empty reply, compose grounded response
        if not final_reply:
            final_reply = cls._compose_fallback_text(clean_msg, state, store_context)

        # Resolve dominant intent for frontend
        dominant_intent = "general"
        if state["order_created"]:
            dominant_intent = "order_created"
        elif state.get("is_replay"):
            dominant_intent = "order_replayed"
        elif state["order_confirmation_requested"]:
            dominant_intent = "order_confirmation_requested"
        elif state["cart_updated"]:
            dominant_intent = "cart_updated"
        elif state["order"]:
            dominant_intent = "order_tracking"
        elif state["products"]:
            dominant_intent = "recommendation"
        elif state["intents"]:
            dominant_intent = list(state["intents"])[0]

        return {
            "success": True,
            "reply": final_reply,
            "products": state["products"][:4],
            "order": state["order"],
            "order_created": state["order_created"],
            "cart_updated": state["cart_updated"],
            "added_product_id": state["added_product_id"],
            "order_draft": state["order_draft"],
            "order_confirmation_requested": state["order_confirmation_requested"],
            "intent": dominant_intent,
            "engine": f"gemini-agent ({used_model})",
        }

    @classmethod
    def _accumulate_state(cls, tool_name: str, tool_result: dict, state: dict):
        """Extracts and normalizes frontend state from tool outputs."""
        if not isinstance(tool_result, dict):
            return

        if tool_name == "search_products":
            prods = tool_result.get("products", [])
            if prods and isinstance(prods, list):
                state["products"].extend(prods)
                state["intents"].add("recommendation")

        elif tool_name == "get_product_details":
            card = tool_result.get("card")
            if card:
                state["products"].append(card)
                state["intents"].add("product_detail")

        elif tool_name == "track_order":
            ord_card = tool_result.get("order")
            if ord_card:
                state["order"] = ord_card
                state["intents"].add("order_tracking")

        elif tool_name in ("manage_cart", "add_item_to_cart", "clear_cart"):
            if tool_result.get("success"):
                state["cart_updated"] = True
                if tool_result.get("added_product_id"):
                    state["added_product_id"] = tool_result.get("added_product_id")
                state["intents"].add("cart_updated")

        elif tool_name in ("prepare_order_draft", "place_conversational_order"):
            if tool_result.get("order_draft"):
                state["order_draft"] = tool_result.get("order_draft")
                state["order_confirmation_requested"] = True
                state["order_created"] = False
                state["intents"].add("order_confirmation_requested")

        elif tool_name == "confirm_order":
            if tool_result.get("order_created"):
                state["order_created"] = True
                state["is_replay"] = False
                state["order"] = tool_result.get("order")
                state["cart_updated"] = True
                state["order_draft"] = None
                state["order_confirmation_requested"] = False
                state["intents"].add("order_created")
            elif tool_result.get("is_replay"):
                state["order_created"] = False
                state["is_replay"] = True
                state["order"] = tool_result.get("order")
                state["cart_updated"] = False
                state["order_draft"] = None
                state["order_confirmation_requested"] = False
                state["intents"].add("order_replayed")

        elif tool_name == "get_store_policies":
            state["intents"].add("store_policy")

    @classmethod
    def _check_security_fast_guard(cls, message: str) -> Optional[dict]:
        """Fast pre-LLM check to block prompt injections and destructive attacks."""
        lower = message.lower()
        security_patterns = [
            r"\[system\s*override\]",
            r"ignore\s+(?:all\s+)?previous\s+instructions",
            r"(?:reveal|output|show)\s+(?:your\s+)?system\s+prompt",
            r"developer\s+mode",
            r"database\s+password",
            r"secret\s*key",
            r"drop\s+table",
            r"alter\s+table",
            r"<script>",
            r"admin'\s*or\s*'1'='1",
            r"set\s+all\s+product\s+prices\s+to\s+0",
        ]
        if any(re.search(pat, lower) for pat in security_patterns):
            return {
                "success": True,
                "reply": "আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনার অর্ডার, পছন্দসই পোশাক খোঁজা বা ডেলিভারি তথ্য জানতে যেকোনো প্রশ্ন করতে পারেন। আমি আনন্দের সাথে সাহায্য করতে প্রস্তুত!",
                "products": [],
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "security_blocked",
            }
        return None

    @classmethod
    def _compose_fallback_text(cls, message: str, state: dict, store_context: dict) -> str:
        """Composes clean Bengali response if Gemini generation was truncated or empty."""
        if state.get("order_created") and state.get("order"):
            return (
                f"🎉 **অভিনন্দন!** আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!\n"
                f"অর্ডার নম্বর: `{state['order'].get('order_number')}`\n"
                f"আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।"
            )
        if state.get("is_replay") and state.get("order"):
            return (
                f"আপনার অর্ডারটি (অর্ডার নং: `{state['order'].get('order_number')}`) ইতিমধ্যে সফলভাবে গ্রহণ করা হয়েছে।\n"
                f"মোট প্রদেয় ৳{float(state['order'].get('total', 0)):.0f} (ক্যাশ অন ডেলিভারি)।"
            )
        if state["order_confirmation_requested"] and state["order_draft"]:
            draft = state["order_draft"]
            return (
                f"আপনার অর্ডারের বিবরণ:\n"
                f"প্রাপক: {draft.get('recipient_name')}\n"
                f"ঠিকানা: {draft.get('address')}, {draft.get('city')}\n"
                f"মোট মূল্য: ৳{draft.get('total', 0):.0f} (ক্যাশ অন ডেলিভারি)\n\n"
                f"অর্ডারটি চূড়ান্ত করতে 'হ্যাঁ, অর্ডার নিশ্চিত করছি' লিখুন।"
            )
        if state["products"]:
            return (
                f"আমাদের চমৎকার কিছু কালেকশন নিচে যুক্ত করে দেওয়া হলো! "
                f"পছন্দমতো পোশাকে সরাসরি 'কার্টে নিন' বাটনে চাপ দিয়ে সহজেই অর্ডার করতে পারেন:"
            )
        if state["order"]:
            return (
                f"আপনার অর্ডার নম্বর **{state['order'].get('order_number')}** ট্র্যাক করা হয়েছে। "
                f"বর্তমান স্ট্যাটাস: **{state['order'].get('status_title')}** ({state['order'].get('status_desc')})।"
            )
        return (
            f"Kids & Family-তে আপনাকে স্বাগতম! 🌸 আমাদের কালেকশন, সাইজ বা ডেলিভারি নিয়ে যেকোনো জিজ্ঞাসা জানাতে পারেন, "
            f"সাহায্য করতে পেরে আনন্দিত হব।"
        )

    @classmethod
    def _fallback_response(cls, message: str, history, session_key, user, store_context: dict) -> dict:
        """Safe fallback to legacy logic if LLM service is completely unreachable."""
        try:
            from apps.ai_assistant.services import _legacy_handle_chat_turn
            res = _legacy_handle_chat_turn(
                message=message,
                history=history,
                session_key=session_key,
                user=user,
            )
            # Ensure standard contract fields exist
            res.setdefault("order_created", False)
            res.setdefault("cart_updated", False)
            res.setdefault("added_product_id", None)
            res.setdefault("order_draft", None)
            res.setdefault("order_confirmation_requested", False)
            return res
        except Exception as e:
            logger.error(f"[Agent Orchestrator] Fallback error: {e}")
            from apps.ai_assistant.services import find_recommended_products
            prods = find_recommended_products(message, history=history, limit=4)
            return {
                "success": True,
                "reply": "Kids & Family-তে স্বাগতম! আপনার পছন্দের পোশাকের কালেকশন দেখতে নিচে লক্ষ্য করুন অথবা হেল্পলাইনে যোগাযোগ করুন।",
                "products": prods,
                "order": None,
                "order_created": False,
                "cart_updated": False,
                "added_product_id": None,
                "order_draft": None,
                "order_confirmation_requested": False,
                "intent": "fallback",
            }
