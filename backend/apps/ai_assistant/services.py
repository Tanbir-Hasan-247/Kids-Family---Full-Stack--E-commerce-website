import re
from decimal import Decimal
from django.db.models import Q
from apps.dashboard.models import ShopSetting
from apps.products.models import Product, ProductVariant
from apps.categories.models import Category
from apps.orders.models import Order
from .gemini_service import call_gemini_text, call_gemini_json, get_gemini_client, PRIMARY_MODEL


def get_store_context():
    """
    Fetches real-time shop configuration and category catalogue
    to ground Gemini in actual shop data.
    """
    setting = ShopSetting.objects.first()
    shop_name = setting.shop_name if setting else "Kids & Family"
    inside_dhaka = float(setting.delivery_inside_dhaka) if setting else 60.0
    outside_dhaka = float(setting.delivery_outside_dhaka) if setting else 120.0
    phone = setting.phone if setting else "+880 1700-000000"
    whatsapp = setting.whatsapp_number if setting else phone
    address = setting.address if setting else "Dhaka, Bangladesh"
    hours = setting.opening_hours if setting else "10 AM - 8 PM"

    categories = list(Category.objects.values_list("name", flat=True)[:15])

    context = {
        "shop_name": shop_name,
        "delivery_inside_dhaka": inside_dhaka,
        "delivery_outside_dhaka": outside_dhaka,
        "phone": phone,
        "whatsapp": whatsapp,
        "address": address,
        "hours": hours,
        "categories": ", ".join(categories),
    }
    return context


def format_product_card(product):
    """
    Serializes a Product instance into a lightweight card
    for direct rendering in the AI chat drawer or search result.
    """
    thumbnail_url = ""
    variants = list(product.variants.all())
    for v in variants:
        if v.image:
            thumbnail_url = v.image.url
            break

    prices = [v.price for v in variants if v.price is not None]
    starting_price = min(prices) if prices else product.base_price

    compare_prices = [v.compare_at_price for v in variants if v.compare_at_price]
    has_discount = False
    max_discount = 0
    if compare_prices and starting_price:
        max_compare = max(compare_prices)
        if max_compare > starting_price:
            has_discount = True
            max_discount = round(((max_compare - starting_price) / max_compare) * 100)

    in_stock = any(v.stock > 0 for v in variants) if variants else True
    primary_variant_id = variants[0].id if variants else None

    sizes = set()
    colors = set()
    for v in variants:
        for attr in v.attributes.all():
            attr_type = attr.attribute_type.name.lower()
            if "size" in attr_type:
                sizes.add(attr.value)
            elif "color" in attr_type or "রং" in attr_type:
                colors.add(attr.value)

    parent_name = product.category.parent.name if product.category and product.category.parent else ""
    cat_label = f"{parent_name} • {product.category.name}" if parent_name else (product.category.name if product.category else "")

    return {
        "id": product.id,
        "name": product.name,
        "category_name": cat_label,
        "starting_price": float(starting_price),
        "thumbnail": thumbnail_url,
        "average_rating": float(getattr(product, "average_rating", 5.0)),
        "is_on_sale": has_discount,
        "max_discount": max_discount,
        "in_stock": in_stock,
        "primary_variant_id": primary_variant_id,
        "available_sizes": list(sizes)[:5],
        "available_colors": list(colors)[:4],
    }


