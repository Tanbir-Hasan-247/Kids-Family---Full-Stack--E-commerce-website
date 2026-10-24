import random
import string
from django.conf import settings
from django.db import models
from apps.products.models import ProductVariant


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("cod", "Cash on Delivery"),
        ("online", "Online Payment"),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
        ("failed", "Failed"),
    ]

    order_number = models.CharField(max_length=20, unique=True, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address_line = models.TextField()
    city = models.CharField(max_length=100)
    notes = models.TextField(blank=True)

    payment_method = models.CharField(
        max_length=10, choices=PAYMENT_METHOD_CHOICES, default="cod"
    )
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default="unpaid"
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")
    cancel_reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason or note for cancellation if order is cancelled",
    )
    idempotency_key = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Unique idempotency key preventing duplicate order placement under race conditions.",
    )
    guest_token_hash = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        db_index=True,
        help_text="HMAC hash of the guest ownership token bound to this order.",
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=8, decimal_places=2, default=60)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Order_order"
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_order_number():
        from django.utils import timezone

        date_part = timezone.now().strftime("%y%m%d")
        rand_part = "".join(random.choices(string.digits, k=4))
        candidate = f"KF{date_part}{rand_part}"
        while Order.objects.filter(order_number=candidate).exists():
            rand_part = "".join(random.choices(string.digits, k=4))
            candidate = f"KF{date_part}{rand_part}"
        return candidate


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=255)
    variant_sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "Order_orderitem"

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def subtotal(self):
        return self.price * self.quantity

