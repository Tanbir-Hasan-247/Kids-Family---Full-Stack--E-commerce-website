import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.categories.models import Category
from .services import (
    handle_chat_turn,
    handle_natural_search,
    generate_ai_product_description,
)

logger = logging.getLogger(__name__)


class AIChatAPIView(APIView):
    """
    POST /api/ai/chat/
    Intelligent shopping chatbot handling FAQs, product recommendations,
    and live order status queries.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="AI Shopping Assistant Chat Endpoint",
        description="Receives user message and returns conversational Bengali response, matched products, and order tracking info.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "history": {"type": "array", "items": {"type": "object"}},
                    "session_key": {"type": "string"},
                },
                "required": ["message"],
            }
        },
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        message = request.data.get("message", "").strip()
        history = request.data.get("history", [])
        session_key = (
            request.data.get("session_key")
            or request.headers.get("X-Session-Key")
            or (request.session.session_key if hasattr(request, "session") else None)
        )

        try:
            result = handle_chat_turn(
                message=message,
                history=history,
                session_key=session_key,
                user=request.user if request.user.is_authenticated else None,
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"Error in AIChatAPIView: {e}")
            return Response(
                {
                    "success": False,
                    "reply": "দুঃখিত, এই মুহূর্তে সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা হেল্পলাইনে কল করুন।",
                    "products": [],
                    "order": None,
                    "error": str(e),
                },
                status=status.HTTP_200_OK,
            )


class AISearchAPIView(APIView):
    """
    GET /api/ai/search/?q=...
    POST /api/ai/search/
    Parses conversational natural-language queries into structured filters
    and returns relevant matching products.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="AI Natural Language Product Search",
        description="Performs semantic parsing of everyday user queries (e.g. '৫ বছরের বাচ্চার লাল জামা ১৫০০ টাকার মধ্যে').",
        parameters=[
            OpenApiParameter(
                name="q",
                type=str,
                location=OpenApiParameter.QUERY,
                description="Natural language query string",
            )
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        result = handle_natural_search(query)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request):
        query = request.data.get("query") or request.data.get("q", "")
        result = handle_natural_search(str(query).strip())
        return Response(result, status=status.HTTP_200_OK)


class AIGenerateDescriptionAPIView(APIView):
    """
    POST /api/ai/generate-description/
    1-Click AI Product Description Generator for Admin panel.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="1-Click AI Product Description Generator",
        description="Generates rich Bengali & English e-commerce descriptions with fabric specs, wash care, and SEO keywords.",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "category": {"type": "string"},
                    "base_price": {"type": "number"},
                    "notes": {"type": "string"},
                },
                "required": ["name"],
            }
        },
        responses={200: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        name = request.data.get("name", "").strip()
        category_raw = request.data.get("category", "")
        base_price = request.data.get("base_price", None)
        notes = request.data.get("notes", "")

        if not name:
            return Response(
                {"success": False, "error": "প্রোডাক্টের নাম (Product Name) প্রদান করা আবশ্যক।"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve category name if ID passed
        category_name = ""
        if category_raw:
            if isinstance(category_raw, int) or (isinstance(category_raw, str) and category_raw.isdigit()):
                cat_obj = Category.objects.filter(id=int(category_raw)).first()
                if cat_obj:
                    category_name = cat_obj.name
            else:
                category_name = str(category_raw)

        result = generate_ai_product_description(
            name=name,
            category_name=category_name,
            base_price=base_price,
            notes=notes,
        )
        return Response(result, status=status.HTTP_200_OK)