def find_recommended_products(message: str, limit: int = 6):
    """
    Intelligent shopping recommender with multi-target family combo support
    in English, Bengali, and Banglish (e.g. 'baba ma cele 3joner jonno 3ta item select koro').
    """
    lower = message.lower()

    # 1. Family member target detection (Strict regex boundaries)
    target_patterns = {
        "man": [
            r"\b(?:baba|babar|abba|abbar|father|dad|men|mens|purush|husband|shami)\b",
            r"(?<![a-zA-Z])man(?![a-zA-Z])",
            r"(?:বাবা|বাবার|আব্বু|আব্বুর|পুরুষ|স্বামী)",
        ],
        "woman": [
            r"\b(?:ma|mar|mayer|ammu|ammur|mother|mom|women|womens|mohela|mahila|nari|wife|bou)\b",
            r"(?<![a-zA-Z])woman(?![a-zA-Z])",
            r"(?:মা|মায়ের|আম্মু|আম্মুর|মহিলা|নারী|বউ)",
        ],
        "boy": [
            r"\b(?:cele|celer|chele|cheler|chhele|chheler|son|boy|boys|babu|babur|baccha|bacchader|kid|kids|shishu|polapan)\b",
            r"(?:ছেলে|ছেলের|ছেলেদের|পুত্র|সোনামণি)",
        ],
        "girl": [
            r"\b(?:meye|meyer|meyeder|maiya|daughter|girl|girls|konna|khuki)\b",
            r"(?:মেয়ে|মেয়ের|মেয়েদের|কন্যা|খুকি)",
        ],
    }

    detected_targets = []
    for target_key, patterns in target_patterns.items():
        if any(re.search(pat, lower, re.IGNORECASE) for pat in patterns):
            detected_targets.append(target_key)

    # 2. Category / apparel keywords
    apparel_keywords = []
    if any(w in lower for w in ["panjabi", "punjabi", "পাঞ্জাবি", "kurta", "কুর্তা", "kabli", "কটি"]):
        apparel_keywords.append("panjabi")
    elif any(w in lower for w in ["frock", "ফ্রক", "dress", "ড্রেস", "gown", "গাউন"]):
        apparel_keywords.append("frock")
    elif any(w in lower for w in ["shirt", "শার্ট", "polo", "পোলো", "tshirt", "t-shirt"]):
        apparel_keywords.append("shirt")
    elif any(w in lower for w in ["kurti", "কুর্তি", "saree", "shari", "শাড়ি", "salwar", "kameez", "kamiz", "কামিজ"]):
        apparel_keywords.append("kurti")

    # 3. Budget extraction
    budget_match = re.search(r"(\d{3,5})\s*(?:টাকা|tk|bdt|টাকার|পর্যন্ত|মধ্যে|under)?", lower)
    max_budget = None
    if budget_match and any(w in lower for w in ["টাকা", "tk", "under", "বাজেট", "মধ্যে", "দাম"]):
        try:
            max_budget = float(budget_match.group(1))
        except Exception:
            max_budget = None

    # Base QuerySet
    base_qs = (
        Product.objects.filter(is_active=True)
        .select_related("category", "category__parent")
        .prefetch_related("variants__attributes__attribute_type")
    )
    if max_budget is not None:
        base_qs = base_qs.filter(base_price__lte=max_budget)

    results = []

    # CASE A: Multiple family members requested (e.g. 'baba ma cele' -> Father + Mother + Son)
    if len(detected_targets) > 1:
        for t_slug in detected_targets:
            cat = Category.objects.filter(slug__iexact=t_slug).first()
            if cat:
                target_qs = base_qs.filter(Q(category=cat) | Q(category__parent=cat))
                if apparel_keywords:
                    for kw in apparel_keywords:
                        kw_qs = target_qs.filter(Q(name__icontains=kw) | Q(category__name__icontains=kw))
                        if kw_qs.exists():
                            target_qs = kw_qs
                            break
                prod = target_qs.first()
                if prod and prod not in results:
                    results.append(prod)

        # Check for Matching Sets if requested or complementary
        is_combo_request = any(
            w in lower
            for w in ["combo", "matching", "কম্বো", "ম্যাচিং", "set", "সেট", "family", "ফ্যামিলি", "৩ জন", "3jon", "3ta", "3joner"]
        )
        if is_combo_request:
            combo_qs = base_qs.filter(
                Q(category__name__icontains="matching")
                | Q(name__icontains="matching")
                | Q(name__icontains="combo")
            )
            for p in combo_qs:
                if p not in results:
                    results.append(p)
                    break

    # CASE B: Single target requested (e.g. 'ছেলেদের পাঞ্জাবি' or 'বাবার জন্য শার্ট')
    elif len(detected_targets) == 1:
        t_slug = detected_targets[0]
        cat = Category.objects.filter(slug__iexact=t_slug).first()
        target_qs = base_qs.filter(Q(category=cat) | Q(category__parent=cat)) if cat else base_qs

        if apparel_keywords:
            for kw in apparel_keywords:
                kw_match = target_qs.filter(Q(name__icontains=kw) | Q(category__name__icontains=kw))
                if kw_match.exists():
                    target_qs = kw_match
                    break

        results = list(target_qs[:limit])

    # CASE C: Specific apparel or generic shopping request without explicit targets
    else:
        # Check if this is purely customer support / informational without product shopping intent
        is_pure_support = any(
            w in lower
            for w in [
                "delivery charge", "ডেলিভারি চার্জ", "রিটার্ন", "exchange",
                "phone", "ফোন", "ঠিকানা", "location", "address", "kemon achen", "কেমন আছেন",
                "hi", "hello", "halo", "ধন্যবাদ", "thanks", "thank you"
            ]
        ) and not any(w in lower for w in ["kinte", "dekhao", "dress", "shirt", "panjabi", "item", "product", "cart", "কার্ট"])

        if is_pure_support:
            return []

        is_generic_shopping = any(
            w in lower
            for w in [
                "item", "select", "dekhao", "dekhan", "kinbo", "kinte", "chai", "lagbe", "khujchi",
                "suggest", "recommend", "dress", "outfit", "collection", "popular", "notun", "best",
                "পণ্য", "পোশাক", "ড্রেস", "সিলেক্ট", "দেখাও", "কিনব", "কিনতে", "কালেকশন", "সেরা"
            ]
        ) or bool(apparel_keywords)

        if is_generic_shopping or any(w in lower for w in ["add to cart", "কার্ট", "বাটন", "aslona"]):
            target_qs = base_qs
            if apparel_keywords:
                for kw in apparel_keywords:
                    kw_match = target_qs.filter(Q(name__icontains=kw) | Q(category__name__icontains=kw))
                    if kw_match.exists():
                        target_qs = kw_match
                        break
            results = list(target_qs[:limit])

    return [format_product_card(p) for p in results[:limit]]


