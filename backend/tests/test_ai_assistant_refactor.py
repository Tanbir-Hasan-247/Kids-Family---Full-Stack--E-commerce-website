"""
Automated Verification Test Suite for AI Shopping Assistant Refactoring.
Tests:
1. Tightened deterministic guards:
   - Police threat vs Police Plaza inquiry
   - Allergy guidance without fabricated chemical/allergy-free guarantees
   - Boycott campaign vs general query
   - Bleach care inquiry vs damage complaint
2. Context Bleed & Target Switching:
   - "ছেলের পাঞ্জাবি" -> "এবার মেয়ের জন্য দেখাও" does not bleed 'panjabi' into girl search
3. Product card in-stock logic:
   - Products without variants return in_stock = False
4. Grounded Store Context & ShopSetting
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Configure UTF-8 encoding for test output
if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.append(os.path.abspath("backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
import django
django.setup()

from apps.ai_assistant.services import (
    detect_deterministic_intent_and_reply,
    format_product_card,
    get_store_context,
    find_recommended_products,
)
from apps.products.models import Product, ProductVariant


class AIAssistantRefactorTestSuite(unittest.TestCase):
    def setUp(self):
        self.ctx = {
            "shop_name": "Kids & Family",
            "delivery_inside_dhaka": 60.0,
            "delivery_outside_dhaka": 120.0,
            "phone": "+880 1700-000000",
            "whatsapp": "+880 1700-000000",
            "address": "Dhaka, Bangladesh",
            "hours": "10 AM - 8 PM",
            "email": "support@kidsandfamily.com",
            "categories": "Boys, Girls, Kids, Men, Women",
        }

    # --- 1. Police Threat Tightening Tests ---
    def test_police_plaza_inquiry_does_not_trigger_legal_threat(self):
        """'Police Plaza te dokan ache?' should NOT trigger legal_threat_deescalation."""
        msg = "Police Plaza te ki apnader dokan ache?"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertTrue(
            res is None or res.get("intent") != "legal_threat_deescalation",
            f"Expected not legal_threat_deescalation, got: {res}"
        )

    def test_police_dress_inquiry_does_not_trigger_legal_threat(self):
        """'Police er dress ache?' should NOT trigger legal threat."""
        msg = "বাচ্চাদের জন্য পুলিশের কোনো ড্রেস আছে কি?"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertTrue(
            res is None or res.get("intent") != "legal_threat_deescalation",
            f"Expected not legal_threat_deescalation, got: {res}"
        )

    def test_police_gd_threat_triggers_legal_threat(self):
        """'Police e gd korbo' MUST trigger legal_threat_deescalation."""
        msg = "আপনারা টাকা নিয়ে পার্সেল দেননি, আমি পুলিশে জিডি করব!"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("intent"), "legal_threat_deescalation")
        self.assertIn("Kids & Family", res.get("reply", ""))
        self.assertIn("+880 1700-000000", res.get("reply", ""))

    # --- 2. Allergy & Chemical Claim Grounding Tests ---
    def test_allergy_inquiry_does_not_make_fake_guarantees(self):
        """Allergy inquiry should NOT claim 100% allergy-free or chemical-free."""
        msg = "বাচ্চার ত্বকে র‍্যাশ উঠেছে, আপনাদের পোশাকে কি ক্ষতিকর কেমিক্যাল আছে?"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("intent"), "allergy_claim_response")
        reply = res.get("reply", "")
        # Must NOT make unverified fabricated medical guarantees
        self.assertNotIn("১০০% এলার্জিমুক্ত", reply)
        self.assertNotIn("সম্পূর্ণ নিরাপদ ও ক্ষতিকর কেমিক্যালমুক্ত উপকরণে প্রস্তুত", reply)
        # Must advise doctor consultation
        self.assertTrue("ডাক্তার" in reply or "চিকিৎসক" in reply)
        # Must provide customer care contact
        self.assertIn("+880 1700-000000", reply)

    # --- 3. Boycott Tightening Tests ---
    def test_boycott_general_inquiry_not_panic(self):
        """'Boycott niye apnader montobyo ki?' should NOT trigger boycott threat response."""
        msg = "মার্কেটে বয়কট ট্রেন্ড নিয়ে আপনাদের মন্তব্য কি?"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertTrue(
            res is None or res.get("intent") != "boycott_threat_deescalation",
            f"Expected not boycott_threat_deescalation, got: {res}"
        )

    def test_boycott_threat_triggers_deescalation(self):
        """'Apnader page boycott korbo facebook e' MUST trigger deescalation."""
        msg = "ডেলিভারি খারাপ দিলে আপনাদের ফেসবুক পেজ বয়কট করব!"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("intent"), "boycott_threat_deescalation")

    # --- 4. Bleach Wash Care vs Damage Tests ---
    def test_bleach_wash_care_advice(self):
        """Asking if bleach can be used should give polite wash-care advice."""
        msg = "এই পোশাকে কি ব্লিচ ব্যবহার করা যাবে?"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("intent"), "aftersales_bleach_damage")
        reply = res.get("reply", "")
        self.assertIn("মৃদু ডিটারজেন্ট", reply)
        self.assertNotIn("সেটির দায়ভার শপের নয়", reply)

    def test_bleach_damage_complaint(self):
        """Bleach damage complaint explains wash-care guidelines."""
        msg = "ব্লিচ দিয়ে ধোয়ায় কাপড় নষ্ট হয়ে রং চলে গেছে!"
        res = detect_deterministic_intent_and_reply(
            message=msg,
            lower=msg.lower(),
            ctx=self.ctx,
        )
        self.assertIsNotNone(res)
        self.assertEqual(res.get("intent"), "aftersales_bleach_damage")
        reply = res.get("reply", "")
        self.assertIn("কেয়ার লেবেল", reply)

    # --- 5. Product Card In-Stock Logic Tests ---
    def test_product_card_no_variants_is_out_of_stock(self):
        """A product with no variants must return in_stock = False."""
        mock_product = MagicMock()
        mock_product.id = 999
        mock_product.name = "Test Product Without Variants"
        mock_product.base_price = 500
        mock_product.category = None
        mock_product.variants.all.return_value = []

        card = format_product_card(mock_product)
        self.assertFalse(card["in_stock"], "Product without variants should be out of stock (False)!")

    def test_product_card_zero_stock_variants_is_out_of_stock(self):
        """A product whose variants all have stock=0 must return in_stock = False."""
        mock_product = MagicMock()
        mock_product.id = 998
        mock_product.name = "Test Product 0 Stock"
        mock_product.base_price = 600
        mock_product.category = None

        v1 = MagicMock()
        v1.id = 1
        v1.image = None
        v1.price = 600
        v1.compare_at_price = None
        v1.stock = 0
        v1.attributes.all.return_value = []

        mock_product.variants.all.return_value = [v1]

        card = format_product_card(mock_product)
        self.assertFalse(card["in_stock"], "Product with 0 stock variants should be out of stock (False)!")

    def test_product_card_positive_stock_is_in_stock(self):
        """A product with at least one variant stock > 0 must return in_stock = True."""
        mock_product = MagicMock()
        mock_product.id = 997
        mock_product.name = "Test Product In Stock"
        mock_product.base_price = 700
        mock_product.category = None

        v1 = MagicMock()
        v1.id = 2
        v1.image = None
        v1.price = 700
        v1.compare_at_price = None
        v1.stock = 5
        v1.attributes.all.return_value = []

        mock_product.variants.all.return_value = [v1]

        card = format_product_card(mock_product)
        self.assertTrue(card["in_stock"], "Product with stock > 0 should be in stock (True)!")

    # --- 6. Context Grounding in DB & ShopSetting ---
    def test_store_context_includes_email_and_pricing(self):
        """Store context must include email and dynamic delivery fees."""
        ctx = get_store_context()
        self.assertIn("shop_name", ctx)
        self.assertIn("delivery_inside_dhaka", ctx)
        self.assertIn("delivery_outside_dhaka", ctx)
        self.assertIn("email", ctx)
        self.assertEqual(ctx["delivery_inside_dhaka"], 60.0)
        self.assertEqual(ctx["delivery_outside_dhaka"], 120.0)

    # --- 7. Target Switch & History Bleed Prevention ---
    @patch("apps.ai_assistant.services.Category.objects")
    @patch("apps.ai_assistant.services.Product.objects")
    def test_target_switch_does_not_bleed_panjabi_to_girl(self, mock_product_objects, mock_category_objects):
        """
        Turn 1: 'ছেলের পাঞ্জাবি দেখাও'
        Turn 2: 'এবার মেয়ের জন্য দেখাও'
        In Turn 2, target is 'girl'. It must NOT bleed 'panjabi' keyword from Turn 1 history!
        """
        mock_girl_cat = MagicMock()
        mock_girl_cat.slug = "girl"
        mock_category_objects.filter.return_value.first.return_value = mock_girl_cat

        mock_qs = MagicMock()
        mock_product_objects.filter.return_value.select_related.return_value.prefetch_related.return_value.distinct.return_value = mock_qs
        mock_qs.exclude.return_value = mock_qs
        mock_qs.filter.return_value = mock_qs

        # Mock slice of results
        mock_product = MagicMock()
        mock_product.id = 101
        mock_product.name = "Girls Floral Dress"
        mock_product.base_price = 850
        mock_product.category = mock_girl_cat
        mock_product.variants.all.return_value = []
        mock_qs.__getitem__.return_value = [mock_product]

        history = [
            {"role": "user", "text": "ছেলের পাঞ্জাবি দেখাও"},
            {"role": "model", "text": "পাঞ্জাবির কালেকশন নিচে দেওয়া হলো।"},
        ]

        # Call recommender for turn 2
        find_recommended_products("এবার মেয়ের জন্য দেখাও", history=history, limit=4)

        # Inspect all calls to mock_qs.filter
        # None of the filter calls should filter for 'panjabi' or 'punjabi' or 'পাঞ্জাবি'
        for call_args in mock_qs.filter.call_args_list:
            args, kwargs = call_args
            for arg in args:
                arg_str = str(arg)
                self.assertNotIn("panjabi", arg_str.lower(), "Found 'panjabi' bled into girl category filter!")
                self.assertNotIn("punjabi", arg_str.lower(), "Found 'punjabi' bled into girl category filter!")
                self.assertNotIn("পাঞ্জাবি", arg_str, "Found 'পাঞ্জাবি' bled into girl category filter!")


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(AIAssistantRefactorTestSuite)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n[PASS] All AI Assistant Refactoring tests PASSED successfully!")
        sys.exit(0)
    else:
        print("\n[FAIL] Some tests failed!")
        sys.exit(1)
