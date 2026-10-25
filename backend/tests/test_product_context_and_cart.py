"""
Comprehensive Regression Test Suite for AI Shopping Assistant:
Product Context Memory, Variant Resolution, and Cart Operations.

Tests:
1. Search product -> add White M to cart (unavailable combination -> accurate explanation & confirmed alternatives)
2. Search product -> ask about White L (variant exists and confirmed in-stock)
3. Search product -> ask 'pink M' (variant exists and confirmed in-stock)
4. Follow-up in Bangla and Banglish (adds verified variant to real database CartItem)
5. Valid color/size but insufficient stock (stock=0 or qty > stock -> rejected with live stock count)
6. Nonexistent variant (rejected with database-confirmed options)
7. Product exists but variant lookup fails
8. Lost conversation context (asks targeted clarification, never claims product does not exist)
9. Guest-cart/session continuity (guest cart retained and mutated correctly)
10. Unauthorized cart access (strict session/user isolation)
11. Tool exception and frontend response handling (graceful contract adherence)
"""

from decimal import Decimal
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.sessions.backends.db import SessionStore

from apps.categories.models import Category
from apps.products.models import Product, ProductVariant, AttributeType, AttributeValue
from apps.cart.models import Cart, CartItem
from apps.dashboard.models import ShopSetting
from apps.ai_assistant.agent.orchestrator import AgentOrchestrator
from apps.ai_assistant.agent.tools.cart_tools import execute_manage_cart
from apps.ai_assistant.agent.tools.product_tools import (
    resolve_variant_for_product,
    execute_search_products,
    execute_get_product_details,
    extract_color_from_text,
    extract_size_from_text,
)
from apps.ai_assistant.agent.context import ContextManager
from apps.ai_assistant.services import format_product_card

User = get_user_model()


