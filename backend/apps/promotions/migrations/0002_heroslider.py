# Generated migration for HeroSlider
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Promotions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="HeroSlider",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        help_text="Heading or title for the slide", max_length=200
                    ),
                ),
                (
                    "subtitle",
                    models.CharField(
                        blank=True, help_text="Supporting tagline", max_length=255
                    ),
                ),
                (
                    "badge_text",
                    models.CharField(
                        blank=True,
                        help_text="Badge e.g. 'FESTIVE SALE', '40% OFF'",
                        max_length=50,
                    ),
                ),
                (
                    "image",
                    models.ImageField(
                        help_text="Desktop banner image (recommended 1920x600 or 1400x550)",
                        upload_to="sliders/",
                    ),
                ),
                (
                    "mobile_image",
                    models.ImageField(
                        blank=True,
                        help_text="Optional mobile-specific banner (recommended 800x800 or 750x600)",
                        null=True,
                        upload_to="sliders/mobile/",
                    ),
                ),
                (
                    "link_url",
                    models.CharField(
                        blank=True,
                        default="/products",
                        help_text="Target URL or category path",
                        max_length=255,
                    ),
                ),
                (
                    "cta_text",
                    models.CharField(
                        default="Shop Now", help_text="Button text", max_length=50
                    ),
                ),
                (
                    "order",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Display order (lowest number appears first)",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True, help_text="Toggle slide active status"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Hero Slider",
                "verbose_name_plural": "Hero Sliders",
                "db_table": "Promotions_heroslider",
                "ordering": ["order", "-created_at"],
            },
        ),
    ]

