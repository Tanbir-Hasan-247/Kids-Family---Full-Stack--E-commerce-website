from django.urls import path
from .views import CategoryListCreateAPIView, CategoryDetailAPIView

app_name = "categories"

urlpatterns = [
    path("", CategoryListCreateAPIView.as_view(), name="category_list_create"),
    path("<str:slug_or_id>/", CategoryDetailAPIView.as_view(), name="category_detail"),
]

