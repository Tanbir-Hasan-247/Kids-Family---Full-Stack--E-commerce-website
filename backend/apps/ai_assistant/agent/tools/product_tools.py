import logging
import re
from typing import Dict, Any, List, Optional
from django.db.models import Q
from apps.products.models import Product, ProductVariant
from apps.categories.models import Category
from apps.ai_assistant.services import (
    format_product_card,
    normalize_bengali_digits,
    is_pure_exclusion_or_continuation_query,
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

COLOR_SYNONYMS = {
    "white": "white",
    "সাদা": "white",
    "shada": "white",
    "pink": "pink",
    "গোলাপি": "pink",
    "গোলাপী": "pink",
    "golapi": "pink",
    "red": "red",
    "লাল": "red",
    "lal": "red",
    "blue": "blue",
    "নীল": "blue",
    "nil": "blue",
    "black": "black",
    "কালো": "black",
    "kalo": "black",
    "navy": "navy",
    "নেভি": "navy",
    "nevi": "navy",
    "mustard": "mustard",
    "মাস্টার্ড": "mustard",
    "হলুদ": "mustard",
    "holud": "mustard",
    "maroon": "maroon",
    "মেরুন": "maroon",
    "merun": "maroon",
    "olive": "olive",
    "অলিভ": "olive",
    "oliv": "olive",
    "grey": "grey",
    "gray": "grey",
    "dhusor": "grey",
    "ধূসর": "grey",
    "peach": "peach",
    "পীচ": "peach",
}

BANGLA_SIZE_SYNONYMS = {
    "এস": "S",
    "এম": "M",
    "এল": "L",
    "এক্সএল": "XL",
    "এক্স এল": "XL",
    "ডাবল এক্স এল": "XXL",
    "টু এক্স এল": "XXL",
}


def extract_color_from_text(text: str, available_colors: Optional[List[str]] = None) -> Optional[str]:
    """Extracts standardized color name from Bengali/English/Banglish conversational text."""
    if not text:
        return None
    clean = normalize_bengali_digits(text).lower()

    # 1. Match against product's confirmed available colors
    if available_colors:
        for c in sorted(available_colors, key=len, reverse=True):
            c_low = c.lower()
            if re.search(r"(?:^|[^\w])" + re.escape(c_low) + r"(?:[^\w]|$)", clean):
                return c
            for syn, canon in COLOR_SYNONYMS.items():
                if canon == c_low and re.search(r"(?:^|[^\w])" + re.escape(syn) + r"(?:[^\w]|$)", clean):
                    return c

    # 2. General color synonym dictionary
    for syn, canon in COLOR_SYNONYMS.items():
        if re.search(r"(?:^|[^\w])" + re.escape(syn) + r"(?:[^\w]|$)", clean):
            return canon.capitalize()

    return None


def extract_size_from_text(text: str, available_sizes: Optional[List[str]] = None) -> Optional[str]:
    """Extracts standardized garment size or age tag from conversational text."""
    if not text:
        return None
    clean = normalize_bengali_digits(text)
    low = clean.lower()

    # 1. Match against product's confirmed available sizes
    if available_sizes:
        for s in sorted(available_sizes, key=len, reverse=True):
            s_norm = s.strip().upper()
            pat = r"(?:^|[^\w])" + re.escape(s.lower()) + r"(?:[^\w]|$)"
            if re.search(pat, low):
                return s_norm

    # 2. Bangla phonetic letter sizes (এস, এম, এল, ইত্যাদি)
    for b_sz, std_sz in BANGLA_SIZE_SYNONYMS.items():
        if re.search(r"(?:^|[^\w])" + re.escape(b_sz) + r"(?:[^\w]|$)", clean):
            return std_sz

    # 3. Age ranges: e.g. 2-3Y, 4-5Y, 6-12M, ২-৩ বছর, 2-3 year
    m_age = re.search(
        r"\b(\d+)\s*[-–to]\s*(\d+)\s*(?:y|yr|yrs|year|years|বছর|বছরের|m|month|months|মাস|মাসের)?\b",
        clean,
        re.IGNORECASE,
    )
    if m_age:
        # Determine whether months or years
        span_after = clean[m_age.end():min(len(clean), m_age.end() + 10)].lower()
        span_full = clean[m_age.start():min(len(clean), m_age.end() + 10)].lower()
        is_month = any(w in span_full for w in ["month", "months", "মাস", "মাসের"])
        unit = "M" if is_month else "Y"
        return f"{m_age.group(1)}-{m_age.group(2)}{unit}"

    # 4. Standard letter sizes: S, M, L, XL, XXL, XXXL, XS
    m_sz = re.search(r"\b(XXXL|XXL|XL|XS|[SML])\b(?:\s*(?:size|সাইজ))?", clean, re.IGNORECASE)
    if m_sz:
        return m_sz.group(1).upper()

    # 5. Words with 'size': e.g. "m size", "L সাইজ"
    m_sz_word = re.search(r"\b(XXXL|XXL|XL|XS|[SML]|\d+)\s*(?:size|সাইজ)\b", clean, re.IGNORECASE)
    if m_sz_word:
        return m_sz_word.group(1).upper()

    return None


def resolve_variant_for_product(
    product_id: int,
    color: Optional[str] = None,
    size: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Resolves product variant against verified live database records.
    Never fabricates a variant ID or assumes a combination is in stock.
    Returns structured resolution with verified variant and available alternatives.
    """
    try:
        product = (
            Product.objects.filter(id=int(product_id), is_active=True)
            .prefetch_related("variants__attributes__attribute_type")
            .first()
        )
    except (ValueError, TypeError):
        product = None

    if not product:
        return {
            "success": False,
            "reason": "product_not_found",
            "message": "পণ্যটি খুঁজে পাওয়া যায়নি বা বর্তমানে নিষ্ক্রিয় রয়েছে।",
        }

    # Extract all variants and their verified attributes
    variants_data = []
    confirmed_options = {}  # { color: [sizes] }
    all_colors = set()
    all_sizes = set()

    for v in product.variants.all():
        v_color = None
        v_size = None
        for a in v.attributes.all():
            at = a.attribute_type.name.lower()
            if "color" in at or "রং" in at:
                v_color = a.value
            elif "size" in at:
                v_size = a.value

        if v_color:
            all_colors.add(v_color)
            if v_size:
                all_sizes.add(v_size)
                confirmed_options.setdefault(v_color, []).append(v_size)
            else:
                confirmed_options.setdefault(v_color, [])
        elif v_size:
            all_sizes.add(v_size)

        variants_data.append({
            "variant": v,
            "id": v.id,
            "sku": v.sku,
            "color": v_color,
            "size": v_size,
            "price": float(v.price),
            "stock": v.stock,
            "in_stock": v.stock > 0,
        })

    norm_color = color.lower().strip() if color else None
    if norm_color and norm_color in COLOR_SYNONYMS:
        norm_color = COLOR_SYNONYMS[norm_color]

    norm_size = size.upper().strip() if size else None

    # 1. Exact Match: Both color and size specified
    if norm_color and norm_size:
        for vd in variants_data:
            c_val = (vd["color"] or "").lower()
            s_val = (vd["size"] or "").upper()
            c_matched = c_val == norm_color or COLOR_SYNONYMS.get(c_val) == norm_color
            if c_matched and s_val == norm_size:
                return {
                    "success": True,
                    "variant": vd["variant"],
                    "variant_id": vd["id"],
                    "sku": vd["sku"],
                    "color": vd["color"],
                    "size": vd["size"],
                    "price": vd["price"],
                    "stock": vd["stock"],
                    "in_stock": vd["in_stock"],
                    "product": product,
                }

        # Exact combination not found
        return {
            "success": False,
            "reason": "variant_not_found",
            "product": product,
            "product_id": product.id,
            "product_name": product.name,
            "requested_color": color,
            "requested_size": size,
            "confirmed_options": confirmed_options,
            "all_colors": list(all_colors),
            "all_sizes": list(all_sizes),
            "variants_data": variants_data,
        }

    # 2. Only Color Specified
    elif norm_color and not norm_size:
        matched = [
            vd for vd in variants_data
            if (vd["color"] or "").lower() == norm_color or COLOR_SYNONYMS.get((vd["color"] or "").lower()) == norm_color
        ]
        if not matched:
            return {
                "success": False,
                "reason": "color_not_found",
                "product": product,
                "requested_color": color,
                "confirmed_options": confirmed_options,
                "all_colors": list(all_colors),
                "all_sizes": list(all_sizes),
            }
        # If exactly 1 variant for this color, or 1 in-stock variant
        in_stock_matched = [m for m in matched if m["in_stock"]]
        target = in_stock_matched[0] if len(in_stock_matched) == 1 else (matched[0] if len(matched) == 1 else None)
        if target:
            return {
                "success": True,
                "variant": target["variant"],
                "variant_id": target["id"],
                "sku": target["sku"],
                "color": target["color"],
                "size": target["size"],
                "price": target["price"],
                "stock": target["stock"],
                "in_stock": target["in_stock"],
                "product": product,
            }
        return {
            "success": False,
            "reason": "multiple_sizes_available",
            "product": product,
            "requested_color": color,
            "available_sizes": [m["size"] for m in matched if m["size"]],
            "confirmed_options": confirmed_options,
        }

    # 3. Only Size Specified
    elif norm_size and not norm_color:
        matched = [vd for vd in variants_data if (vd["size"] or "").upper() == norm_size]
        if not matched:
            return {
                "success": False,
                "reason": "size_not_found",
                "product": product,
                "requested_size": size,
                "confirmed_options": confirmed_options,
                "all_colors": list(all_colors),
                "all_sizes": list(all_sizes),
            }
        in_stock_matched = [m for m in matched if m["in_stock"]]
        target = in_stock_matched[0] if len(in_stock_matched) == 1 else (matched[0] if len(matched) == 1 else None)
        if target:
            return {
                "success": True,
                "variant": target["variant"],
                "variant_id": target["id"],
                "sku": target["sku"],
                "color": target["color"],
                "size": target["size"],
                "price": target["price"],
                "stock": target["stock"],
                "in_stock": target["in_stock"],
                "product": product,
            }
        return {
            "success": False,
            "reason": "multiple_colors_available",
            "product": product,
            "requested_size": size,
            "available_colors": [m["color"] for m in matched if m["color"]],
            "confirmed_options": confirmed_options,
        }

    # 4. Neither Specified (Single/Default variant product)
    in_stock_vars = [vd for vd in variants_data if vd["in_stock"]]
    chosen = in_stock_vars[0] if in_stock_vars else (variants_data[0] if variants_data else None)
    if chosen:
        return {
            "success": True,
            "variant": chosen["variant"],
            "variant_id": chosen["id"],
            "sku": chosen["sku"],
            "color": chosen["color"],
            "size": chosen["size"],
            "price": chosen["price"],
            "stock": chosen["stock"],
            "in_stock": chosen["in_stock"],
            "product": product,
        }

    return {
        "success": False,
        "reason": "no_variants_found",
        "product": product,
        "confirmed_options": confirmed_options,
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

    # Exclude previously presented products if explicitly requested (e.g. pagination/exclusion query)
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
    Includes verified attribute breakdown and pre-formatted product card for chat rendering.
    """
    product = None
    if product_id is not None:
        try:
            product = (
                Product.objects.filter(id=int(product_id), is_active=True)
                .prefetch_related("variants__attributes__attribute_type")
                .first()
            )
        except (ValueError, TypeError):
            pass

    if not product and product_name:
        clean_name = str(product_name).strip()
        product = (
            Product.objects.filter(name__icontains=clean_name, is_active=True)
            .prefetch_related("variants__attributes__attribute_type")
            .first()
        )

    if not product:
        return {
            "success": False,
            "error": "Product not found or currently inactive.",
            "product": None,
        }

    variants_data = []
    confirmed_combinations = {}
    for v in product.variants.all():
        v_color = None
        v_size = None
        for a in v.attributes.all():
            at = a.attribute_type.name.lower()
            if "color" in at or "রং" in at:
                v_color = a.value
            elif "size" in at:
                v_size = a.value

        if v_color:
            confirmed_combinations.setdefault(v_color, []).append({
                "size": v_size,
                "variant_id": v.id,
                "stock": v.stock,
                "in_stock": v.stock > 0,
            })

        variants_data.append({
            "variant_id": v.id,
            "sku": v.sku,
            "color": v_color,
            "size": v_size,
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
        "confirmed_combinations": confirmed_combinations,
        "card": format_product_card(product),
    }
