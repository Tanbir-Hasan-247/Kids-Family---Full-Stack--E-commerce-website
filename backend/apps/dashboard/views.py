import csv
from datetime import timedelta
from django.http import HttpResponse
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer
from apps.products.models import ProductVariant
from .models import ShopSetting
from .serializers import ShopSettingSerializer


class DashboardAnalyticsAPIView(APIView):
    """
    Sales performance analytics for Admin/Moderator dashboard:
    - total_revenue, today_revenue, total_orders, pending_orders, low_stock_count
    - 14-day daily revenue data
    - Monthly sales trend (last 6 months)
    - Category sales breakdown
    - Top products by sales
    - Recent orders
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        valid_orders = Order.objects.exclude(status="cancelled")

        total_revenue = valid_orders.aggregate(total=Sum("total"))["total"] or 0
        total_orders = valid_orders.count()
        pending_orders = Order.objects.filter(status="pending").count()

        # Low stock count (variants with 5 or fewer items remaining)
        low_stock_count = ProductVariant.objects.filter(stock__lte=5).count()

        today = timezone.now().date()
        today_revenue = (
            valid_orders.filter(created_at__date=today).aggregate(total=Sum("total"))["total"]
            or 0
        )

        # 14-day sales trend
        since_14 = today - timedelta(days=13)
        daily_sales = (
            valid_orders.filter(created_at__date__gte=since_14)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"))
            .order_by("day")
        )
        sales_by_day = {entry["day"]: float(entry["revenue"]) for entry in daily_sales}

        chart_data = []
        for i in range(14):
            d = since_14 + timedelta(days=i)
            chart_data.append({
                "date": d.strftime("%d %b"),
                "iso_date": d.isoformat(),
                "revenue": sales_by_day.get(d, 0.0),
            })

        # Monthly sales trend (last 6 months)
        six_months_ago = today - timedelta(days=180)
        monthly_sales_qs = (
            valid_orders.filter(created_at__date__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Sum("total"), orders_count=Count("id"))
            .order_by("month")
        )
        monthly_sales = [
            {
                "month": item["month"].strftime("%b %Y"),
                "revenue": float(item["revenue"] or 0),
                "orders_count": item["orders_count"],
            }
            for item in monthly_sales_qs
        ]

        # Category sales breakdown
        cat_sales_qs = (
            OrderItem.objects.filter(order__in=valid_orders)
            .values("variant__product__category__name")
            .annotate(total_revenue=Sum("price"), total_qty=Sum("quantity"))
            .order_by("-total_revenue")[:6]
        )
        category_sales = [
            {
                "category": item["variant__product__category__name"] or "General",
                "revenue": float(item["total_revenue"] or 0),
                "quantity": item["total_qty"] or 0,
            }
            for item in cat_sales_qs
        ]

        # Top 5 best selling products
        top_products = (
            OrderItem.objects.filter(order__in=valid_orders)
            .values("product_name")
            .annotate(total_qty=Sum("quantity"), total_revenue=Sum("price"))
            .order_by("-total_qty")[:5]
        )

        recent_orders = Order.objects.prefetch_related("items").order_by("-created_at")[:8]

        return Response({
            "metrics": {
                "total_revenue": str(total_revenue),
                "today_revenue": str(today_revenue),
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "low_stock_count": low_stock_count,
            },
            "sales_chart_14_days": chart_data,
            "monthly_sales": monthly_sales,
            "category_sales": category_sales,
            "top_products": list(top_products),
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
        })


class LowStockAlertAPIView(APIView):
    """
    Returns inventory variants running low on stock (<= threshold, default 5).
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        try:
            threshold = int(request.query_params.get("threshold", 5))
        except ValueError:
            threshold = 5

        low_variants = (
            ProductVariant.objects.filter(stock__lte=threshold)
            .select_related("product", "product__category")
            .prefetch_related("attributes__attribute_type")
            .order_by("stock")
        )

        results = []
        for v in low_variants:
            attrs = ", ".join([f"{a.attribute_type.name}: {a.value}" for a in v.attributes.all()])
            img_url = None
            if v.image:
                img_url = request.build_absolute_uri(v.image.url) if request else v.image.url
            results.append({
                "id": v.id,
                "product_id": v.product.id,
                "product_name": v.product.name,
                "category_name": v.product.category.name if v.product.category else "",
                "sku": v.sku,
                "stock": v.stock,
                "price": str(v.price),
                "attributes": attrs,
                "image": img_url,
            })

        return Response({
            "count": len(results),
            "threshold": threshold,
            "items": results,
        })


class ExportOrdersCSVAPIView(APIView):
    """
    Exports orders to a formatted CSV spreadsheet for Excel / Google Sheets.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        orders = Order.objects.prefetch_related("items").order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "all":
            orders = orders.filter(status=status_filter)

        filename = f"kids_family_orders_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # UTF-8 BOM so Microsoft Excel renders Bengali characters correctly
        response.write("\ufeff")

        writer = csv.writer(response)
        writer.writerow([
            "Order Number",
            "Customer Name",
            "Phone Number",
            "Email",
            "Delivery Address",
            "City / Region",
            "Items Summary",
            "Subtotal",
            "Delivery Charge",
            "Total Amount (BDT)",
            "Payment Method",
            "Payment Status",
            "Order Status",
            "Order Date",
        ])

        for o in orders:
            items_summary = "; ".join([
                f"{item.product_name} x{item.quantity} (৳{item.price})"
                for item in o.items.all()
            ])
            subtotal = o.total - o.shipping_fee
            writer.writerow([
                o.order_number,
                f"{o.first_name} {o.last_name}".strip(),
                o.phone,
                o.email or (o.user.email if o.user else "N/A"),
                o.address,
                o.city,
                items_summary,
                subtotal,
                o.shipping_fee,
                o.total,
                o.payment_method.upper(),
                o.payment_status.capitalize(),
                o.status.capitalize(),
                o.created_at.strftime("%Y-%m-%d %H:%M"),
            ])

        return response


class NotificationCountAPIView(APIView):
    """
    Live pending orders badge counter for navbar / notifications.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        count = Order.objects.filter(status="pending").count()
        return Response({"pending_orders_count": count})


class ShopSettingAPIView(APIView):
    """
    Retrieve or update global Shop Contact Information and Settings.
    - GET: Public (AllowAny) so storefront footer, invoice & WhatsApp widget can fetch current info.
    - PUT / PATCH: Staff/Admin only (IsAdminUser) to save changes.
    """
    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get(self, request):
        settings_obj = ShopSetting.get_settings()
        serializer = ShopSettingSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        settings_obj = ShopSetting.get_settings()
        serializer = ShopSettingSerializer(settings_obj, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



