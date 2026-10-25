import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.signing import TimestampSigner
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.cart.models import Cart, CartItem
from apps.cart.services import (
    GUEST_CART_SALT,
    MAX_GUEST_CART_AGE,
    extract_raw_guest_key,
    merge_guest_cart_into_user_cart,
    resolve_cart,
    sign_guest_cart_key,
    unsign_guest_cart_token,
)
from apps.orders.views import CheckoutAPIView
from apps.cart.views import (
    AddToCartAPIView,
    CartDetailAPIView,
    MergeGuestCartAPIView,
)
from apps.categories.models import Category
from apps.products.models import Product, ProductVariant

User = get_user_model()


class CartGuestSecurityTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            email="customer@example.com",
            password="SecurePassword123!",
        )

        self.category = Category.objects.create(name="Kids Wear", slug="kids-wear")
        self.product = Product.objects.create(
            category=self.category,
            name="Cotton Kids T-Shirt",
            description="Comfortable pure cotton t-shirt",
            base_price=Decimal("500.00"),
        )
        self.variant_in_stock = ProductVariant.objects.create(
            product=self.product,
            sku="TSHIRT-RED-S",
            price=Decimal("500.00"),
            stock=10,
        )
        self.variant_low_stock = ProductVariant.objects.create(
            product=self.product,
            sku="TSHIRT-RED-M",
            price=Decimal("520.00"),
            stock=3,
        )
        self.variant_zero_stock = ProductVariant.objects.create(
            product=self.product,
            sku="TSHIRT-RED-L",
            price=Decimal("550.00"),
            stock=0,
        )

    # 1. Cryptographic Token Generation & Unsigning
    def test_signed_token_round_trip(self):
        raw_key = uuid.uuid4().hex[:32]
        token = sign_guest_cart_key(raw_key)

        self.assertNotEqual(raw_key, token)
        self.assertIn(":", token)

        recovered_key = unsign_guest_cart_token(token)
        self.assertEqual(recovered_key, raw_key)

    def test_tampered_token_rejected(self):
        raw_key = uuid.uuid4().hex[:32]
        token = sign_guest_cart_key(raw_key)
        tampered_token = token[:-4] + "wxyz"

        self.assertIsNone(unsign_guest_cart_token(tampered_token))

        # Test resolution with tampered token
        request = self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=tampered_token)
        cart, new_token = resolve_cart(request)

        self.assertIsNotNone(new_token)
        self.assertNotEqual(new_token, tampered_token)
        self.assertNotEqual(cart.session_key, raw_key)

    def test_expired_token_rejected(self):
        raw_key = uuid.uuid4().hex[:32]
        signer = TimestampSigner(salt=GUEST_CART_SALT)
        # Sign token with an old timestamp (older than MAX_GUEST_CART_AGE)
        expired_token = signer.sign(raw_key)
        # Check unsigning with max_age = -1 (forces expiration)
        recovered = None
        try:
            recovered = signer.unsign(expired_token, max_age=-1)
        except Exception:
            recovered = None

        self.assertIsNone(recovered)

    # 2. Legacy UUID Migration Grace Period
    def test_legacy_uuid_migration_upgrade(self):
        legacy_raw_uuid = "a1b2c3d4e5f6789012345678abcdef01"
        # Pre-existing cart in database with legacy raw UUID
        existing_cart = Cart.objects.create(session_key=legacy_raw_uuid, user=None)

        # Request presenting legacy raw UUID
        request = self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=legacy_raw_uuid)
        cart, upgrade_token = resolve_cart(request)

        # Resolves to the existing cart
        self.assertEqual(cart.pk, existing_cart.pk)
        self.assertEqual(cart.session_key, legacy_raw_uuid)
        # Issues an upgraded signed token
        self.assertIsNotNone(upgrade_token)
        self.assertEqual(unsign_guest_cart_token(upgrade_token), legacy_raw_uuid)

    def test_unregistered_legacy_uuid_rejected(self):
        fake_uuid = "99998888777766665555444433332222"
        # Does not exist in Cart table
        request = self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=fake_uuid)
        cart, new_token = resolve_cart(request)

        # Must reject fake UUID and allocate a fresh session key
        self.assertNotEqual(cart.session_key, fake_uuid)
        self.assertIsNotNone(new_token)

    # 3. Atomic Guest-Cart Merging Edge Cases
    def test_merge_overlapping_variants_combines_quantities(self):
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)
        CartItem.objects.create(cart=guest_cart, variant=self.variant_in_stock, quantity=2)

        user_cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=user_cart, variant=self.variant_in_stock, quantity=3)

        # Merge
        result_cart, stats = merge_guest_cart_into_user_cart(guest_token, self.user)

        self.assertEqual(result_cart.pk, user_cart.pk)
        self.assertEqual(stats["status"], "success")
        self.assertEqual(stats["merged"], 1)

        # Check user cart has exactly 1 CartItem with combined quantity 5 (stock is 10)
        items = list(user_cart.items.all())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].quantity, 5)

        # Check guest cart is deleted
        self.assertFalse(Cart.objects.filter(pk=guest_cart.pk).exists())

    def test_merge_caps_quantity_at_variant_stock(self):
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)
        # variant_low_stock has stock = 3
        CartItem.objects.create(cart=guest_cart, variant=self.variant_low_stock, quantity=2)

        user_cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=user_cart, variant=self.variant_low_stock, quantity=2)

        # Merge (2 + 2 = 4, but stock is 3)
        result_cart, stats = merge_guest_cart_into_user_cart(guest_token, self.user)

        items = list(result_cart.items.all())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].quantity, 3)

    def test_merge_drops_zero_stock_variants_and_never_leaves_zero_quantity(self):
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)
        # variant_zero_stock has stock = 0
        CartItem.objects.create(cart=guest_cart, variant=self.variant_zero_stock, quantity=2)

        user_cart = Cart.objects.create(user=self.user)

        result_cart, stats = merge_guest_cart_into_user_cart(guest_token, self.user)

        self.assertEqual(stats["status"], "success")
        self.assertEqual(stats["dropped"], 1)
        self.assertEqual(result_cart.items.count(), 0)

    # 4. Cart API Behavior & Response Contracts
    def test_cart_detail_api_sets_signed_token_header_for_guest(self):
        view = CartDetailAPIView.as_view()
        request = self.factory.get("/api/cart/")
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("X-Session-Key", response)
        token = response["X-Session-Key"]
        self.assertIsNotNone(unsign_guest_cart_token(token))
        self.assertIn("items", response.data)
        self.assertIn("total_price", response.data)

    def test_add_to_cart_api_preserves_contract(self):
        view = AddToCartAPIView.as_view()
        payload = {"variant_id": self.variant_in_stock.pk, "quantity": 2}
        request = self.factory.post("/api/cart/items/", payload, format="json")
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertEqual(response.data.get("message"), "Added to bag successfully.")
        self.assertIn("cart", response.data)
        self.assertIn("item", response.data)
        self.assertEqual(response.data["item"]["quantity"], 2)

    def test_add_to_cart_out_of_stock_returns_400(self):
        view = AddToCartAPIView.as_view()
        payload = {"variant_id": self.variant_zero_stock.pk, "quantity": 1}
        request = self.factory.post("/api/cart/items/", payload, format="json")
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("success"))

    def test_merge_cart_api_requires_authentication(self):
        view = MergeGuestCartAPIView.as_view()
        request = self.factory.post("/api/cart/merge/", {"guest_session_key": "dummy"}, format="json")
        response = view(request)

        # Unauthenticated request must be rejected
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_merge_cart_api_authenticated_merges_successfully(self):
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)
        CartItem.objects.create(cart=guest_cart, variant=self.variant_in_stock, quantity=1)

        view = MergeGuestCartAPIView.as_view()
        request = self.factory.post("/api/cart/merge/", {"guest_session_key": guest_token}, format="json")
        force_authenticate(request, user=self.user)
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertEqual(response.data.get("message"), "Guest cart merged successfully.")
    def test_header_precedence_over_query_param(self):
        """Header X-Session-Key takes precedence over ?session_key= query parameter."""
        header_raw_key = uuid.uuid4().hex[:32]
        header_token = sign_guest_cart_key(header_raw_key)
        Cart.objects.create(session_key=header_raw_key, user=None)

        query_raw_key = uuid.uuid4().hex[:32]
        query_token = sign_guest_cart_key(query_raw_key)
        Cart.objects.create(session_key=query_raw_key, user=None)

        request = self.factory.get(
            f"/api/cart/?session_key={query_token}",
            HTTP_X_SESSION_KEY=header_token,
        )
        cart, _ = resolve_cart(request)
        self.assertEqual(cart.session_key, header_raw_key)

    def test_merge_handles_deleted_or_unavailable_variant(self):
        """CartItem with zero-stock or unavailable variant is dropped safely during merge."""
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)

        # Create CartItem with variant having stock = 0
        CartItem.objects.create(cart=guest_cart, variant=self.variant_zero_stock, quantity=1)

        user_cart = Cart.objects.create(user=self.user)
        result_cart, stats = merge_guest_cart_into_user_cart(guest_token, self.user)

        self.assertEqual(stats["status"], "success")
        self.assertEqual(stats["dropped"], 1)
        self.assertEqual(result_cart.items.count(), 0)

    def test_concurrent_or_repeated_cart_merge_idempotency(self):
        """Second merge of an already merged guest cart returns cleanly without error."""
        guest_raw_key = uuid.uuid4().hex[:32]
        guest_token = sign_guest_cart_key(guest_raw_key)
        guest_cart = Cart.objects.create(session_key=guest_raw_key, user=None)
        CartItem.objects.create(cart=guest_cart, variant=self.variant_in_stock, quantity=1)

        user_cart = Cart.objects.create(user=self.user)

        # First merge
        res1_cart, stats1 = merge_guest_cart_into_user_cart(guest_token, self.user)
        self.assertEqual(stats1["status"], "success")
        self.assertEqual(stats1["merged"], 1)

        # Second merge (guest cart row was already deleted -> returns not_found safely)
        res2_cart, stats2 = merge_guest_cart_into_user_cart(guest_token, self.user)
        self.assertEqual(stats2["status"], "not_found")
        self.assertEqual(stats2["merged"], 0)
        # User cart retains the item from first merge
        self.assertEqual(res2_cart.items.count(), 1)
    # 5. Client Guest Key Multi-Item Accumulation & Checkout Tests
    def test_multiple_add_to_cart_with_guest_prefix_key_accumulates_without_overwrite(self):
        """
        Verify that sequential AddToCart calls from frontend with guest_... key
        accumulate in the SAME cart without overwriting or creating isolated carts.
        """
        guest_key = "guest_testaccumulate123456789"
        add_view = AddToCartAPIView.as_view()
        detail_view = CartDetailAPIView.as_view()

        # 1. Add first product
        req1 = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_in_stock.pk, "quantity": 1},
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        res1 = add_view(req1)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["cart"]["total_items"], 1)

        # 2. Add second product
        req2 = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_low_stock.pk, "quantity": 1},
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        res2 = add_view(req2)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["cart"]["total_items"], 2)

        # 3. Fetch cart detail
        req3 = self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=guest_key)
        res3 = detail_view(req3)
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data["total_items"], 2)
        self.assertEqual(len(res3.data["items"]), 2)

    def test_checkout_with_guest_prefix_key_completes_order_successfully(self):
        """
        Verify that Checkout with guest_... key finds all items in the cart
        and places the order instead of failing with 'Your cart is empty'.
        """
        guest_key = "guest_testcheckout123456789"
        add_view = AddToCartAPIView.as_view()
        checkout_view = CheckoutAPIView.as_view()

        # Add 2 items
        req1 = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_in_stock.pk, "quantity": 1},
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        add_view(req1)

        req2 = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_low_stock.pk, "quantity": 1},
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        add_view(req2)

        # Checkout
        checkout_payload = {
            "full_name": "Karim Rahman",
            "phone": "01712345678",
            "address_line": "House 10, Road 4, Dhanmondi",
            "city": "Dhaka",
            "payment_method": "cod",
            "shipping_fee": 60,
        }
        checkout_req = self.factory.post(
            "/api/orders/checkout/",
            checkout_payload,
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        checkout_res = checkout_view(checkout_req)

        self.assertEqual(checkout_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(checkout_res.data["success"])
        self.assertIn("order", checkout_res.data)
        order_data = checkout_res.data["order"]
        self.assertEqual(len(order_data["items"]), 2)

        # Cart should now be empty
        detail_req = self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=guest_key)
        detail_res = CartDetailAPIView.as_view()(detail_req)
        self.assertEqual(detail_res.data["total_items"], 0)

    def test_checkout_with_empty_cart_returns_error(self):
        """
        Verify that Checkout without any items returns 400 Bad Request with 'Your cart is empty'.
        """
        guest_key = "guest_trulyempty123456789"
        checkout_view = CheckoutAPIView.as_view()

        checkout_payload = {
            "full_name": "Karim Rahman",
            "phone": "01712345678",
            "address_line": "House 10, Road 4, Dhanmondi",
            "city": "Dhaka",
            "payment_method": "cod",
            "shipping_fee": 60,
        }
        checkout_req = self.factory.post(
            "/api/orders/checkout/",
            checkout_payload,
            format="json",
            HTTP_X_SESSION_KEY=guest_key,
        )
        checkout_res = checkout_view(checkout_req)

        self.assertEqual(checkout_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(checkout_res.data["success"])
        self.assertIn("cart is empty", checkout_res.data["message"].lower())

    def test_guest_session_isolation(self):
        """
        Verify that Guest A cannot access or mutate Guest B's cart.
        """
        guest_a = "guest_session_a_123456789"
        guest_b = "guest_session_b_123456789"
        add_view = AddToCartAPIView.as_view()
        detail_view = CartDetailAPIView.as_view()

        # Guest A adds item 1
        req_a = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_in_stock.pk, "quantity": 2},
            format="json",
            HTTP_X_SESSION_KEY=guest_a,
        )
        add_view(req_a)

        # Guest B adds item 2
        req_b = self.factory.post(
            "/api/cart/add/",
            {"variant_id": self.variant_low_stock.pk, "quantity": 1},
            format="json",
            HTTP_X_SESSION_KEY=guest_b,
        )
        add_view(req_b)

        # Inspect Guest A's cart
        res_a = detail_view(self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=guest_a))
        self.assertEqual(res_a.data["total_items"], 2)
        self.assertEqual(res_a.data["items"][0]["variant"]["id"], self.variant_in_stock.pk)

        # Inspect Guest B's cart
        res_b = detail_view(self.factory.get("/api/cart/", HTTP_X_SESSION_KEY=guest_b))
        self.assertEqual(res_b.data["total_items"], 1)
        self.assertEqual(res_b.data["items"][0]["variant"]["id"], self.variant_low_stock.pk)
