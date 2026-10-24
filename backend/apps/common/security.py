import hmac
import hashlib


def verify_webhook_hmac(payload_bytes: bytes, received_signature: str, secret_key: str, algorithm="sha256") -> bool:
    """
    Verifies that a webhook payload was signed with the corresponding HMAC secret key.
    Uses hmac.compare_digest to prevent timing attacks.

    :param payload_bytes: Raw request body as bytes (request.body)
    :param received_signature: The HMAC signature string provided in headers
    :param secret_key: Shared secret key for the webhook
    :param algorithm: Hash algorithm ('sha256' default)
    :return: True if valid, False otherwise
    """
    if not received_signature or not secret_key:
        return False

    hash_func = getattr(hashlib, algorithm, hashlib.sha256)
    expected_signature = hmac.new(
        key=secret_key.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hash_func,
    ).hexdigest()

    # Clean signature prefixes if present (e.g., 'sha256=abcdef...')
    if "=" in received_signature:
        received_signature = received_signature.split("=", 1)[1]

    return hmac.compare_digest(expected_signature.lower(), received_signature.lower().strip())