class ProductContextAndCartRegressionTests(TestCase):
    """Real database fixtures and end-to-end multi-turn assertions."""

    def setUp(self):
        ShopSetting.objects.create(
            shop_name="Kids & Family",
            delivery_inside_dhaka=Decimal("60.00"),
            delivery_outside_dhaka=Decimal("120.00"),
            phone="+880 1700-000000",
        )

        self.category = Category.objects.create(
            name="Western & Co-Ord Sets",
            slug="western-co-ord-sets",
        )

        # Create Product 60: Embellished Pleated Co-ord Set
        self.product = Product.objects.create(
            id=60,
            name="Embellished Pleated Co-ord Set",
            category=self.category,
            description="Luxury embellished pleated co-ord set for women and festive wear.",
            base_price=Decimal("1940.00"),
            is_active=True,
        )

        # Attribute Types
        self.attr_color, _ = AttributeType.objects.get_or_create(id=1, name="Color")
        self.attr_size, _ = AttributeType.objects.get_or_create(id=2, name="Size")

        # Attribute Values
        self.val_white = AttributeValue.objects.create(attribute_type=self.attr_color, value="White")
        self.val_pink = AttributeValue.objects.create(attribute_type=self.attr_color, value="Pink")
        self.val_m = AttributeValue.objects.create(attribute_type=self.attr_size, value="M")
        self.val_l = AttributeValue.objects.create(attribute_type=self.attr_size, value="L")

        # Variant 188: Pink (no size), Stock: 18
        self.variant_188 = ProductVariant.objects.create(
            id=188,
            product=self.product,
            sku="KF-3337-1109",
            price=Decimal("1940.00"),
            stock=18,
        )
        self.variant_188.attributes.add(self.val_pink)

        # Variant 189: Pink, Size M, Stock: 20
        self.variant_189 = ProductVariant.objects.create(
            id=189,
            product=self.product,
            sku="KF-3337-1110",
            price=Decimal("1940.00"),
            stock=20,
        )
        self.variant_189.attributes.add(self.val_pink, self.val_m)

        # Variant 190: White, Size L, Stock: 22
        self.variant_190 = ProductVariant.objects.create(
            id=190,
            product=self.product,
            sku="KF-3337-1111",
            price=Decimal("1940.00"),
            stock=22,
        )
        self.variant_190.attributes.add(self.val_white, self.val_l)

        # Single out-of-stock product for stock tests
        self.oos_product = Product.objects.create(
            id=70,
            name="Baby Cotton Frock",
            category=self.category,
            description="Cotton frock",
            base_price=Decimal("850.00"),
            is_active=True,
        )
        self.val_red = AttributeValue.objects.create(attribute_type=self.attr_color, value="Red")
        self.val_s = AttributeValue.objects.create(attribute_type=self.attr_size, value="S")
        self.oos_variant = ProductVariant.objects.create(
            id=195,
            product=self.oos_product,
            sku="FROCK-RED-S",
            price=Decimal("850.00"),
            stock=0,  # Zero stock
        )
        self.oos_variant.attributes.add(self.val_red, self.val_s)

        self.factory = RequestFactory()
        self.session_key = "test_user_session_abc123"

        # Standard simulated history where Product 60 was recommended
        self.card_60 = format_product_card(self.product)
        self.history_with_product_60 = [
            {"role": "user", "text": "Embellished Pleated Co-ord Set"},
            {
                "role": "model",
                "text": "আমাদের কাছে Embellished Pleated Co-ord Set রয়েছে (মূল্য: ৳১,৯৪০)। পাওয়া যাচ্ছে White ও Pink কালারে এবং M ও L সাইজে।",
                "products": [self.card_60],
                "product_ids": [60],
            },
        ]

    # 1. Search product -> add White M to cart
    def test_search_product_then_add_unavailable_white_m(self):
        """
        Product 60 does not have White M (White only has L, M only has Pink).
        Must NOT fabricate a variant or add to cart.
        Must accurately explain unavailability and offer real confirmed alternatives (White L, Pink M).
        """
        res = AgentOrchestrator.run(
            "white M size cart e add koro",
            history=self.history_with_product_60,
            session_key=self.session_key,
        )
        self.assertTrue(res.get("success"))
        self.assertFalse(res.get("cart_updated"))
        reply = res.get("reply", "")

        # Must mention that White M is not in stock
        self.assertTrue("White" in reply or "সাদা" in reply)
        self.assertTrue("M" in reply)
        self.assertTrue("স্টকে নেই" in reply or "অনুপলব্ধ" in reply or "নেই" in reply)

        # Must offer confirmed options from database
        self.assertIn("White", reply)
        self.assertIn("L", reply)
        self.assertIn("Pink", reply)

        # Assert no CartItem was created in the database
        self.assertEqual(CartItem.objects.filter(variant__product_id=60).count(), 0)

    # 2. Search product -> ask about White L
    def test_search_product_then_ask_white_l_size(self):
        """
        White L exists in real DB (Variant 190, Stock 22).
        Must confirm live availability, stock, and price without error.
        """
        res = AgentOrchestrator.run(
            "White L size ?",
            history=self.history_with_product_60,
            session_key=self.session_key,
        )
        self.assertTrue(res.get("success"))
        reply = res.get("reply", "")

        self.assertTrue("হ্যাঁ" in reply or "অ্যাভেইলেবল" in reply or "রয়েছে" in reply)
        self.assertIn("1940", reply.replace(",", ""))
        self.assertIn("22", reply)

        # Card must remain attached
        self.assertGreaterEqual(len(res.get("products", [])), 1)
        self.assertEqual(res["products"][0]["id"], 60)

    # 3. Search product -> ask 'pink M'
    def test_search_product_then_ask_pink_m(self):
        """
        Pink M exists in real DB (Variant 189, Stock 20).
        Must confirm availability and stock.
        """
        res = AgentOrchestrator.run(
            "pink M",
            history=self.history_with_product_60,
            session_key=self.session_key,
        )
        self.assertTrue(res.get("success"))
        reply = res.get("reply", "")

        self.assertTrue("Pink" in reply or "গোলাপি" in reply)
        self.assertIn("M", reply)
        self.assertIn("20", reply)
        self.assertGreaterEqual(len(res.get("products", [])), 1)
        self.assertEqual(res["products"][0]["id"], 60)

    # 4. Follow-up in Bangla and Banglish (adds verified variant to DB cart)
    def test_follow_up_add_white_l_to_cart_in_bangla_and_banglish(self):
        """
        Adding White L must mutate real database CartItem with exact Variant ID 190.
        """
        # Test Banglish
        res1 = AgentOrchestrator.run(
            "White L size cart e add koro",
            history=self.history_with_product_60,
            session_key=self.session_key,
        )
        self.assertTrue(res1.get("success"))
        self.assertTrue(res1.get("cart_updated"))
        self.assertEqual(res1.get("added_product_id"), 60)

        # Verify real database CartItem
        cart = Cart.objects.get(session_key=self.session_key)
        self.assertEqual(cart.total_items, 1)
        self.assertEqual(cart.total_price, Decimal("1940.00"))
        cart_item = CartItem.objects.get(cart=cart, variant_id=self.variant_190.id)
        self.assertEqual(cart_item.quantity, 1)
        self.assertEqual(cart_item.variant.sku, "KF-3337-1111")

        # Test Bangla script: "গোলাপি M সাইজ কার্টে যোগ করুন"
        res2 = AgentOrchestrator.run(
            "গোলাপি M সাইজ কার্টে যোগ করুন",
            history=self.history_with_product_60,
            session_key=self.session_key,
        )
        self.assertTrue(res2.get("success"))
        self.assertTrue(res2.get("cart_updated"))

        cart.refresh_from_db()
        self.assertEqual(cart.total_items, 2)
        self.assertTrue(CartItem.objects.filter(cart=cart, variant_id=self.variant_189.id).exists())

    # 5. Valid color/size but insufficient stock
    def test_insufficient_stock_rejection(self):
        """
        When requested variant has 0 stock or requested quantity > stock,
        must reject addition and return safe stock diagnostics.
        """
        res = execute_manage_cart(
            action="add",
            product_id=self.oos_product.id,
            color="Red",
            size="S",
            quantity=1,
            session_key=self.session_key,
        )
        self.assertFalse(res.get("success"))
        self.assertEqual(res.get("error_code"), "out_of_stock")
        self.assertIn("স্টকে নেই", res.get("error", ""))

        # Requesting quantity > stock for variant 188 (stock 18)
        res_exceed = execute_manage_cart(
            action="add",
            variant_id=self.variant_188.id,
            quantity=25,
            session_key=self.session_key,
        )
        self.assertFalse(res_exceed.get("success"))
        self.assertEqual(res_exceed.get("error_code"), "insufficient_stock")
        self.assertEqual(res_exceed.get("stock"), 18)

    # 6. Nonexistent variant
    def test_nonexistent_variant_resolution(self):
        """Requesting color/size that does not exist in catalog."""
        res = resolve_variant_for_product(
            product_id=self.product.id,
            color="Blue",
            size="XXL",
        )
        self.assertFalse(res.get("success"))
        self.assertEqual(res.get("reason"), "variant_not_found")
        self.assertIn("White", res.get("confirmed_options", {}))
        self.assertIn("Pink", res.get("confirmed_options", {}))

    # 7. Product exists but variant lookup fails
    def test_product_exists_variant_lookup_fails(self):
        res = execute_manage_cart(
            action="add",
            product_id=self.product.id,
            color="Green",
            size="XXXL",
            session_key=self.session_key,
        )
        self.assertFalse(res.get("success"))
        self.assertEqual(res.get("error_code"), "variant_unavailable")
        self.assertIn("White", res.get("error", ""))

    # 8. Lost conversation context (asks targeted clarification, never claims product does not exist)
    def test_lost_conversation_context_asks_clarification(self):
        """
        When history is empty and user says 'M size cart e add koro',
        assistant must ask targeted clarification, NOT claim the product is missing.
        """
        res = AgentOrchestrator.run(
            "M size cart e add koro",
            history=[],
            session_key="empty_history_session",
        )
        self.assertTrue(res.get("success"))
        self.assertEqual(res.get("intent"), "clarification_needed")
        reply = res.get("reply", "")
        self.assertTrue("কোন পোশাকটি" in reply or "নাম" in reply)
        self.assertNotIn("পণ্যটি খুঁজে পাওয়া যায়নি", reply)

    # 9. Guest-cart/session continuity
    def test_guest_cart_session_continuity(self):
        """Guest cart is created and updated using session_key strictly."""
        guest_session = "guest_sess_token_xyz789"
        res = execute_manage_cart(
            action="add",
            variant_id=self.variant_190.id,
            quantity=2,
            session_key=guest_session,
        )
        self.assertTrue(res.get("success"))
        self.assertEqual(res.get("total_items"), 2)

        # Inspect cart
        get_res = execute_manage_cart(action="get", session_key=guest_session)
        self.assertTrue(get_res.get("success"))
        self.assertEqual(get_res.get("total_items"), 2)
        self.assertEqual(len(get_res.get("items", [])), 1)
        self.assertEqual(get_res["items"][0]["variant_id"], self.variant_190.id)

    # 10. Unauthorized cart access
    def test_unauthorized_cart_access_isolation(self):
        """User A cannot access or mutate User B's cart."""
        user_a = User.objects.create_user(email="user_a@example.com", password="password123")
        user_b = User.objects.create_user(email="user_b@example.com", password="password123")

        # User A adds item
        res_a = execute_manage_cart(
            action="add",
            variant_id=self.variant_189.id,
            quantity=1,
            user=user_a,
        )
        self.assertTrue(res_a.get("success"))

        # User B reads cart
        res_b = execute_manage_cart(
            action="get",
            user=user_b,
        )
        self.assertTrue(res_b.get("success"))
        self.assertEqual(res_b.get("total_items"), 0)
        self.assertEqual(len(res_b.get("items", [])), 0)

    # 11. Tool exception and frontend response handling
    def test_tool_exception_frontend_contract(self):
        """
        Exceptions in tool calls are caught, logged safely, and return standard contract dict.
        """
        # Call with invalid action
        res = execute_manage_cart(
            action="invalid_action_xyz",
            session_key=self.session_key,
        )
        self.assertFalse(res.get("success"))
        self.assertIn("error", res)

        # AIChatAPIView / orchestrator contract fields check
        run_res = AgentOrchestrator.run("Hello", history=[], session_key=self.session_key)
        expected_fields = [
            "success", "reply", "products", "order", "order_created",
            "cart_updated", "added_product_id", "order_draft", "order_confirmation_requested", "intent"
        ]
        for field in expected_fields:
            self.assertIn(field, run_res)