def search_matching_products(keywords="", category_keyword="", min_price=None, max_price=None, limit=6):
    """
    Queries active products matching keywords or category with prefetching.
    """
    qs = (
        Product.objects.filter(is_active=True)
        .select_related("category", "category__parent")
        .prefetch_related("variants__attributes__attribute_type")
    )

    if category_keyword:
        qs = qs.filter(
            Q(category__name__icontains=category_keyword)
            | Q(category__parent__name__icontains=category_keyword)
            | Q(category__slug__icontains=category_keyword)
        )

    if keywords:
        terms = [t.strip() for t in keywords.split() if len(t.strip()) > 1]
        for term in terms:
            qs = qs.filter(
                Q(name__icontains=term)
                | Q(description__icontains=term)
                | Q(category__name__icontains=term)
                | Q(category__parent__name__icontains=term)
            )

    if min_price is not None:
        qs = qs.filter(base_price__gte=min_price)

    if max_price is not None:
        qs = qs.filter(base_price__lte=max_price)

    products = list(qs.distinct()[:limit])
    return [format_product_card(p) for p in products]


def lookup_order(query: str):
    """
    Finds order by Order Number (e.g. KF2610137748) or Phone number.
    Returns structured data and human-friendly Bengali status breakdown.
    """
    if not query:
        return None

    query = query.strip()
    orders_qs = Order.objects.prefetch_related(
        "items__variant__product",
        "items__variant__attributes__attribute_type",
    )

    orders = list(orders_qs.filter(order_number__iexact=query))

    if not orders:
        clean_digits = re.sub(r"[^\d]", "", query)
        filters = Q(phone__icontains=query) | Q(order_number__icontains=query)

        if clean_digits:
            filters |= Q(phone__icontains=clean_digits)
            if clean_digits.startswith("880") and len(clean_digits) > 3:
                filters |= Q(phone__icontains=clean_digits[2:])
            elif clean_digits.startswith("0") and len(clean_digits) > 1:
                filters |= Q(phone__icontains=clean_digits[1:])

        orders = list(orders_qs.filter(filters).order_by("-created_at"))

    if not orders:
        return None

    order = orders[0]

    status_map = {
        "pending": {"title": "পেন্ডিং (অর্ডার গৃহীত হয়েছে)", "step": 1, "desc": "আপনার অর্ডারটি গ্রহণ করা হয়েছে এবং পর্যালোচনাধীন।"},
        "confirmed": {"title": "কনফার্মড (নিশ্চিত হয়েছে)", "step": 2, "desc": "অর্ডারটি নিশ্চিত হয়েছে এবং পার্সেল প্রস্তুত হচ্ছে।"},
        "processing": {"title": "প্রসেসিং হচ্ছে", "step": 3, "desc": "পোশাকগুলো সতর্কতার সাথে প্যাক করা হচ্ছে।"},
        "shipped": {"title": "শিপড (কুরিয়ারে হস্তান্তর)", "step": 4, "desc": "পার্সেলটি কুরিয়ারে দেওয়া হয়েছে, দ্রুত ডেলিভারি হবে।"},
        "delivered": {"title": "ডেলিভারি সম্পন্ন", "step": 5, "desc": "পার্সেলটি সফলভাবে আপনার হাতে পৌঁছে দেওয়া হয়েছে।"},
        "cancelled": {"title": "বাতিল করা হয়েছে", "step": 0, "desc": f"অর্ডারটি বাতিল করা হয়েছে। কারণ: {order.cancel_reason or 'গ্রাহকের অনুরোধে'}"},
    }
    status_info = status_map.get(order.status, {"title": order.status.title(), "step": 1, "desc": "অর্ডার পর্যালোচনাধীন।"})

    items = []
    for item in order.items.all():
        items.append({
            "product_name": item.product_name,
            "quantity": item.quantity,
            "price": float(item.price),
            "variant_sku": item.variant_sku,
        })

    return {
        "order_number": order.order_number,
        "full_name": order.full_name,
        "phone": order.phone,
        "address": f"{order.address_line}, {order.city}",
        "city": order.city,
        "status": order.status,
        "status_title": status_info["title"],
        "status_desc": status_info["desc"],
        "step": status_info["step"],
        "total": float(order.total),
        "shipping_fee": float(order.shipping_fee),
        "payment_method": "ক্যাশ অন ডেলিভারি" if order.payment_method == "cod" else "অনলাইন পেমেন্ট",
        "payment_status": "পরিশোধিত" if order.payment_status == "paid" else "অপরিশোধিত",
        "created_at": order.created_at.strftime("%d %b %Y, %I:%M %p"),
        "items": items,
    }


