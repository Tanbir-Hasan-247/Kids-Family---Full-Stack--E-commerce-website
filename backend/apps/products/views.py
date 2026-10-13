from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Min, Q, F
from django.shortcuts import get_object_or_404
from .models import Product, ProductVariant, AttributeType, AttributeValue, ProductReview
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductVariantSerializer,
    AttributeTypeSerializer,
    AttributeValueSerializer,
    ProductReviewSerializer,
)


class StandardProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get("all", "").lower() == "true":
            return None
        if (
            request.query_params.get("include_inactive", "").lower() == "true"
            and "page" not in request.query_params
        ):
            return None
        if request.query_params.get("featured", "").lower() == "true":
            return None
        return super().paginate_queryset(queryset, request, view)


class ProductListCreateAPIView(generics.ListCreateAPIView):
    """
    List products with rich filtering or create a new product (Admin only).
    
    Query Parameters:
    - cat: Category slug(s) (supports multiple: ?cat=boy&cat=men)
    - q: Search query (matches name, description, category name)
    - sort: 'price_asc', 'price_desc', or 'newest'
    - min_price / max_price: Filter by price range
    - featured: 'true' to get featured homepage products
    """
    pagination_class = StandardProductPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductDetailSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = (
            Product.objects.all()
            .select_related("category", "category__parent")
            .prefetch_related("variants__attributes")
            .annotate(starting_price=Min("variants__price"))
        )

        # Non-admin or standard store listings filter by is_active=True
        all_param = self.request.query_params.get("all", "").lower()
        inactive_param = self.request.query_params.get("include_inactive", "").lower()
        if all_param != "true" and inactive_param != "true":
            queryset = queryset.filter(is_active=True)

        # Category filter (single or multiple)
        cat_slugs = self.request.query_params.getlist("cat")
        if cat_slugs:
            queryset = queryset.filter(
                Q(category__slug__in=cat_slugs) | Q(category__parent__slug__in=cat_slugs)
            )

        # Search query
        search_query = self.request.query_params.get("q")
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query)
                | Q(description__icontains=search_query)
                | Q(category__name__icontains=search_query)
            )

        # Price range filter
        min_price = self.request.query_params.get("min_price")
        if min_price:
            try:
                queryset = queryset.filter(starting_price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get("max_price")
        if max_price:
            try:
                queryset = queryset.filter(starting_price__lte=float(max_price))
            except ValueError:
                pass

        # In-stock filter
        in_stock = self.request.query_params.get("in_stock", "").lower()
        if in_stock == "true":
            queryset = queryset.filter(variants__stock__gt=0)

        # On-sale filter
        on_sale = self.request.query_params.get("on_sale", "").lower()
        if on_sale == "true":
            queryset = queryset.filter(
                variants__compare_at_price__isnull=False,
                variants__compare_at_price__gt=F("variants__price"),
            )

        # Sorting
        sort = self.request.query_params.get("sort")
        if sort == "price_asc":
            queryset = queryset.order_by("starting_price")
        elif sort == "price_desc":
            queryset = queryset.order_by("-starting_price")
        elif sort == "newest":
            queryset = queryset.order_by("-id")
        else:
            queryset = queryset.order_by("-id")

        queryset = queryset.distinct()

        # Featured homepage limit
        if self.request.query_params.get("featured", "").lower() == "true":
            return queryset[:8]

        return queryset


class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a product.
    """
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.all().select_related("category", "category__parent").prefetch_related("variants")

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductVariantLookupAPIView(APIView):
    """
    Find specific variant by product ID, color ID, and size ID.
    Query params: ?color=<id>&size=<id>
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        color_id = request.query_params.get("color")
        size_id = request.query_params.get("size")

        variant_qs = ProductVariant.objects.filter(product=product)
        if color_id:
            variant_qs = variant_qs.filter(attributes__id=color_id)
        if size_id:
            variant_qs = variant_qs.filter(attributes__id=size_id)

        variant = variant_qs.first()
        if not variant:
            return Response(
                {"available": False, "message": "Variant not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "available": True,
            "variant_id": variant.id,
            "sku": variant.sku,
            "price": str(variant.price),
            "compare_at_price": str(variant.compare_at_price) if variant.compare_at_price else None,
            "is_on_sale": variant.is_on_sale,
            "discount_percent": variant.discount_percent,
            "stock": variant.stock,
            "image_url": request.build_absolute_uri(variant.image.url) if variant.image else None,
        })


class SaleProductsAPIView(generics.ListAPIView):
    """
    Returns products that are currently on discount/sale.
    """
    pagination_class = StandardProductPagination
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Product.objects.filter(
                is_active=True,
                variants__compare_at_price__isnull=False,
                variants__compare_at_price__gt=F("variants__price"),
            )
            .select_related("category", "category__parent")
            .distinct()
            .annotate(starting_price=Min("variants__price"))
            .prefetch_related("variants")
            .order_by("-id")
        )


class AttributeTypeListCreateAPIView(generics.ListCreateAPIView):
    """
    List all attribute types (e.g. Color, Size) or create new (Admin).
    """
    queryset = AttributeType.objects.all().order_by("id")
    serializer_class = AttributeTypeSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class AttributeValueListCreateAPIView(generics.ListCreateAPIView):
    """
    List attribute values (can filter by ?type=Color) or create new (Admin).
    """
    serializer_class = AttributeValueSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = AttributeValue.objects.select_related("attribute_type")
        attr_type = self.request.query_params.get("type")
        if attr_type:
            queryset = queryset.filter(attribute_type__name__iexact=attr_type)
        return queryset


class AttributeValueDeleteAPIView(generics.DestroyAPIView):
    """
    Delete an attribute value (Admin only).
    """
    queryset = AttributeValue.objects.all()
    serializer_class = AttributeValueSerializer
    permission_classes = [permissions.IsAdminUser]


class ProductVariantListCreateAPIView(generics.ListCreateAPIView):
    """
    List all variants or create a new variant for a product.
    """
    serializer_class = ProductVariantSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        product_id = self.kwargs.get("product_id")
        if product_id:
            return ProductVariant.objects.filter(product_id=product_id)
        return ProductVariant.objects.all()


class ProductVariantDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product variant.
    """
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    List approved reviews or submit a new review (with rating, comment, and photo) for a product.
    Supports multipart/form-data for image uploads.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        product_id = self.kwargs.get("product_id")
        return ProductReview.objects.filter(product_id=product_id, is_approved=True).order_by("-created_at")

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs.get("product_id"))
        user = self.request.user if self.request.user.is_authenticated else None
        raw_user_name = self.request.data.get("user_name")
        user_name = str(raw_user_name).strip() if raw_user_name else ""
        if not user_name and user:
            user_name = user.get_full_name() or user.email.split("@")[0]
        if not user_name:
            user_name = "সম্মানিত কাস্টমার"

        serializer.save(
            product=product,
            user=user,
            user_name=user_name,
            is_approved=True,
        )


class FeaturedPhotoReviewsAPIView(generics.ListAPIView):
    """
    Returns latest approved photo reviews across all products for Homepage showcase.
    """
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            ProductReview.objects.filter(is_approved=True)
            .exclude(image="")
            .order_by("-created_at")[:12]
        )



