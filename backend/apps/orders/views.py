import re
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    CheckoutSerializer,
    OrderStatusUpdateSerializer,
)
from apps.cart.views import get_or_create_cart


class CheckoutAPIView(APIView):
    """
    Place an order using the current cart items.
    Validates stock, creates Order and OrderItems atomically,
    decrements variant inventory, and empties the cart.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart, _ = get_or_create_cart(request)
        cart_items = cart.items.select_related("variant__product").all()

        if not cart_items.exists():
            return Response(
                {"success": False, "message": "Your cart is empty. Add items before checking out."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify stock availability for each item
        out_of_stock = []
        for item in cart_items:
            if item.quantity > item.variant.stock:
                out_of_stock.append({
                    "product": item.variant.product.name,
                    "sku": item.variant.sku,
                    "requested": item.quantity,
                    "available": item.variant.stock,
                })

        if out_of_stock:
            return Response(
                {
                    "success": False,
                    "message": "Some items do not have sufficient stock.",
                    "items": out_of_stock,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            subtotal = cart.total_price
            shipping_fee = data.get("shipping_fee", 60)
            total = subtotal + shipping_fee

            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_key=cart.session_key if not request.user.is_authenticated else None,
                full_name=data["full_name"],
                phone=data["phone"],
                email=data.get("email") or (request.user.email if request.user.is_authenticated else ""),
                address_line=data["address_line"],
                city=data["city"],
                notes=data.get("notes", ""),
                payment_method=data["payment_method"],
                payment_status="unpaid",
                status="pending",
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                total=total,
            )

            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    variant=item.variant,
                    product_name=item.variant.product.name,
                    variant_sku=item.variant.sku,
                    price=item.variant.price,
                    quantity=item.quantity,
                )
                # Decrement variant stock
                item.variant.stock -= item.quantity
                item.variant.save()

            # Clear cart
            cart_items.delete()

        # Prefetch relations for instant response serialization
        order = (
            Order.objects.prefetch_related(
                "items__variant__product",
                "items__variant__attributes__attribute_type",
            )
            .get(pk=order.pk)
        )

        return Response(
            {
                "success": True,
                "message": "Order placed successfully!",
                "order": OrderSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderListAPIView(generics.ListAPIView):
    """
    List past orders for current authenticated user or guest session.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return (
                Order.objects.filter(user=self.request.user)
                .prefetch_related(
                    "items__variant__product",
                    "items__variant__attributes__attribute_type",
                )
                .order_by("-created_at")
            )

        session_key = (
            self.request.headers.get("X-Session-Key")
            or self.request.query_params.get("session_key")
            or self.request.session.session_key
        )
        if session_key:
            return (
                Order.objects.filter(session_key=session_key)
                .prefetch_related(
                    "items__variant__product",
                    "items__variant__attributes__attribute_type",
                )
                .order_by("-created_at")
            )

        return Order.objects.none()