def handle_chat_turn(message: str, history: list = None, session_key: str = None, user=None):
    """
    Main entry point for AI Shopping Chatbot.
    Uses Google Gemini AI to generate warm, natural, human-like answers
    grounded in live shop data, product catalogue, and order records.
    """
    message_clean = (message or "").strip()
    if not message_clean:
        return {
            "success": True,
            "reply": "স্বাগতম! আমি Kids & Family-এর AI শপিং সহকারী 🤖\nআপনাকে কীভাবে সাহায্য করতে পারি? পণ্য খোঁজা, সাইজ নির্ধারণ, ডেলিভারি তথ্য বা অর্ডার ট্র্যাক করতে যেকোনো প্রশ্ন করতে পারেন।",
            "products": [],
            "order": None,
            "intent": "greeting",
        }

    ctx = get_store_context()
    lower = message_clean.lower()

    # 1. Order Tracking Detection
    order_id_match = re.search(r"(KF\d{8,14})", message_clean, re.IGNORECASE)
    phone_match = re.search(r"(?:(?:\+?880|0)1[3-9]\d{8})", message_clean)

    matched_order_query = None
    if order_id_match:
        matched_order_query = order_id_match.group(1).upper()
    elif phone_match and any(w in lower for w in ["order", "track", "status", "পার্সেল", "অর্ডার", "কোথায়", "ডেলিভারি", "খবর"]):
        matched_order_query = phone_match.group(0)

    order_data = lookup_order(matched_order_query) if matched_order_query else None

    # 2. Product Search & Recommendation via intelligent multi-target recommender
    matched_products = find_recommended_products(message_clean, limit=4)

    # 3. Call Google Gemini AI to generate the response
    system_instruction = (
        f"You are the friendly, intelligent AI Shopping Assistant for '{ctx['shop_name']}' "
        f"(a premium family fashion & lifestyle brand in Bangladesh).\n\n"
        f"STORE FACTS & POLICIES:\n"
        f"- Inside Dhaka delivery: ৳{ctx['delivery_inside_dhaka']:.0f} (24 to 48 hours)\n"
        f"- Outside Dhaka delivery: ৳{ctx['delivery_outside_dhaka']:.0f} (3 to 5 business days)\n"
        f"- Payment: Cash on Delivery (ক্যাশ অন ডেলিভারি / COD) available all over Bangladesh, plus bKash, Nagad, cards.\n"
        f"- Return & Exchange: 7-day hassle-free return or exchange policy for size or defect issues.\n"
        f"- Contact & WhatsApp: {ctx['whatsapp']}\n"
        f"- Address: {ctx['address']} (Open: {ctx['hours']})\n"
        f"- Main catalogue: Boys & Girls festive wear, Men's Panjabi & Shirts, Women's Kurti & Sarees, and Family Matching Combo Sets.\n\n"
        f"CRITICAL RULES:\n"
        f"1. Always respond in warm, natural Bengali (mix common e-commerce terms like 'Add to Cart', 'Size', 'Delivery' naturally).\n"
        f"2. If attached products are provided in '[ATTACHED PRODUCTS]', introduce them warmly. "
        f"Inform the customer that interactive product cards with a real 'কার্টে নিন' (Add to Cart) button are attached below each item!\n"
        f"3. NEVER type fake markdown buttons like '[Add to Cart]' or '[Add to Cart - ...]' in your text. The UI automatically displays the real buttons on the cards below.\n"
        f"4. If '[NO PRODUCTS ATTACHED]' is stated, DO NOT claim an Add to Cart button is attached. Politely ask the customer what category, age, or style they are looking for.\n"
        f"5. If order tracking details are provided, warmly explain the order status, items, and courier progress.\n"
    )

    gemini_prompt = f"Customer message: {message_clean}\n"

    if order_data:
        gemini_prompt += (
            f"\n[LIVE DATABASE ORDER FOUND]:\n"
            f"Order Number: {order_data['order_number']}\n"
            f"Customer Name: {order_data['full_name']}\n"
            f"Status: {order_data['status_title']} ({order_data['status_desc']})\n"
            f"Step: {order_data['step']} of 5\n"
            f"Items: {', '.join([f'{i['product_name']} x{i['quantity']}' for i in order_data['items']])}\n"
            f"Total: ৳{order_data['total']:,.0f} ({order_data['payment_method']})\n"
            f"Address: {order_data['address']}\n"
            f"Please write a warm order status update for this customer."
        )
    elif matched_order_query and not order_data:
        gemini_prompt += f"\n[ORDER NOT FOUND for query: {matched_order_query}]. Please politely inform the customer to check the order ID or phone number."

    if matched_products:
        prod_descriptions = []
        for p in matched_products:
            prod_descriptions.append(f"- {p['name']} ({p['category_name']}) — ৳{p['starting_price']:,.0f}")
        gemini_prompt += (
            f"\n[ATTACHED PRODUCTS SHOWN IN UI CARDS BELOW]:\n"
            + "\n".join(prod_descriptions)
            + "\nINSTRUCTION: Specifically present these items. Let the customer know that interactive product cards for each item are attached below with a direct 'কার্টে নিন' (Add to Cart) button!"
        )
    else:
        gemini_prompt += "\n[NO PRODUCTS ATTACHED]: Do not say you attached Add to Cart buttons. Politely ask the customer for their preference."

    # Execute Gemini generation
    gemini_reply = call_gemini_text(gemini_prompt, system_instruction=system_instruction)

    if gemini_reply:
        intent = "order_tracking" if order_data else ("recommendation" if matched_products else "conversation")
        return {
            "success": True,
            "reply": gemini_reply,
            "products": matched_products,
            "order": order_data,
            "intent": intent,
            "engine": f"gemini ({PRIMARY_MODEL})",
        }

    # Backup fallback only if Gemini API is unreachable
    if order_data:
        fallback_reply = (
            f"প্রিয় {order_data['full_name']}, আপনার অর্ডার নং **{order_data['order_number']}**-এর বর্তমান আপডেট:\n\n"
            f"📌 **স্ট্যাটাস:** {order_data['status_title']}\n"
            f"ℹ️ {order_data['status_desc']}\n"
            f"💰 **মোট বিল:** ৳{order_data['total']:,.0f} ({order_data['payment_method']})\n"
            f"📍 **ঠিকানা:** {order_data['address']}"
        )
    elif matched_products:
        fallback_reply = "আপনার চাহিদামতো সেরা পোশাকগুলো নিচে সাজিয়ে দেওয়া হলো। সরাসরি 'কার্টে নিন' বাটনে ক্লিক করে যুক্ত করতে পারেন:"
    else:
        fallback_reply = (
            f"স্বাগতম! {ctx['shop_name']}-এ আমাদের কাছে ছেলে, মেয়ে ও পরিবারের সবার জন্য প্রিমিয়াম পোশাক রয়েছে। "
            f"ডেলিভারি চার্জ: ঢাকায় ৳{ctx['delivery_inside_dhaka']:.0f}, বাইরে ৳{ctx['delivery_outside_dhaka']:.0f}। "
            f"আপনার পছন্দ বা প্রশ্ন লিখে জানান!"
        )

    return {
        "success": True,
        "reply": fallback_reply,
        "products": matched_products,
        "order": order_data,
        "intent": "general",
        "engine": "fallback",
    }


