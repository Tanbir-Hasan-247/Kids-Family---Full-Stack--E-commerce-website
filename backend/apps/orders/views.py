import re
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
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
        return Response(OrderSerializer(order, context={"request": request}).data)


class TrackOrderAPIView(APIView):
    """
    Search and track orders by order_number OR customer phone number.
    Supports GET /api/orders/track/?query=... and POST /api/orders/track/ with { "query": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        return self._track(query, request)

    def post(self, request):
        query = request.data.get("query", "").strip()
        return self._track(query, request)

    def _track(self, query, request):
        if not query:
            return Response(
                {"success": False, "message": "অনুগ্রহ করে আপনার অর্ডার আইডি অথবা ফোন নম্বর দিন।", "orders": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders_qs = Order.objects.prefetch_related(
            "items__variant__product",
            "items__variant__attributes__attribute_type",
        )

        # 1. Exact or case-insensitive match on order_number
        orders = list(orders_qs.filter(order_number__iexact=query))

        # 2. If not found by exact order_number, try phone or partial matches
        if not orders:
            clean_digits = re.sub(r"[^\d]", "", query)
            filters = Q(phone__icontains=query) | Q(order_number__icontains=query)

            if clean_digits:
                filters |= Q(phone__icontains=clean_digits)
                if clean_digits.startswith("880") and len(clean_digits) > 3:
                    filters |= Q(phone__icontains=clean_digits[2:])
                elif clean_digits.startswith("88") and len(clean_digits) > 2:
                    filters |= Q(phone__icontains=clean_digits[2:])
                elif clean_digits.startswith("0") and len(clean_digits) > 1:
                    filters |= Q(phone__icontains=clean_digits[1:])

            orders = list(orders_qs.filter(filters).order_by("-created_at"))

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
    Marks payment as 'paid' and status as 'confirmed'.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
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

