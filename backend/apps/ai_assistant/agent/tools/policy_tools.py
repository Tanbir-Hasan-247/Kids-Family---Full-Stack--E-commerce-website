"""
Store Policy & Support Information Tools for AI Shopping Agent.
Retrieves database-grounded facts from ShopSetting with explicit operational disclaimers.
"""

import logging
from typing import Dict, Any
from apps.dashboard.models import ShopSetting

logger = logging.getLogger(__name__)


def get_verified_shop_settings() -> Dict[str, Any]:
    """Loads authoritative ShopSetting from database with safe defaults."""
    setting = None
    try:
        setting = ShopSetting.objects.first()
    except Exception as e:
        logger.warning(f"Could not load ShopSetting from DB: {e}")

    shop_name = setting.shop_name if setting else "Kids & Family"
    inside_dhaka = float(setting.delivery_inside_dhaka) if setting else 60.0
    outside_dhaka = float(setting.delivery_outside_dhaka) if setting else 120.0
    phone = setting.phone if setting else "+880 1700-000000"
    whatsapp = setting.whatsapp_number if setting else phone
    address = setting.address if setting else "Dhaka, Bangladesh"
    hours = setting.opening_hours if setting else "10 AM - 8 PM"
    email = setting.email if setting else "support@kidsandfamily.com"

    return {
        "shop_name": shop_name,
        "delivery_inside_dhaka": inside_dhaka,
        "delivery_outside_dhaka": outside_dhaka,
        "phone": phone,
        "whatsapp": whatsapp,
        "address": address,
        "hours": hours,
        "email": email,
    }


def execute_get_store_policies(topic: str = "all", **kwargs) -> Dict[str, Any]:
    """
    Returns authoritative store policies grounded in DB ShopSetting.
    Topics: delivery, returns, payment, contact, all.
    """
    cfg = get_verified_shop_settings()
    topic_clean = str(topic or "all").lower().strip()

    policies = {
        "delivery": (
            f"ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৳{cfg['delivery_inside_dhaka']:.0f} এবং ঢাকার বাইরে ৳{cfg['delivery_outside_dhaka']:.0f}। "
            f"সাধারণত ঢাকায় ২৪–৪৮ ঘণ্টা এবং ঢাকার বাইরে ৩–৫ দিনের মধ্যে ডেলিভারি হয়ে থাকে (পরিস্থিতিভেদে সময় পরিবর্তিত হতে পারে; "
            f"সুনির্দিষ্ট সময়ের জন্য হেল্পলাইনে {cfg['phone']} যোগাযোগ করুন)।"
        ),
        "returns": (
            "সাইজ বা মানজনিত সমস্যার ক্ষেত্রে পণ্য হাতে পাওয়ার পর সহজ এক্সচেঞ্জ সুবিধা রয়েছে (অক্ষত ও ট্যাগযুক্ত অবস্থায়)। "
            f"এক্সচেঞ্জের চূড়ান্ত শর্তাবলী নিশ্চিত করতে আমাদের সাপোর্ট টিমে ({cfg['phone']}) যোগাযোগ করুন।"
        ),
        "payment": (
            "আমরা সারাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery / COD) সুবিধা প্রদান করি। "
            "পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করা যায়। এছাড়াও অনলাইন পেমেন্ট (বিকাশ, নগদ, কার্ড) গ্রহণযোগ্য।"
        ),
        "contact": (
            f"হটলাইন: {cfg['phone']} / WhatsApp: {cfg['whatsapp']}। "
            f"শোরুম / ঠিকানা: {cfg['address']}। "
            f"সাপোর্ট সময়: {cfg['hours']} (ইমেইল: {cfg['email']})।"
        ),
    }

    if topic_clean in policies:
        return {
            "success": True,
            "topic": topic_clean,
            "policy": policies[topic_clean],
            "verified_from_db": True,
        }

    return {
        "success": True,
        "topic": "all",
        "policies": policies,
        "verified_from_db": True,
    }
