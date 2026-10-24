"""
Tool Registry and Controlled Dispatcher for AI Shopping Agent.
Exposes Gemini Function Declarations and enforces authorization and input validation.
"""

import logging
from typing import Dict, Any, List, Optional
from google.genai import types

from .product_tools import execute_search_products, execute_get_product_details
from .policy_tools import execute_get_store_policies
from .cart_tools import execute_manage_cart
from .order_tools import execute_track_order, execute_prepare_order_draft, execute_confirm_order
from ..errors import log_sanitized_error, classify_error, GeminiErrorKind

logger = logging.getLogger(__name__)

# Controlled tool registry allowlist
ALLOWED_TOOLS = {
    "search_products": execute_search_products,
    "get_product_details": execute_get_product_details,
    "get_store_policies": execute_get_store_policies,
    "manage_cart": execute_manage_cart,
    "track_order": execute_track_order,
    "prepare_order_draft": execute_prepare_order_draft,
    "confirm_order": execute_confirm_order,
}

# Recognized aliases for backwards compatibility and model prompt variation
TOOL_ALIASES = {
    "get_cart_contents": "manage_cart",
    "add_item_to_cart": "manage_cart",
    "clear_cart": "manage_cart",
    "place_conversational_order": "prepare_order_draft",
}


def get_agent_tools() -> list:
    """
    Returns list of Gemini Tool definitions (FunctionDeclarations)
    compatible with Google GenAI SDK.
    """
    declarations = [
        types.FunctionDeclaration(
            name="search_products",
            description="Search for children and family clothing items by keywords, wearer target (boy, girl, man, woman, family), category slug, size/age, or price range. Always use this tool when customer asks to see dresses, outfits, or clothes.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "query": types.Schema(type=types.Type.STRING, description="Apparel search keywords e.g. 'পাঞ্জাবি', 'frock', 'shirt'"),
                    "target": types.Schema(type=types.Type.STRING, description="Intended wearer e.g. 'boy', 'girl', 'man', 'woman', 'family'"),
                    "category_slug": types.Schema(type=types.Type.STRING, description="Specific category slug e.g. 'panjabi-koti-boy', 'frock-dress-girl'"),
                    "min_price": types.Schema(type=types.Type.NUMBER, description="Minimum price in BDT"),
                    "max_price": types.Schema(type=types.Type.NUMBER, description="Maximum budget price in BDT"),
                    "size": types.Schema(type=types.Type.STRING, description="Requested size or age tag e.g. '2-3Y', '4-5Y', 'M', 'L'"),
                },
                required=[],
            ),
        ),
        types.FunctionDeclaration(
            name="get_product_details",
            description="Retrieve detailed specifications, description, available sizes, colors, and live stock for a specific product ID.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "product_id": types.Schema(type=types.Type.INTEGER, description="The unique numeric ID of the product"),
                },
                required=["product_id"],
            ),
        ),
        types.FunctionDeclaration(
            name="get_store_policies",
            description="Retrieve verified store policies and information grounded in database settings (delivery charges/time, return/exchange, payment methods, helpline).",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "topic": types.Schema(
                        type=types.Type.STRING,
                        description="Policy topic: 'delivery', 'returns', 'payment', 'contact', or 'all'",
                    ),
                },
                required=["topic"],
            ),
        ),
        types.FunctionDeclaration(
            name="manage_cart",
            description="View, add, remove, or clear items in the customer's active shopping bag.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "action": types.Schema(type=types.Type.STRING, description="Action to perform: 'get', 'add', 'remove', or 'clear'"),
                    "variant_id": types.Schema(type=types.Type.INTEGER, description="ProductVariant ID to add or remove"),
                    "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity (default: 1, maximum: 10)"),
                },
                required=["action"],
            ),
        ),
        types.FunctionDeclaration(
            name="track_order",
            description="Track an existing customer order status, delivery progress, and items using order number (e.g. 'KF2610251234') and customer phone number.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_number": types.Schema(type=types.Type.STRING, description="Order identifier e.g. KF2610251234"),
                    "phone": types.Schema(type=types.Type.STRING, description="11-digit customer phone number used during checkout"),
                },
                required=["order_number"],
            ),
        ),
        types.FunctionDeclaration(
            name="prepare_order_draft",
            description="Prepares a verified Cash on Delivery (COD) order draft when the customer provides their name, 11-digit phone number, and delivery address. Prompts user for explicit confirmation before order creation. Does NOT place or finalize the order.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "recipient_name": types.Schema(type=types.Type.STRING, description="Recipient customer full name"),
                    "phone": types.Schema(type=types.Type.STRING, description="11-digit Bangladeshi mobile number e.g. 017XXXXXXXX"),
                    "address": types.Schema(type=types.Type.STRING, description="Full delivery address including road/house/area"),
                    "city": types.Schema(type=types.Type.STRING, description="City or district e.g. 'Dhaka', 'Cumilla', 'Chittagong'"),
                    "payment_method": types.Schema(type=types.Type.STRING, description="Payment method: 'cod' (default) or 'online'"),
                },
                required=["recipient_name", "phone", "address"],
            ),
        ),
        types.FunctionDeclaration(
            name="confirm_order",
            description="Finalizes and creates the order once the customer explicitly confirms their pending order draft. Revalidates live prices and stock under database locks.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "draft_id": types.Schema(type=types.Type.STRING, description="The ID of the pending draft being confirmed"),
                    "ownership_token": types.Schema(type=types.Type.STRING, description="The ownership token for guest draft validation"),
                },
                required=[],
            ),
        ),
    ]

    return [types.Tool(function_declarations=declarations)]


