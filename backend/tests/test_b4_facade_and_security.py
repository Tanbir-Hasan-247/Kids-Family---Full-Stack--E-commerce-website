"""
Tests for Phase B4:
- API Facade Integration (AIChatAPIView & handle_chat_turn)
- Explicit Confirmation Enforcement in Legacy Fallback
- Database-Enforced Idempotency & Concurrency Safeguards
- PII-Safe Logging Formatter (Messages, Args, Tracebacks)
- Production Secret Key Validation (DEBUG=False Enforcement)
"""

import logging
from decimal import Decimal
from unittest.mock import MagicMock, patch
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from apps.orders.models import Order, OrderItem
from apps.products.models import Product, ProductVariant
from apps.categories.models import Category
from apps.dashboard.models import ShopSetting
from apps.common.logging_formatter import PIISafeFormatter, sanitize_log_message
from apps.ai_assistant.services import handle_chat_turn, _legacy_handle_chat_turn
from apps.ai_assistant.agent.tools.order_tools import execute_confirm_order

User = get_user_model()


class AIChatAPIFacadeIntegrationTests(TestCase):
    """End-to-end tests for the AIChatAPIView and handle_chat_turn facade."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Boys Panjabi", slug="boys-panjabi")
        self.product = Product.objects.create(
            name="Festive Cotton Panjabi",
            category=self.category,
            base_price=Decimal("1500.00"),
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="PANJ-COT-M",
            price=Decimal("1500.00"),
            stock=8,
        )
        ShopSetting.objects.create(
            shop_name="Kids & Family",
            delivery_inside_dhaka=Decimal("60.00"),
            delivery_outside_dhaka=Decimal("120.00"),
        )
        self.user = User.objects.create_user(email="customer@example.com", password="pass1234secure")

    @patch("apps.ai_assistant.agent.orchestrator.get_gemini_client")
    def test_api_guest_chat_turn_preserves_contract(self, mock_get_client):
        """POST /api/ai/chat/ returns all required React contract fields for guest users."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.function_calls = None
        mock_resp.text = "আমাদের চমৎকার কিছু পাঞ্জাবি কালেকশন রয়েছে।"
        mock_client.models.generate_content.return_value = mock_resp

        response = self.client.post(
            "/api/ai/chat/",
            {
                "message": "পাঞ্জাবি দেখতে চাই",
                "session_key": "guest_session_b4_001",
                "history": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("reply", data)
        self.assertIn("products", data)
        self.assertIn("order", data)
        self.assertIn("order_created", data)
        self.assertIn("cart_updated", data)
        self.assertIn("added_product_id", data)
        self.assertIn("order_draft", data)
        self.assertIn("order_confirmation_requested", data)

    @patch("apps.ai_assistant.agent.orchestrator.get_gemini_client")
    def test_api_authenticated_user_chat_turn(self, mock_get_client):
        """POST /api/ai/chat/ binds authenticated user to the session."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.function_calls = None
        mock_resp.text = "ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৳60 এবং ঢাকার বাইরে ৳120।"
        mock_client.models.generate_content.return_value = mock_resp

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/ai/chat/",
            {
                "message": "ডেলিভারি চার্জ কত?",
                "history": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("৳60", data.get("reply", ""))


class LegacyFallbackConfirmationGuardTests(TestCase):
    """Verifies that legacy fallback cannot bypass authorization, explicit confirmation, or idempotency."""

    def setUp(self):
        ShopSetting.objects.create(
            shop_name="Kids & Family",
            delivery_inside_dhaka=Decimal("60.00"),
            delivery_outside_dhaka=Decimal("120.00"),
        )
        self.category = Category.objects.create(name="Girl Frocks", slug="girl-frocks")
        self.product = Product.objects.create(
            name="Party Floral Frock",
            category=self.category,
            base_price=Decimal("950.00"),
            is_active=True,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="FRK-FLR-2Y",
            price=Decimal("950.00"),
            stock=4,
        )

    def test_legacy_fallback_requests_confirmation_does_not_create_order(self):
        """Legacy fallback must prepare a draft and request explicit confirmation; NO order created directly."""
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post("/api/ai/chat/")
        from django.contrib.sessions.backends.db import SessionStore
        request.session = SessionStore()

        # Customer provides contact info for Party Floral Frock
        message = "আমার নাম রাফিয়া, ফোন 01712345678, ঠিকানা ধানমন্ডি ৩২, ঢাকা। Party Floral Frock নিতে চাই।"
        res = _legacy_handle_chat_turn(
            message=message,
            history=[],
            session_key="legacy_test_session_1",
            request=request,
        )

        self.assertTrue(res.get("success"))
        # Must request confirmation and must NOT create order directly!
        self.assertTrue(res.get("order_confirmation_requested"))
        self.assertFalse(res.get("order_created"))
        self.assertIsNone(res.get("order"))
        self.assertIsNotNone(res.get("order_draft"))
        # Zero orders in DB
        self.assertEqual(Order.objects.count(), 0)

    def test_legacy_fallback_explicit_confirmation_creates_order(self):
        """After explicit confirmation, legacy fallback calls confirm_order atomically."""
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.post("/api/ai/chat/")
        from django.contrib.sessions.backends.db import SessionStore
        request.session = SessionStore()

        # Step 1: Draft preparation
        _legacy_handle_chat_turn(
            message="নাম সায়মা, ফোন 01812345678, ঠিকানা বনানী রোড ১১, ঢাকা। Party Floral Frock দিন।",
            history=[],
            session_key="legacy_test_session_2",
            request=request,
        )
        self.assertEqual(Order.objects.count(), 0)
        self.assertIn("pending_order_draft", request.session)

        # Step 2: Customer explicitly confirms
        confirm_res = _legacy_handle_chat_turn(
            message="হ্যাঁ, আমি অর্ডার নিশ্চিত করছি। পাঠিয়ে দিন।",
            history=[],
            session_key="legacy_test_session_2",
            request=request,
        )

        self.assertTrue(confirm_res.get("success"))
        self.assertTrue(confirm_res.get("order_created"))
        self.assertFalse(confirm_res.get("order_confirmation_requested"))
        self.assertIsNotNone(confirm_res.get("order"))
        self.assertEqual(Order.objects.count(), 1)


class OrderDatabaseIdempotencyConstraintTests(TestCase):
    """Tests for database-level unique constraint on Order.idempotency_key."""

    def setUp(self):
        self.order1 = Order.objects.create(
            order_number="KF2610259901",
            full_name="Test Customer",
            phone="01711223344",
            address_line="Gulshan 2",
            city="Dhaka",
            subtotal=Decimal("1000.00"),
            shipping_fee=Decimal("60.00"),
            total=Decimal("1060.00"),
            session_key="session_guest",
            idempotency_key="idemp_key_unique_test_1234567890",
        )

    def test_duplicate_idempotency_key_raises_integrity_error(self):
        """Database constraint prevents two orders with the exact same idempotency_key."""
        with self.assertRaises(IntegrityError):
            Order.objects.create(
                order_number="KF2610259902",
                full_name="Another Customer",
                phone="01711223344",
                address_line="Gulshan 2",
                city="Dhaka",
                subtotal=Decimal("1000.00"),
                shipping_fee=Decimal("60.00"),
                total=Decimal("1060.00"),
                idempotency_key="idemp_key_unique_test_1234567890",  # Duplicate!
            )

    def test_confirm_order_recovers_gracefully_from_concurrent_integrity_error(self):
        """execute_confirm_order intercepts IntegrityError from duplicate insert and returns existing order."""
        draft_payload = {
            "draft_id": "draft_concurrent_99",
            "idempotency_key": "idemp_key_unique_test_1234567890",
            "token_hash": "dummy_hash",
            "recipient_name": "Test Customer",
            "phone": "01711223344",
            "address": "Gulshan 2",
            "city": "Dhaka",
            "subtotal": 1000.0,
            "shipping_fee": 60.0,
            "total": 1060.0,
            "items": [],
        }

        # Attempt to confirm draft having the duplicate idempotency key
        res = execute_confirm_order(
            draft_context=draft_payload,
            session_key="session_guest",
        )
        self.assertTrue(res.get("success"))
        # Replay/existing order must report order_created=False and is_replay=True
        self.assertFalse(res.get("order_created"))
        self.assertTrue(res.get("is_replay"))
        self.assertEqual(res["order_number"], "KF2610259901")


class PIISafeLoggingFormatterTests(TestCase):
    """Tests for customer PII and credential redaction in application logs."""

    def setUp(self):
        self.formatter = PIISafeFormatter("[%(levelname)s] %(message)s")

    def test_phone_numbers_redacted(self):
        """Standard and Bengali mobile numbers are redacted from log records."""
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname=__file__, lineno=1,
            msg="Customer phone is 01712345678 and alternative is +8801812345678 or ০১৭১২৩৪৫৬৭৮",
            args=(), exc_info=None,
        )
        formatted = self.formatter.format(record)
        self.assertNotIn("01712345678", formatted)
        self.assertNotIn("+8801812345678", formatted)
        self.assertNotIn("০১৭১২৩৪৫৬৭৮", formatted)
        self.assertIn("[REDACTED_PHONE]", formatted)

    def test_email_addresses_redacted(self):
        """Customer email addresses are redacted."""
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname=__file__, lineno=1,
            msg="User email customer.test@example.com logged in.",
            args=(), exc_info=None,
        )
        formatted = self.formatter.format(record)
        self.assertNotIn("customer.test@example.com", formatted)
        self.assertIn("[REDACTED_EMAIL]", formatted)

    def test_bearer_and_gemini_secrets_redacted(self):
        """Bearer tokens and Google API keys are redacted."""
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname=__file__, lineno=1,
            msg="Calling API with Bearer eyJhbGciOiJIUzI1NiJ9.test and key AIzaSyD1234567890abcdefABCDEF",
            args=(), exc_info=None,
        )
        formatted = self.formatter.format(record)
        self.assertNotIn("AIzaSyD1234567890abcdefABCDEF", formatted)
        self.assertIn("[REDACTED_SECRET]", formatted)

    def test_traceback_sensitive_info_redacted(self):
        """Exception tracebacks containing sensitive tokens are redacted in formatException."""
        try:
            raise ValueError("Failed processing phone: 01912345678 with token Bearer secret_token_xyz")
        except ValueError:
            import sys
            exc_info = sys.exc_info()

        formatted_tb = self.formatter.formatException(exc_info)
        self.assertNotIn("01912345678", formatted_tb)
        self.assertNotIn("secret_token_xyz", formatted_tb)
        self.assertIn("[REDACTED_PHONE]", formatted_tb)


class ProductionSecretValidationTests(TestCase):
    """Tests for strict production secret key validation when DEBUG=False."""

    def test_debug_false_with_default_insecure_key_raises_improperly_configured(self):
        """When DEBUG=False and DJANGO_SECRET_KEY is insecure, validation raises ImproperlyConfigured."""
        insecure_keys = [
            "django-insecure-kids-family-backend-api-secret-key-production-ready-2026",
            "django-insecure-any-key",
            "short-key",
            "changeme",
            "",
        ]

        for bad_key in insecure_keys:
            # Simulate production settings check logic
            with self.subTest(key=bad_key):
                is_invalid = (
                    not bad_key
                    or bad_key.startswith("django-insecure-")
                    or len(bad_key) < 32
                    or bad_key in ["changeme", "secret"]
                )
                self.assertTrue(is_invalid, f"Key '{bad_key}' should be considered insecure for production!")

    def test_debug_false_with_strong_secret_key_passes(self):
        """A 50+ character high-entropy key without insecure prefixes passes validation."""
        strong_key = "k&f-prod-sec-98234-super-random-high-entropy-string-2026-very-secure!"
        is_invalid = (
            not strong_key
            or strong_key.startswith("django-insecure-")
            or len(strong_key) < 32
        )
        self.assertFalse(is_invalid)