def handle_natural_search(query: str):
    """
    Uses Gemini to parse natural language search queries and filter products.
    """
    query_clean = (query or "").strip()
    if not query_clean:
        return {
            "success": True,
            "query": "",
            "summary": "অনুগ্রহ করে আপনার কাঙ্ক্ষিত পোশাকের নাম বা বিবরণ লিখুন।",
            "products": [],
            "filters": {},
        }

    prompt = (
        f"Analyze this e-commerce search query: \"{query_clean}\"\n"
        f"Extract search parameters as JSON:\n"
        f"{{\n"
        f"  \"keywords\": \"main english/bengali keywords (e.g. panjabi, frock, shirt, matching, red)\",\n"
        f"  \"category\": \"boy, girl, man, woman, or empty\",\n"
        f"  \"min_price\": null or number,\n"
        f"  \"max_price\": null or number,\n"
        f"  \"summary_bn\": \"Friendly 1-line Bengali summary of what is being searched for\"\n"
        f"}}"
    )
    parsed_json = call_gemini_json(prompt)

    if not parsed_json or not parsed_json.get("keywords"):
        lower = query_clean.lower()
        budget_match = re.search(r"(\d{3,5})", lower)
        max_p = float(budget_match.group(1)) if budget_match and ("টাকা" in lower or "tk" in lower or "under" in lower or "বাজেট" in lower) else None

        cat = ""
        if any(w in lower for w in ["ছেলে", "boy", "cele"]):
            cat = "boy"
        elif any(w in lower for w in ["মেয়ে", "girl", "meye"]):
            cat = "girl"
        elif any(w in lower for w in ["বাবা", "man", "baba"]):
            cat = "man"
        elif any(w in lower for w in ["মা", "woman", "ma"]):
            cat = "woman"

        kw = ""
        for word in ["পাঞ্জাবি", "panjabi", "kurta", "ফ্রক", "frock", "shirt", "শার্ট", "কম্বো", "combo", "matching", "cotton", "কটন"]:
            if word in lower:
                kw = word
                break

        parsed_json = {
            "keywords": kw or query_clean,
            "category": cat,
            "min_price": None,
            "max_price": max_p,
            "summary_bn": f"'{query_clean}' এর জন্য ফলাফলসমূহ:",
        }

    keywords = parsed_json.get("keywords", "")
    category_slug = parsed_json.get("category", "")
    min_price = parsed_json.get("min_price")
    max_price = parsed_json.get("max_price")
    summary_bn = parsed_json.get("summary_bn", f"'{query_clean}' সম্পর্কিত পণ্যসমূহ:")

    products = search_matching_products(
        keywords=keywords,
        category_keyword=category_slug,
        min_price=min_price,
        max_price=max_price,
        limit=12,
    )

    if not products:
        products = search_matching_products(keywords=query_clean, limit=8)

    return {
        "success": True,
        "query": query_clean,
        "summary": summary_bn,
        "products": products,
        "filters": {
            "keywords": keywords,
            "category": category_slug,
            "min_price": min_price,
            "max_price": max_price,
        },
        "engine": f"gemini ({PRIMARY_MODEL})",
    }


