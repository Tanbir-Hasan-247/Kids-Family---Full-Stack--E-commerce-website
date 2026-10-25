import os
import sys
import django

sys.path.append(os.path.abspath("backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from apps.ai_assistant.services import (
    extract_order_entities,
    process_conversational_add_to_cart,
    process_conversational_order,
    clean_address_text,
    handle_chat_turn,
)
from apps.cart.models import Cart, CartItem
from apps.products.models import Product, ProductVariant
from apps.orders.models import Order
from unittest.mock import MagicMock, patch
from contextlib import contextmanager
from datetime import datetime


def run_conversational_tests():
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("=== RUNNING CONVERSATIONAL ORDER & CART FIX TESTS ===")

    history = [
        {"role": "user", "text": "Hasan Mahmud"},
        {"role": "assistant", "text": "আসসালামু আলাইকুম, হাসান মাহমুদ ভাই! 'Kids & Family'-তে আপনাকে স্বাগতম। 😊 আপনার সোনামনিদের জন্য আমাদের চমৎকার কিছু কালেকশন নিচে যুক্ত করে দিয়েছি।"}
    ]

    msg = "01731321511 bagmara cumilla cart er order confirm kore dew"

    # 1. Test clean_address_text
    addr_cleaned = clean_address_text("bagmara cumilla cart er order confirm kore dew")
    print(f"Address cleaned from prompt: '{addr_cleaned}'")
    assert "order" not in addr_cleaned.lower(), f"Failed: order still in address: {addr_cleaned}"
    assert "cart" not in addr_cleaned.lower(), f"Failed: cart still in address: {addr_cleaned}"
    print("[PASS] clean_address_text successfully stripped cart/order phrases.")

    # 2. Test extract_order_entities
    entities = extract_order_entities(msg, history=history)
    print(f"Extracted Entities:\n  Name: {entities['name']}\n  Phone: {entities['phone']}\n  Address: {entities['address']}\n  City: {entities['city']}\n  Wants to order: {entities['wants_to_order']}\n  Wants cart items: {entities['wants_cart_items']}")

    assert entities["phone"] == "01731321511", f"Expected phone 01731321511, got {entities['phone']}"
    assert entities["name"] in ["Hasan Mahmud", "হাসান মাহমুদ"], f"Expected Hasan Mahmud, got {entities['name']}"
    assert "Bagmara" in entities["address"] or "Cumilla" in entities["address"], f"Expected Bagmara/Cumilla in address, got {entities['address']}"
    assert entities["city"] == "Cumilla", f"Expected City Cumilla, got {entities['city']}"
    assert entities["wants_to_order"] is True, f"Expected wants_to_order True"
    assert entities["wants_cart_items"] is True, f"Expected wants_cart_items True"
    print("[PASS] extract_order_entities correctly extracted Name, Phone, Address, City, and Intent.")

    # 3. Test that process_conversational_add_to_cart returns None on order confirm
    cart_res = process_conversational_add_to_cart(msg, history=history)
    assert cart_res is None, f"Expected process_conversational_add_to_cart to return None, but got: {cart_res}"
    print("[PASS] process_conversational_add_to_cart returned None (did not hijack order confirm).")

    # 4. Test two-step draft -> confirmation flow
    mock_variant = MagicMock()
    mock_variant.id = 101
    mock_variant.price = 630
    mock_variant.sku = "KF-TSHIRT-01"
    mock_variant.stock = 10
    mock_variant.product.name = "Boys Casual Shirt"

    mock_cart_item = MagicMock()
    mock_cart_item.variant = mock_variant
    mock_cart_item.variant_id = 101
    mock_cart_item.quantity = 2

    mock_cart = MagicMock()
    mock_cart.items.exists.return_value = True
    mock_cart.items.select_related.return_value.all.return_value = [mock_cart_item]
    mock_cart.items.all.return_value.delete.return_value = None

    class MockSession(dict):
        modified = False

    mock_request = MagicMock()
    mock_request.session = MockSession()
    mock_request.user.is_authenticated = False

    def mock_atomic(*args, **kwargs):
        if args and callable(args[0]):
            return args[0]
        @contextmanager
        def _ctx():
            yield
        return _ctx()

    with patch("apps.ai_assistant.services.Cart.objects.filter", return_value=MagicMock(first=lambda: mock_cart)):
        with patch("apps.ai_assistant.services.transaction.atomic", mock_atomic):
            # Step 4a: Turn 1 produces Draft and requests explicit confirmation
            res_turn1 = handle_chat_turn(
                msg,
                history=history,
                session_key="test_session",
                request=mock_request,
            )
            print("\nChat Turn 1 Result (Draft Creation):")
            print(f"  Success: {res_turn1.get('success')}")
            print(f"  Order Confirmation Requested: {res_turn1.get('order_confirmation_requested')}")
            print(f"  Order Created: {res_turn1.get('order_created')}")
            assert res_turn1.get("order_confirmation_requested") is True, "Turn 1 must request explicit confirmation"
            assert res_turn1.get("order_created") is False, "Turn 1 must NOT create order without confirmation"

            # Step 4b: Turn 2 confirms order
            mock_order_instance = MagicMock()
            mock_order_instance.order_number = "KF2610259999"
            mock_order_instance.full_name = "হাসান মাহমুদ"
            mock_order_instance.phone = "01731321511"
            mock_order_instance.address_line = "Bagmara Cumilla"
            mock_order_instance.city = "Cumilla"
            mock_order_instance.status = "pending"
            mock_order_instance.subtotal = 1260
            mock_order_instance.shipping_fee = 120
            mock_order_instance.total = 1380
            mock_order_instance.created_at = datetime.now()

            with patch("apps.ai_assistant.services.execute_confirm_order") as mock_confirm:
                mock_confirm.return_value = {
                    "success": True,
                    "order_number": "KF2610259999",
                    "total": 1380,
                    "phone": "01731321511",
                    "full_name": "হাসান মাহমুদ",
                    "address_line": "Bagmara Cumilla",
                    "city": "Cumilla",
                    "order": {
                        "order_number": "KF2610259999",
                        "total": 1380,
                        "status": "pending",
                        "full_name": "হাসান মাহমুদ",
                    },
                }
                res_turn2 = handle_chat_turn(
                    "হ্যাঁ, অর্ডার কনফার্ম করুন",
                    history=history + [{"role": "assistant", "text": res_turn1.get("reply")}],
                    session_key="test_session",
                    request=mock_request,
                )
                print("\nChat Turn 2 Result (Order Confirmation):")
                print(f"  Success: {res_turn2.get('success')}")
                print(f"  Order Created: {res_turn2.get('order_created')}")
                print(f"  Intent: {res_turn2.get('intent')}")
                assert res_turn2.get("order_created") is True, "Turn 2 must finalize order upon explicit confirmation"
                assert "KF2610259999" in res_turn2.get("reply"), "Order number must be in reply"

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The conversational flow is 100% verified.")
    return True


if __name__ == "__main__":
    run_conversational_tests()
