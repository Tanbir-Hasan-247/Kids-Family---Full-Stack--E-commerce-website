import json
import logging
import os
import re
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

# Primary recommended current stable models verified live against Google Gemini API
PRIMARY_MODEL = "gemini-3.1-flash-lite"
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash"]
FALLBACK_STATIC_KEY = "AQ.Ab8RN6JuaZXRPt50-DQ0peN6K384diJ-Z-VOvRTZIkdI4bwfiA"


def get_api_key() -> str:
    """
    Dynamically retrieves Gemini API key from settings, environment,
    or directly from .env file on disk.
    """
    key = getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
    if key and key.strip():
        return key.strip()

    # Re-read from backend/.env if running process hasn't reloaded environment
    try:
        base_dir = getattr(settings, "BASE_DIR", None)
        if not base_dir:
            base_dir = Path(__file__).resolve().parent.parent.parent
        env_path = Path(base_dir) / ".env"
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY=") and len(line) > len("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip()
                        if val:
                            return val
    except Exception as e:
        logger.warning(f"Error reading .env on the fly: {e}")

    return FALLBACK_STATIC_KEY


def get_gemini_client():
    """
    Returns a configured Google GenAI client.
    """
    api_key = get_api_key()
    if not api_key:
        return None

    try:
        from google import genai
        return genai.Client(api_key=api_key, http_options={"api_version": "v1alpha", "timeout": 15000})
    except Exception as e:
        logger.error(f"Failed to initialize Google GenAI Client: {e}")
        return None


def call_gemini_text(prompt: str, system_instruction: str = "") -> str:
    """
    Calls Gemini API using Google GenAI SDK.
    Tries primary model gemini-3.5-flash-lite, falling back across models if needed.
    """
    client = get_gemini_client()
    if not client:
        logger.error("Gemini client could not be created!")
        return ""

    from google.genai import types

    models_to_try = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]

    for model_name in models_to_try:
        try:
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response and hasattr(response, "text") and response.text:
                return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini call with {model_name} failed: {e}")
            continue

    return ""


def call_gemini_json(prompt: str, system_instruction: str = "") -> dict:
    """
    Calls Gemini API and parses the response as JSON.
    """
    full_prompt = (
        f"{prompt}\n\n"
        "IMPORTANT: You MUST respond ONLY with valid raw JSON (no markdown formatting, no ```json or ``` code fences)."
    )
    raw_text = call_gemini_text(full_prompt, system_instruction=system_instruction)
    if not raw_text:
        return {}

    # Strip code block marks if model wrapped output in ```json ... ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"```$", "", cleaned.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(cleaned)
    except Exception as e:
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        logger.warning(f"Failed to parse Gemini output as JSON: {e}\nRaw: {raw_text[:200]}")
        return {}
