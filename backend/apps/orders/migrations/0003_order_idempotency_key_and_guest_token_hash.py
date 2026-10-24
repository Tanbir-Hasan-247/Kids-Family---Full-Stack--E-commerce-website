# Generated for Kids & Family Phase B4 Order Idempotency & Guest Ownership Token Hash

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Order", "0002_order_cancel_reason"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="idempotency_key",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Unique idempotency key preventing duplicate order placement under race conditions.",
                max_length=64,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="guest_token_hash",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="HMAC hash of the guest ownership token bound to this order.",
                max_length=64,
                null=True,
            ),
        ),
    ]

