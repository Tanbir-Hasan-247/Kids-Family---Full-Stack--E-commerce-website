from django.db import models
from django.conf import settings
from apps.categories.models import Category


class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "Product_product"
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        if hasattr(self, "_average_rating"):
            return self._average_rating
        # Use prefetched reviews cache if available to prevent N+1 queries
        if hasattr(self, "_prefetched_objects_cache") and "reviews" in self._prefetched_objects_cache:
            approved = [r for r in self.reviews.all() if r.is_approved]
            if approved:
                return round(sum(r.rating for r in approved) / len(approved), 1)
            return 5.0
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            total = sum(r.rating for r in reviews)
            return round(total / reviews.count(), 1)
        return 5.0

    @average_rating.setter
    def average_rating(self, value):
        self._average_rating = value

    @property
    def reviews_count(self):
        if hasattr(self, "_reviews_count"):
            return self._reviews_count
        if hasattr(self, "_prefetched_objects_cache") and "reviews" in self._prefetched_objects_cache:
            return len([r for r in self.reviews.all() if r.is_approved])
        return self.reviews.filter(is_approved=True).count()

    @reviews_count.setter
    def reviews_count(self, value):
        self._reviews_count = value



class AttributeType(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = "Product_attributetype"
        verbose_name = "Attribute Type"
        verbose_name_plural = "Attribute Types"

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    attribute_type = models.ForeignKey(AttributeType, on_delete=models.CASCADE)
    value = models.CharField(max_length=50)

    class Meta:
        db_table = "Product_attributevalue"
        verbose_name = "Attribute Value"
        verbose_name_plural = "Attribute Values"

    def __str__(self):
        return f"{self.attribute_type.name}: {self.value}"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, related_name="variants", on_delete=models.CASCADE
    )
    attributes = models.ManyToManyField(
        AttributeValue, db_table="Product_productvariant_attributes"
    )
    sku = models.CharField(max_length=100, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="variants/", null=True, blank=True)

    class Meta:
        db_table = "Product_productvariant"
        verbose_name = "Product Variant"
        verbose_name_plural = "Product Variants"

    def __str__(self):
        return f"{self.product.name} - {self.sku}"

    @property
    def is_on_sale(self):
        return self.compare_at_price is not None and self.compare_at_price > self.price

    @property
    def discount_percent(self):
        if not self.is_on_sale:
            return 0
        return round((self.compare_at_price - self.price) / self.compare_at_price * 100)


class ProductReview(models.Model):
    product = models.ForeignKey(
        Product, related_name="reviews", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="product_reviews",
    )
    user_name = models.CharField(max_length=150)
    rating = models.PositiveSmallIntegerField(default=5)  # 1 to 5 stars
    comment = models.TextField()
    image = models.ImageField(upload_to="reviews/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=True)

    class Meta:
        db_table = "Product_review"
        ordering = ["-created_at"]
        verbose_name = "Product Review"
        verbose_name_plural = "Product Reviews"

    def __str__(self):
        return f"{self.user_name} ({self.rating}★) on {self.product.name}"


