"""
PII-Safe Logging Formatter for Kids & Family Backend.
Sanitizes customer personally identifiable information (PII) including phone numbers,
emails, street addresses, bearer tokens, guest session keys, and API secrets from logs.

DISCLAIMER:
Regex-based redaction provides an essential defense-in-depth privacy safeguard against
accidental credential and PII leakage in application logs, but does not mathematically
guarantee 100% removal of all unstructured natural-language personal data.
"""

import re
import logging
from typing import Any

# Defense-in-depth masking patterns
PHONE_PATTERN = re.compile(
    r'(?:\+?(?:880|৮৮০)|0|০)[1১][3-9৩-৯](?:[\s\-\.]*[\d০-৯]){8}',
    re.UNICODE
)
EMAIL_PATTERN = re.compile(
    r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
)
SECRET_PATTERN = re.compile(
    r'(?:Bearer\s+[a-zA-Z0-9_\-\.]+)|(?:AIza[0-9A-Za-z\-_]{16,40})|(?:AQ\.[a-zA-Z0-9_\-\.]+)|(?:guest_cart:[a-zA-Z0-9_\-\:]+)',
    re.IGNORECASE
)
ADDRESS_PATTERN = re.compile(
    r'(?:House|Road|Flat|Sector|Block|Holding|Village|বাসা|রোড|সেক্টর|ব্লক)[\s\w\-\,\.\#\u0980-\u09FF]{3,40}',
    re.IGNORECASE | re.UNICODE
)
TOKEN_PARAM_PATTERN = re.compile(
    r'(?:ownership_token|guest_token|session_key|idempotency_key)[\'\":\s=]+([a-zA-Z0-9_\-\:]{16,})',
    re.IGNORECASE
)


def sanitize_log_message(msg: str) -> str:
    """Sanitizes sensitive values in a log message string."""
    if not isinstance(msg, str) or not msg:
        return ""

    redacted = SECRET_PATTERN.sub("[REDACTED_SECRET]", msg)
    redacted = TOKEN_PARAM_PATTERN.sub(r'\1: [REDACTED_TOKEN]', redacted)
    redacted = PHONE_PATTERN.sub("[REDACTED_PHONE]", redacted)
    redacted = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", redacted)
    redacted = ADDRESS_PATTERN.sub("[REDACTED_ADDRESS]", redacted)
    return redacted


class PIISafeFormatter(logging.Formatter):
    """
    Custom Logging Formatter that intercepts and redacts customer PII
    and credentials from log messages, arguments, and exception tracebacks.
    """

    def format(self, record: logging.LogRecord) -> str:
        # Sanitize message arguments if any
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: sanitize_log_message(str(v)) if isinstance(v, str) else v for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(sanitize_log_message(str(a)) if isinstance(a, str) else a for a in record.args)

        formatted = super().format(record)
        return sanitize_log_message(formatted)

    def formatException(self, ei: Any) -> str:
        raw_traceback = super().formatException(ei)
        return sanitize_log_message(raw_traceback)

