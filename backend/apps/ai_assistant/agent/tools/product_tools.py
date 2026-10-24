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

BANGLA_TO_ENGLISH_SYNONYMS = {
    "পাঞ্জাবি": ["panjabi", "punjabi", "kabli", "kurta"],
    "পাঞ্জাবী": ["panjabi", "punjabi", "kabli", "kurta"],
    "কুর্তা": ["kurta", "panjabi"],
    "শার্ট": ["shirt", "polo", "tshirt", "t-shirt"],
    "টি-শার্ট": ["tshirt", "t-shirt", "shirt"],
    "ফ্রক": ["frock", "gown", "dress"],
    "গাউন": ["frock", "gown", "dress"],
    "কুর্তি": ["kurti", "top"],
    "টপ": ["top", "kurti"],
    "ম্যাচিং": ["matching", "combo", "set"],
    "কম্বো": ["combo", "matching", "set"],
    "বাচ্চা": ["boy", "girl", "kid", "child"],
    "বাচ্চাদের": ["boy", "girl", "kid", "child"],
    "ছেলে": ["boy", "boys"],
    "ছেলেদের": ["boy", "boys"],
    "মেয়ে": ["girl", "girls"],
    "মেয়ে": ["girl", "girls"],
    "মেয়েদের": ["girl", "girls"],
    "পাজামা": ["pajama", "pyjama"],
    "পায়জামা": ["pajama", "pyjama"],
    "ধুতি": ["dhoti"],
    "কটি": ["jacket"],
    "জ্যাকেট": ["jacket"],
    "কাফতান": ["kaftan"],
}



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
    Features smart gender target isolation and garment type enforcement.
    """
    clean_query = normalize_bengali_digits(str(query or "").strip())
    clean_cat = str(category or "").strip()
    q_low = clean_query.lower()
    c_low = clean_cat.lower()

    # Bound limit safely
    try:
        limit_val = max(1, min(int(limit), 8))
    except (ValueError, TypeError):
        limit_val = 4

    # 1. Target Wearer Detection
    targets = set()
    if any(w in q_low for w in ["বাবা", "father", "man", "men", "বাবার", "বাবাদের"]):
        targets.add("man")
    if any(w in q_low for w in ["ছেলে", "boy", "boys", "ছেলেদের", "পোলা"]):
        targets.add("boy")
    if any(w in q_low for w in ["মা", "mother", "woman", "women", "মায়ের"]):
        targets.add("woman")
    if any(w in q_low for w in ["মেয়ে", "মেয়ে", "girl", "girls", "মেয়েদের", "মাইয়া"]):
        targets.add("girl")

    # 2. Garment Type Detection
    garments = []
    if any(w in q_low or w in c_low for w in ["পাঞ্জাবি", "পাঞ্জাবী", "panjabi", "punjabi", "kabli", "কুর্তা", "kurta"]):
        garments = ["panjabi", "punjabi", "kabli", "kurta"]
    elif any(w in q_low or w in c_low for w in ["শার্ট", "shirt", "টি-শার্ট", "tshirt", "t-shirt", "polo", "পোলো"]):
        garments = ["shirt", "polo", "tshirt", "t-shirt"]
    elif any(w in q_low or w in c_low for w in ["ফ্রক", "frock", "gown", "গাউন"]):
        garments = ["frock", "gown"]
    elif any(w in q_low or w in c_low for w in ["লেহেঙ্গা", "lehenga", "lehanga", "choli"]):
        garments = ["lehenga", "lehanga", "choli"]
    elif any(w in q_low or w in c_low for w in ["কুর্তি", "kurti", "top", "টপ", "কামিজ", "salwar", "kameez"]):
        garments = ["kurti", "top", "kameez", "salwar"]
    elif any(w in q_low or w in c_low for w in ["শাড়ি", "শাড়ি", "saree", "shari"]):
        garments = ["saree", "shari"]

    # Build filter criteria
    filters = Q(is_active=True, variants__stock__gt=0)

    # 3. Target Exclusion Guards
    if ("man" in targets or "boy" in targets) and not ("woman" in targets or "girl" in targets):
        filters &= ~Q(
            Q(category__slug__icontains="girl")
            | Q(category__slug__icontains="woman")
            | Q(category__parent__slug__icontains="girl")
            | Q(category__parent__slug__icontains="woman")
            | Q(name__icontains="girls")
            | Q(name__icontains="girl")
            | Q(name__icontains="women")
            | Q(name__icontains="woman")
            | Q(name__icontains="lehanga")
            | Q(name__icontains="lehenga")
            | Q(name__icontains="co-ord")
            | Q(name__icontains="frock")
        )
    elif ("woman" in targets or "girl" in targets) and not ("man" in targets or "boy" in targets):
        filters &= ~Q(
            Q(category__slug__icontains="boy")
            | Q(category__slug__icontains="man")
            | Q(category__parent__slug__icontains="boy")
            | Q(category__parent__slug__icontains="man")
            | Q(name__icontains="boy")
            | Q(name__icontains="boys")
            | Q(name__icontains="men")
            | Q(name__icontains="man")
        )

    # 4. Strict Garment Type Requirement
    if garments:
        garment_q = Q()
        for g in garments:
            garment_q |= Q(name__icontains=g) | Q(category__name__icontains=g) | Q(category__slug__icontains=g)
        filters &= garment_q
    elif clean_query:
        # Fallback keyword matching for non-specific garments
        search_terms = {clean_query}
        for b_word, e_terms in BANGLA_TO_ENGLISH_SYNONYMS.items():
            if b_word in q_low:
                search_terms.update(e_terms)
        query_q = Q()
        for term in search_terms:
            if term == "set":  # Never match standalone 'set' to avoid junk co-ords
                continue
            query_q |= (
                Q(name__icontains=term)
                | Q(description__icontains=term)
                | Q(variants__sku__icontains=term)
            )
        if query_q:
            filters &= query_q

    if clean_cat and not garments:
        cat_terms = {clean_cat}
        for b_word, e_terms in BANGLA_TO_ENGLISH_SYNONYMS.items():
            if b_word in c_low:
                cat_terms.update(e_terms)
        cat_q = Q()
        for cterm in cat_terms:
            cat_q |= (
                Q(category__name__icontains=cterm)
                | Q(category__slug__icontains=cterm)
            )
        filters &= cat_q

    # Exclude previously presented products if specified
    if exclude_ids and isinstance(exclude_ids, list):
        valid_excludes = [int(x) for x in exclude_ids if isinstance(x, (int, str)) and str(x).isdigit()]
        if valid_excludes:
            filters &= ~Q(id__in=valid_excludes)

    # Query active products prefetching in-stock variants
    base_qs = (
        Product.objects.filter(filters)
        .select_related("category", "category__parent")
        .prefetch_related("variants")
        .distinct()
    )

    matching_products = []

    # 5. Smart Pairing for Father & Son matching queries
    if "man" in targets and "boy" in targets:
        from django.db.models import Case, When
        man_prods = list(
            base_qs.filter(Q(category__parent__slug="man") | Q(category__slug__icontains="man") | Q(name__icontains="man"))
            .order_by(Case(When(name__icontains="panjabi", then=0), default=1), "id")[:2]
        )
        boy_prods = list(
            base_qs.filter(Q(category__parent__slug="boy") | Q(category__slug__icontains="boy") | Q(name__icontains="boy"))
            .order_by(Case(When(name__icontains="panjabi", then=0), default=1), "id")[:2]
        )
        paired_list = man_prods + boy_prods
        for product in paired_list:
            matching_products.append(format_product_card(product))
    else:
        for product in base_qs:
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
