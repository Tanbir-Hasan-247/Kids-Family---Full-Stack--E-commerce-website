import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory

from apps.categories.models import Category
from apps.products.models import Product, ProductVariant
from apps.products.serializers import ProductDetailSerializer
from apps.wishlist.models import FavoriteItem
from apps.wishlist.views import (
    WishlistListAPIView,
    WishlistToggleAPIView,
    WishlistCheckAPIView,
)
from apps.cart.services import sign_guest_cart_key

User = get_user_model()


class WishlistAPITestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            email="wishlistuser@example.com",
            password="SecurePassword123!",
        )

        self.category = Category.objects.create(name="Kids Wear", slug="kids-wear-wishlist")
        self.product1 = Product.objects.create(
            category=self.category,
            name="Embroidered Panjabi",
            base_price=Decimal("1500.00"),
        )
        self.product2 = Product.objects.create(
            category=self.category,
            name="Cotton Kurta Set",
            base_price=Decimal("1200.00"),
        )
        self.variant1 = ProductVariant.objects.create(
            product=self.product1,
            sku="PANJABI-M",
            price=Decimal("1500.00"),
            stock=10,
        )

    def test_toggle_wishlist_with_raw_guest_key(self):
        """Toggle adds product to wishlist with raw guest key (e.g. guest_...)."""
        raw_key = "guest_raw_wishlist_test_123"
        toggle_view = WishlistToggleAPIView.as_view()

        req = self.factory.post(
            f"/api/wishlist/toggle/{self.product1.pk}/",
            HTTP_X_SESSION_KEY=raw_key,
        )
        res = toggle_view(req, product_id=self.product1.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["success"])
        self.assertTrue(res.data["favorited"])
        self.assertEqual(res.data["count"], 1)

        # Verify DB entry
        fav = FavoriteItem.objects.filter(product=self.product1, session_key=raw_key).first()
        self.assertIsNotNone(fav)
        self.assertEqual(fav.session_key, raw_key)
        self.assertIsNone(fav.user)

    def test_toggle_wishlist_with_signed_token_fits_within_40_chars(self):
        """
        Verify that a signed token (>60 chars) is unsigend to raw key (<=40 chars)
        so it never causes DataError or varchar(40) truncation in PostgreSQL.
        """
        raw_key = "guest_signed_token_test_123"
        signed_token = sign_guest_cart_key(raw_key)
        self.assertGreater(len(signed_token), 50)

        toggle_view = WishlistToggleAPIView.as_view()
        req = self.factory.post(
            f"/api/wishlist/toggle/{self.product1.pk}/",
            HTTP_X_SESSION_KEY=signed_token,
        )
        res = toggle_view(req, product_id=self.product1.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["favorited"])
        self.assertEqual(res.data["count"], 1)

        # Verify DB entry was saved with raw_key (len <= 40), NOT the 65+ char signed token
        fav = FavoriteItem.objects.filter(product=self.product1).first()
        self.assertIsNotNone(fav)
        self.assertEqual(fav.session_key, raw_key)
        self.assertLessEqual(len(fav.session_key), 40)

    def test_toggle_remove_wishlist(self):
        """Toggling an existing wishlist item removes it."""
        raw_key = "guest_toggle_remove_123"
        FavoriteItem.objects.create(product=self.product1, session_key=raw_key)

        toggle_view = WishlistToggleAPIView.as_view()
        req = self.factory.post(
            f"/api/wishlist/toggle/{self.product1.pk}/",
            HTTP_X_SESSION_KEY=raw_key,
        )
        res = toggle_view(req, product_id=self.product1.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["favorited"])
        self.assertEqual(res.data["count"], 0)
        self.assertFalse(FavoriteItem.objects.filter(product=self.product1, session_key=raw_key).exists())

    def test_wishlist_list_and_check_api_with_mixed_token_formats(self):
        """
        Adding with raw key and retrieving with signed token (or vice versa)
        must resolve to the exact same items without losing data.
        """
        raw_key = "guest_mixed_token_test_123"
        signed_token = sign_guest_cart_key(raw_key)

        # Add using raw key
        FavoriteItem.objects.create(product=self.product1, session_key=raw_key)
        FavoriteItem.objects.create(product=self.product2, session_key=raw_key)

        # List using signed token
        list_view = WishlistListAPIView.as_view()
        req_list = self.factory.get("/api/wishlist/", HTTP_X_SESSION_KEY=signed_token)
        res_list = list_view(req_list)

        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data["count"], 2)
        item_product_ids = [i["product_id"] for i in res_list.data["items"]]
        self.assertIn(self.product1.pk, item_product_ids)
        self.assertIn(self.product2.pk, item_product_ids)

        # Check API using signed token
        check_view = WishlistCheckAPIView.as_view()
        req_check = self.factory.get(f"/api/wishlist/check/{self.product1.pk}/", HTTP_X_SESSION_KEY=signed_token)
        res_check = check_view(req_check, product_id=self.product1.pk)
        self.assertEqual(res_check.status_code, status.HTTP_200_OK)
        self.assertTrue(res_check.data["is_favorited"])

    def test_product_serializer_is_favorited(self):
        """ProductDetailSerializer.get_is_favorited correctly detects favorited status."""
        raw_key = "guest_serializer_test_123"
        signed_token = sign_guest_cart_key(raw_key)
        FavoriteItem.objects.create(product=self.product1, session_key=raw_key)

        # Request with signed token
        req = self.factory.get("/", HTTP_X_SESSION_KEY=signed_token)
        data = ProductDetailSerializer(self.product1, context={"request": req}).data
        self.assertTrue(data["is_favorited"])

        # Unfavorited product
        data2 = ProductDetailSerializer(self.product2, context={"request": req}).data
        self.assertFalse(data2["is_favorited"])

    def test_auto_merge_guest_wishlist_on_user_login(self):
        """When an authenticated user requests wishlist, guest items are migrated to user."""
        raw_key = "guest_login_merge_123"
        signed_token = sign_guest_cart_key(raw_key)
        FavoriteItem.objects.create(product=self.product1, session_key=raw_key)

        # User makes authenticated request presenting the guest session key
        list_view = WishlistListAPIView.as_view()
        req = self.factory.get("/api/wishlist/", HTTP_X_SESSION_KEY=signed_token)
        from rest_framework.test import force_authenticate
        force_authenticate(req, user=self.user)

        res = list_view(req)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

        # Verify DB entry is now bound to user and session_key is None
        fav = FavoriteItem.objects.filter(product=self.product1, user=self.user).first()
        self.assertIsNotNone(fav)
        self.assertIsNone(fav.session_key)
        # Guest entry is gone
        self.assertFalse(FavoriteItem.objects.filter(session_key=raw_key).exists())

    def test_guest_wishlist_isolation(self):
        """Guest A and Guest B have completely isolated wishlists."""
        guest_a = "guest_session_user_a_123"
        guest_b = "guest_session_user_b_456"

        FavoriteItem.objects.create(product=self.product1, session_key=guest_a)

        list_view = WishlistListAPIView.as_view()
        res_a = list_view(self.factory.get("/api/wishlist/", HTTP_X_SESSION_KEY=guest_a))
        res_b = list_view(self.factory.get("/api/wishlist/", HTTP_X_SESSION_KEY=guest_b))

        self.assertEqual(res_a.data["count"], 1)
        self.assertEqual(res_b.data["count"], 0)