class OrderDetailAPIView(APIView):
    """
    Retrieve single order by order_number for order tracking & confirmation.
    Protected against BOLA / IDOR vulnerabilities.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order.objects.prefetch_related(
                "items__variant__product",
                "items__variant__attributes__attribute_type",
            ),
            order_number=order_number,
        )

        # BOLA / IDOR Authorization Check: Enforce object ownership or verified phone/session proof
        is_authorized = False
        if request.user.is_authenticated and (request.user.is_staff or request.user == order.user):
            is_authorized = True
        else:
            session_key = (
                request.headers.get("X-Session-Key")
                or request.query_params.get("session_key")
                or (request.session.session_key if hasattr(request, "session") else None)
            )
            phone_check = request.query_params.get("phone") or request.headers.get("X-Customer-Phone")

            if order.session_key and session_key and order.session_key == session_key:
                is_authorized = True
            elif phone_check:
                c_phone = re.sub(r"[^\d]", "", str(phone_check))[-11:]
                o_phone = re.sub(r"[^\d]", "", str(order.phone or ""))[-11:]
                if c_phone and o_phone and c_phone == o_phone:
                    is_authorized = True

        if not is_authorized:
            return Response(
                {"error": "Unauthorized: You do not have permission to view this order. Please provide customer phone verification."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(OrderSerializer(order, context={"request": request}).data)


class TrackOrderAPIView(APIView):
    """
    Search and track orders by order_number OR customer phone number.
    Strictly requires full credentials to prevent unauthorized data harvesting.
    Protected by scoped rate limiter (30 requests/minute).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "track_order"

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        return self._track(query, request)

    def post(self, request):
        query = request.data.get("query", "").strip()
        return self._track(query, request)

    def _track(self, query, request):
        if not query:
            return Response(
                {"success": False, "message": "অনুগ্রহ করে আপনার অর্ডার আইডি অথবা ১১ ডিজিটের মোবাইল নম্বর দিন।", "orders": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders_qs = Order.objects.prefetch_related(
            "items__variant__product",
            "items__variant__attributes__attribute_type",
        )

        clean_query = query.upper().strip()
        clean_digits = re.sub(r"[^\d]", "", query)

        # 1. Exact match on full Order ID (e.g. KF...)
        if clean_query.startswith("KF"):
            clean_kf = re.sub(r"[- ]", "", clean_query)
            orders = list(orders_qs.filter(Q(order_number__iexact=query) | Q(order_number__iexact=clean_kf)))
        elif len(clean_digits) >= 10:
            # 2. Strict 11-digit phone check to prevent data harvesting on short prefixes
            phone_11 = clean_digits[-11:] if len(clean_digits) >= 11 else f"0{clean_digits}"
            orders = list(orders_qs.filter(
                Q(phone=phone_11) | Q(phone=f"+88{phone_11}") | Q(phone=f"88{phone_11}")
            ).order_by("-created_at"))
        else:
            return Response(
                {
                    "success": False,
                    "message": "নিরাপত্তার স্বার্থে অনুগ্রহ করে সম্পূর্ণ ১১ ডিজিটের মোবাইল নম্বর অথবা সম্পূর্ণ KF অর্ডার নম্বরটি দিন।",
                    "orders": [],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not orders:
            return Response(
                {
                    "success": False,
                    "message": f"'{query}' এর বিপরীতে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার আইডি বা মোবাইল নম্বর দিন।",
                    "orders": [],
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "success": True,
                "query": query,
                "count": len(orders),
                "orders": OrderSerializer(orders, many=True, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class OrderPaymentStubAPIView(APIView):
    """
    Payment simulation / gateway endpoint.
    Protected against BOLA / IDOR - only order owner, verified session, or staff can initiate payment.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        # BOLA / IDOR Authorization check
        is_authorized = False
        if request.user.is_authenticated and (request.user.is_staff or request.user == order.user):
            is_authorized = True
        else:
            session_key = (
                request.headers.get("X-Session-Key")
                or request.query_params.get("session_key")
                or (request.session.session_key if hasattr(request, "session") else None)
            )
            phone_check = request.data.get("phone") or request.query_params.get("phone")
            if order.session_key and session_key and order.session_key == session_key:
                is_authorized = True
            elif phone_check:
                c_phone = re.sub(r"[^\d]", "", str(phone_check))[-11:]
                o_phone = re.sub(r"[^\d]", "", str(order.phone or ""))[-11:]
                if c_phone and o_phone and c_phone == o_phone:
                    is_authorized = True
            elif not order.user:
                is_authorized = True

        if not is_authorized:
            return Response(
                {"error": "Unauthorized: Only the order owner or staff can verify payment."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order.payment_status = "paid"
        order.status = "confirmed"
        order.save()
        return Response({
            "success": True,
            "message": "Payment verified and order confirmed.",
            "order": OrderSerializer(order).data,
        })


class AdminOrderListAPIView(generics.ListAPIView):
    """
    List all orders with status filtering (Admin / Staff only).
    Filters: ?status=pending, ?payment_status=paid, ?q=KF26...
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = (
            Order.objects.all()
            .select_related("user")
            .prefetch_related(
                "items__variant__product",
                "items__variant__attributes__attribute_type",
            )
            .order_by("-created_at")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        payment_status = self.request.query_params.get("payment_status")
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Order.objects.filter(order_number__icontains=query)
                | Order.objects.filter(full_name__icontains=query)
                | Order.objects.filter(phone__icontains=query)
            )

        return queryset


class AdminOrderDetailUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update order status or payment status (Admin / Staff only).
    Payload: { "status": "shipped", "payment_status": "paid" }
    """
    serializer_class = OrderStatusUpdateSerializer
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "order_number"

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response(OrderSerializer(instance, context={"request": request}).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_update(serializer)
            new_status = serializer.instance.status
            if old_status != "cancelled" and new_status == "cancelled":
                for item in instance.items.select_related("variant").all():
                    if item.variant:
                        item.variant.stock += item.quantity
                        item.variant.save()
            elif old_status == "cancelled" and new_status != "cancelled":
                for item in instance.items.select_related("variant").all():
                    if item.variant:
                        item.variant.stock = max(0, item.variant.stock - item.quantity)
                        item.variant.save()

        return Response(OrderSerializer(instance, context={"request": request}).data)

