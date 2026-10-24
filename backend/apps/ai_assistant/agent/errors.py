"""
Error classification and taxonomy for Gemini API and agent execution.
Explicitly distinguishes transient provider/network errors from configuration
and programming errors to prevent silent bug swallowing.
"""

from enum import Enum
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class GeminiErrorKind(Enum):
    TRANSIENT = "transient"          # 429 rate limit, 503/500 server error, network timeout
    CONFIGURATION = "configuration"  # 401/403 invalid key, 404 model retired/invalid ID
    PROGRAMMING = "programming"      # TypeError, KeyError, AttributeError, local logic bugs


def classify_error(exc: Exception) -> GeminiErrorKind:
    """
    Classifies an exception into TRANSIENT, CONFIGURATION, or PROGRAMMING.
    
    Guarantees:
    - Standard Python programming errors (TypeError, AttributeError, etc.) are
      classified as PROGRAMMING and must never be masked as simple network retries.
    - Transient Google API / HTTPX network failures are marked for failover or retry.
    - Fatal authentication and invalid model errors are marked as CONFIGURATION alerts.
    """
    if isinstance(exc, (TypeError, AttributeError, NameError, KeyError, IndexError, SyntaxError)):
        return GeminiErrorKind.PROGRAMMING

    exc_str = str(exc).lower()
    exc_type = type(exc).__name__

    # HTTPX and network connection errors
    if any(k in exc_type.lower() or k in exc_str for k in ["timeout", "connecterror", "network", "getaddrinfo"]):
        return GeminiErrorKind.TRANSIENT

    # Google GenAI error taxonomy
    code = getattr(exc, "code", None)
    if code is not None:
        if code == 429 or code >= 500:
            return GeminiErrorKind.TRANSIENT
        if code in (400, 401, 403, 404):
            return GeminiErrorKind.CONFIGURATION

    # String-based status code matching for wrapped API errors
    if any(status in exc_str for status in ["429", "500", "502", "503", "504", "resource_exhausted", "unavailable"]):
        return GeminiErrorKind.TRANSIENT
    if any(status in exc_str for status in ["401", "403", "404", "permission_denied", "not_found", "unauthenticated"]):
        return GeminiErrorKind.CONFIGURATION

    # Default unrecognized exceptions to programming errors so they are logged with full stack traces
    return GeminiErrorKind.PROGRAMMING


def log_sanitized_error(event_name: str, exc: Exception, session_id: Optional[str] = None):
    """
    Logs an agent exception safely without exposing customer PII, tokens, or raw request bodies.
    """
    error_kind = classify_error(exc)
    exc_type = type(exc).__name__
    
    # Strip any potential sensitive parameters from the error string representation
    safe_msg = f"[{event_name}] Kind: {error_kind.value} | Type: {exc_type}"

    if error_kind == GeminiErrorKind.PROGRAMMING:
        # Programming errors must be logged with exc_info so developers can fix bugs
        logger.error(safe_msg, exc_info=True, extra={"session_id": session_id})
    elif error_kind == GeminiErrorKind.CONFIGURATION:
        logger.critical(safe_msg, extra={"session_id": session_id})
    else:
        logger.warning(safe_msg, extra={"session_id": session_id})

