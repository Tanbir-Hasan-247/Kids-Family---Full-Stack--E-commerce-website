from django.urls import path
from .views import AIChatAPIView, AISearchAPIView, AIGenerateDescriptionAPIView

app_name = "ai_assistant"

urlpatterns = [
    path("chat/", AIChatAPIView.as_view(), name="ai_chat"),
    path("search/", AISearchAPIView.as_view(), name="ai_search"),
    path("generate-description/", AIGenerateDescriptionAPIView.as_view(), name="ai_generate_description"),
]