def generate_ai_product_description(name: str, category_name: str = "", base_price: float = None, notes: str = ""):
    """
    1-Click AI Product Description Generator for Admin.
    Uses Gemini to generate rich Bengali & English e-commerce descriptions.
    """
    name = (name or "").strip()
    if not name:
        return {
            "success": False,
            "error": "Product name is required to generate description.",
        }

    system_instruction = (
        "You are an expert e-commerce copywriter for 'Kids & Family', a premium fashion brand in Bangladesh.\n"
        "Write an enticing, professional, and comprehensive product description in Bengali (with English terms naturally included).\n"
        "Format clearly with attractive emojis and sections:\n"
        "1. Catchy headline and emotional overview.\n"
        "2. Key Features (100% pure combed cotton, skin-friendly azo-free dye, durable stitching).\n"
        "3. Size & Fit Guidance.\n"
        "4. Wash & Care tips.\n"
        "5. Relevant SEO hashtags."
    )

    prompt = (
        f"Generate an e-commerce product description for:\n"
        f"Product Name: {name}\n"
        f"Category: {category_name or 'Fashion & Lifestyle'}\n"
        f"Price: ৳{base_price or 0}\n"
        f"Additional Notes: {notes or 'High quality fabric, festive & casual collection'}"
    )

    generated_text = call_gemini_text(prompt, system_instruction=system_instruction)
    if generated_text:
        return {
            "success": True,
            "description": generated_text,
            "source": f"gemini ({PRIMARY_MODEL})",
        }

    # Backup template
    category_label = category_name or "ফ্যামিলি আউটফিট"
    fallback_desc = (
        f"✨ **{name}** — প্রিমিয়াম কোয়ালিটি ও আধুনিক ডিজাইনের এক নিখুঁত সংমিশ্রণ।\n\n"
        f"বাচ্চা ও পরিবারের সদস্যদের আরাম ও আভিজাত্যের কথা মাথায় রেখে তৈরি করা হয়েছে এই বিশেষ {category_label}।\n\n"
        f"🌟 **মূল বৈশিষ্ট্যসমূহ:**\n"
        f"• ১০০% প্রিমিয়াম সুতি (Pure Combed Cotton) কাপড়\n"
        f"• নিখুঁত ফিনিশিং এবং টেকসই সেলাই\n"
        f"• স্কিন-ফ্রেন্ডলি কালার ও ওয়াশ-উপযোগী\n\n"
        f"🧼 **ওয়াশ ও কেয়ার টিপস:** স্বাভাবিক পানিতে ধুয়ে ছায়ায় শুকান।"
    )

    return {
        "success": True,
        "description": fallback_desc,
        "source": "template_backup",
    }
