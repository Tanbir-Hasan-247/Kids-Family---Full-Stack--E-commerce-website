"""
Product Catalog & Inventory Tools for AI Shopping Agent.
Safe, read-only product search and variant inspection grounded in live database state.
"""

import logging
from typing import Dict, Any, List, Optional
from django.db.models import Q
from apps.products.models import Product, ProductVariant
from apps.categories.models import Category
from apps.ai_assistant.services import (
    format_product_card,
    normalize_bengali_digits,
)

logger = logging.getLogger(__name__)


def execute_search_products(
    query: str = "",
    category: str = "",
    max_price: Optional[float] = None,
    limit: int = 4,
    exclude_ids: Optional[List[int]] = None,
    **kwargs,
) -> Dict[str, Any]:
    """
    Searches active products with verified in-stock variants.
    Rejects malformed filters and bounds results to maximum 8 items.
    """
    clean_query = normalize_bengali_digits(str(query or "").strip())
    clean_cat = str(category or "").strip()

    # Bound limit safely
    try:
        limit_val = max(1, min(int(limit), 8))
    except (ValueError, TypeError):
        limit_val = 4

    # Build filter criteria
    filters = Q(is_active=True)

    if clean_query:
        filters &= (
            Q(name__icontains=clean_query)
            | Q(description__icontains=clean_query)
            | Q(variants__sku__icontains=clean_query)
        )

    if clean_cat:
        filters &= (
            Q(category__name__icontains=clean_cat)
            | Q(category__slug__icontains=clean_cat)
        )

    # Exclude previously presented products if specified
    if exclude_ids and isinstance(exclude_ids, list):
        valid_excludes = [int(x) for x in exclude_ids if isinstance(x, (int, str)) and str(x).isdigit()]
        if valid_excludes:
            filters &= ~Q(id__in=valid_excludes)

    # Query active products prefetching in-stock variants
    qs = (
        Product.objects.filter(filters)
        .prefetch_related("variants")
        .distinct()
    )

    matching_products = []
    for product in qs:
        # Check that product has at least one variant with live stock > 0
        in_stock_variants = [v for v in product.variants.all() if v.stock > 0]
        if not in_stock_variants:
            continue

        # Price ceiling filter
        if max_price is not None:
            try:
                max_p = float(max_price)
                min_variant_price = min(float(v.price) for v in in_stock_variants)
                if min_variant_price > max_p:
                    continue
            except (ValueError, TypeError):
                pass

        card = format_product_card(product)
        matching_products.append(card)
        if len(matching_products) >= limit_val:
            break

    return {
        "success": True,
        "count": len(matching_products),
        "products": matching_products,
        "applied_filters": {
            "query": clean_query,
            "category": clean_cat,
            "max_price": max_price,
        },
    }


def execute_get_product_details(
    product_id: Optional[int] = None,
    product_name: str = "",
    **kwargs,
) -> Dict[str, Any]:
    """
    Retrieves full variant breakdown, sizes, colors, and live stock for a specific product.
    """
    product = None
    if product_id is not None:
        try:
            product = Product.objects.filter(id=int(product_id), is_active=True).first()
        except (ValueError, TypeError):
            pass

    if not product and product_name:
        clean_name = str(product_name).strip()
        product = Product.objects.filter(name__icontains=clean_name, is_active=True).first()

    if not product:
        return {
            "success": False,
            "error": "Product not found or currently inactive.",
            "product": None,
        }

    variants_data = []
    for v in product.variants.all():
        variants_data.append({
            "variant_id": v.id,
            "sku": v.sku,
            "price": float(v.price),
            "stock": v.stock,
            "in_stock": v.stock > 0,
        })

    return {
        "success": True,
        "product_id": product.id,
        "name": product.name,
        "description": product.description,
        "base_price": float(product.base_price),
        "total_stock": sum(v["stock"] for v in variants_data),
        "variants": variants_data,
    }
