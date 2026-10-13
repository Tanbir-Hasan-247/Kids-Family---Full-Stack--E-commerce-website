from django.db import models


class ShopSetting(models.Model):
    """
    Global Storefront Configuration & Contact Information.
    Singleton pattern - instance with id=1 used across the store.
    """
    shop_name = models.CharField(max_length=150, default="Kids & Family")
    tagline = models.CharField(
        max_length=255,
        blank=True,
        default="Premium Family Lifestyle & Outfits"
    )
    address = models.CharField(max_length=255, default="Dhaka, Bangladesh")
    phone = models.CharField(max_length=50, default="+880 1700-000000")
    email = models.EmailField(default="support@kidsandfamily.com")
    whatsapp_number = models.CharField(
        max_length=50,
        blank=True,
        default="+880 1700-000000"
    )
    opening_hours = models.CharField(
        max_length=100,
        blank=True,
        default="10 AM - 8 PM"
    )
    helpline_note = models.CharField(
        max_length=255,
        blank=True,
        default="7 Days a Week (10 AM - 8 PM)"
    )

    # Social Links
    facebook_url = models.CharField(max_length=255, blank=True, default="https://facebook.com")
    instagram_url = models.CharField(max_length=255, blank=True, default="https://instagram.com")
    youtube_url = models.CharField(max_length=255, blank=True, default="")

    # Delivery Charges (BDT)
    delivery_inside_dhaka = models.DecimalField(max_digits=8, decimal_places=2, default=60.00)
    delivery_outside_dhaka = models.DecimalField(max_digits=8, decimal_places=2, default=120.00)

    # Footer About text
    footer_about = models.TextField(
        blank=True,
        default=(
            "Premium clothing & festive collections crafted for kids, men, and women. "
            "Celebrating every special family moment with quality, elegance, and comfort."
        )
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Dashboard_shopsetting"
        verbose_name = "Shop Setting"
        verbose_name_plural = "Shop Settings"

    def __str__(self):
        return f"{self.shop_name} ({self.phone})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(
            id=1,
            defaults={
                "shop_name": "Kids & Family",
                "tagline": "Premium Family Lifestyle & Outfits",
                "address": "Dhaka, Bangladesh",
                "phone": "+880 1700-000000",
                "email": "support@kidsandfamily.com",
                "whatsapp_number": "+880 1700-000000",
                "opening_hours": "10 AM - 8 PM",
                "delivery_inside_dhaka": 60.00,
                "delivery_outside_dhaka": 120.00,
            }
        )
        return obj

