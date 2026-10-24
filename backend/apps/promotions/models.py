from django.db import models
from django.utils import timezone
from apps.common.validators import validate_image_file


class PromoBanner(models.Model):
    BACKGROUND_CHOICES = [
        ("pine", "Pine (dark green)"),
        ("pinedeep", "Pine Deep (darkest green)"),
        ("mustard", "Mustard (yellow)"),
        ("clay", "Clay (terracotta)"),
    ]

    title = models.CharField(max_length=150)
    badge_text = models.CharField(max_length=20, blank=True)
    subtitle = models.TextField(blank=True)
    image = models.ImageField(upload_to="banners/", blank=True, null=True, validators=[validate_image_file])
    background_color = models.CharField(
        max_length=10, choices=BACKGROUND_CHOICES, default="pinedeep"
    )
    cta_text = models.CharField(max_length=40, default="Shop now")
    link_url = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Promotions_promobanner"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

    @property
    def is_currently_live(self):
        if not self.is_active:
            return False
        now = timezone.now()
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True

    @classmethod
    def get_live_banners(cls):
        now = timezone.now()
        return (
            cls.objects.filter(is_active=True)
            .filter(models.Q(start_date__isnull=True) | models.Q(start_date__lte=now))
            .filter(models.Q(end_date__isnull=True) | models.Q(end_date__gte=now))
        )


class HeroSlider(models.Model):
    """
    Dedicated responsive Hero Carousel Slider model (inspired by GhorerBazar e-commerce slider).
    Supports desktop banner image, mobile-optimized banner image, title, badge, link, and order.
    """
    title = models.CharField(max_length=200, blank=True, default="Banner", help_text="Internal label or title for the banner")
    subtitle = models.CharField(max_length=255, blank=True, help_text="Supporting tagline")
    badge_text = models.CharField(max_length=50, blank=True, help_text="Badge e.g. 'FESTIVE SALE', '40% OFF'")
    image = models.ImageField(
        upload_to="sliders/",
        validators=[validate_image_file],
        help_text="Desktop banner image (recommended 1920x600 or 1400x550)"
    )
    mobile_image = models.ImageField(
        upload_to="sliders/mobile/",
        blank=True,
        null=True,
        validators=[validate_image_file],
        help_text="Optional mobile-specific banner (recommended 800x800 or 750x600)"
    )
    link_url = models.CharField(max_length=255, blank=True, default="/products", help_text="Target URL or category path")
    cta_text = models.CharField(max_length=50, default="Shop Now", help_text="Button text")
    order = models.PositiveIntegerField(default=0, help_text="Display order (lowest number appears first)")
    is_active = models.BooleanField(default=True, help_text="Toggle slide active status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Promotions_heroslider"
        ordering = ["order", "-created_at"]
        verbose_name = "Hero Slider"
        verbose_name_plural = "Hero Sliders"

    def __str__(self):
        return self.title