def dispatch_tool_call(tool_name: str, tool_args: Optional[dict], context: dict) -> dict:
    """
    Executes a tool requested by Gemini, validating arguments and enforcing authorization.
    Rejects unauthorized or unregistered tool names.
    """
    args = tool_args if isinstance(tool_args, dict) else {}
    target_tool = TOOL_ALIASES.get(tool_name, tool_name)

    if target_tool not in ALLOWED_TOOLS:
        logger.warning(f"[Tool Registry] Unauthorized or unregistered tool call attempted: '{tool_name}'")
        return {
            "success": False,
            "error": f"Tool '{tool_name}' is not in the controlled allowlist.",
        }

    request = context.get("request")
    user = context.get("user")
    session_key = context.get("session_key")
    shown_product_ids = context.get("shown_product_ids", [])
    draft_context = context.get("draft_context")

    try:
        # 1. search_products
        if target_tool == "search_products":
            min_p = None
            max_p = None
            if "min_price" in args and args["min_price"] is not None:
                try:
                    min_p = float(args["min_price"])
                except (ValueError, TypeError):
                    min_p = None
            if "max_price" in args and args["max_price"] is not None:
                try:
                    max_p = float(args["max_price"])
                except (ValueError, TypeError):
                    max_p = None

            return execute_search_products(
                query=str(args.get("query", "")),
                category=str(args.get("category_slug", "") or args.get("target", "")),
                max_price=max_p,
                limit=4,
                exclude_ids=shown_product_ids,
            )

        # 2. get_product_details
        elif target_tool == "get_product_details":
            p_id = args.get("product_id")
            try:
                p_id_int = int(p_id) if p_id is not None else None
            except (ValueError, TypeError):
                p_id_int = None

            return execute_get_product_details(
                product_id=p_id_int,
                product_name=str(args.get("product_name", "")),
            )

        # 3. get_store_policies
        elif target_tool == "get_store_policies":
            return execute_get_store_policies(
                topic=str(args.get("topic", "all")),
            )

        # 4. manage_cart (and aliases get_cart_contents, add_item_to_cart, clear_cart)
        elif target_tool == "manage_cart":
            action = str(args.get("action", "get")).lower().strip()
            if tool_name == "get_cart_contents":
                action = "get"
            elif tool_name == "add_item_to_cart":
                action = "add"
            elif tool_name == "clear_cart":
                action = "clear"

            v_id = args.get("variant_id")
            try:
                v_id_int = int(v_id) if v_id is not None else None
            except (ValueError, TypeError):
                v_id_int = None

            qty = 1
            try:
                if "quantity" in args and args["quantity"] is not None:
                    qty = max(1, min(10, int(args["quantity"])))
            except (ValueError, TypeError):
                qty = 1

            return execute_manage_cart(
                action=action,
                variant_id=v_id_int,
                quantity=qty,
                product_id=args.get("product_id"),
                request=request,
                user=user,
                session_key=session_key,
            )

        # 5. track_order
        elif target_tool == "track_order":
            return execute_track_order(
                order_number=str(args.get("order_number", "")),
                phone=str(args.get("phone", "")),
                user=user,
                session_key=session_key,
            )

        # 6. prepare_order_draft (and alias place_conversational_order)
        elif target_tool == "prepare_order_draft":
            recipient = str(args.get("recipient_name") or args.get("full_name") or "")
            phone = str(args.get("phone", ""))
            address = str(args.get("address", ""))
            city = str(args.get("city", "Dhaka"))
            pay_method = str(args.get("payment_method", "cod"))

            return execute_prepare_order_draft(
                recipient_name=recipient,
                phone=phone,
                address=address,
                city=city,
                payment_method=pay_method,
                request=request,
                user=user,
                session_key=session_key,
            )

        # 7. confirm_order
        elif target_tool == "confirm_order":
            return execute_confirm_order(
                draft_id=args.get("draft_id"),
                ownership_token=args.get("ownership_token"),
                request=request,
                user=user,
                session_key=session_key,
                draft_context=draft_context,
            )

        else:
            return {"success": False, "error": f"Unhandled tool '{target_tool}'"}

    except Exception as e:
        error_kind = classify_error(e)
        log_sanitized_error(f"dispatch_tool_call:{target_tool}", e, session_id=session_key)
        if error_kind == GeminiErrorKind.PROGRAMMING:
            # Never swallow programming errors
            raise
        return {"success": False, "error": "Tool execution encountered a temporary problem."}
