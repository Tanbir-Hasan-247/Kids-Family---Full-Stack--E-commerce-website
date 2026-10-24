"""
PII-Safe Logging Formatter facade.
Re-exports from apps.common.logging_formatter for modular access.
"""

from apps.common.logging_formatter import (
    PIISafeFormatter,
    sanitize_log_message,
    PHONE_PATTERN,
    EMAIL_PATTERN,
    SECRET_PATTERN,
    ADDRESS_PATTERN,
    TOKEN_PARAM_PATTERN,
)

__all__ = [
    "PIISafeFormatter",
    "sanitize_log_message",
    "PHONE_PATTERN",
    "EMAIL_PATTERN",
    "SECRET_PATTERN",
    "ADDRESS_PATTERN",
    "TOKEN_PARAM_PATTERN",
]

