from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import PromoBanner, HeroSlider
from .serializers import PromoBannerSerializer, HeroSliderSerializer


# ==========================================
# PROMO BANNERS (Original Model)
# ==========================================

class LiveBannersListAPIView(generics.ListAPIView):
    """
    Returns banners that are currently live (active and within date schedule).
    """
    serializer_class = PromoBannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PromoBanner.get_live_banners().order_by("order", "-created_at")


class AdminBannerListCreateAPIView(generics.ListCreateAPIView):
    """
    List all banners (including inactive) or create new banner (Admin only).
    """
    queryset = PromoBanner.objects.all().order_by("order", "-created_at")
    serializer_class = PromoBannerSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class AdminBannerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a banner (Admin only for write operations).
    """
    queryset = PromoBanner.objects.all()
    serializer_class = PromoBannerSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class AdminBannerToggleActiveAPIView(APIView):
    """
    Toggle is_active on/off for a banner (Admin only).
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        banner = get_object_or_404(PromoBanner, pk=pk)
        banner.is_active = not banner.is_active
        banner.save()
        return Response({
            "id": banner.id,
            "is_active": banner.is_active,
            "message": f"Banner active status set to {banner.is_active}.",
        })


# ==========================================
# HERO SLIDERS (GhorerBazar-Style Responsive Carousel)
# ==========================================

class HeroSliderListAPIView(generics.ListAPIView):
    """
    Returns active responsive hero carousel sliders for homepage.
    Sorted by display order.
    """
    serializer_class = HeroSliderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return HeroSlider.objects.filter(is_active=True).order_by("order", "-created_at")


class AdminHeroSliderListCreateAPIView(generics.ListCreateAPIView):
    """
    List all hero sliders or create a new slide (Admin only for write).
    """
    queryset = HeroSlider.objects.all().order_by("order", "-created_at")
    serializer_class = HeroSliderSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class AdminHeroSliderDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a hero slider.
    """
    queryset = HeroSlider.objects.all()
    serializer_class = HeroSliderSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class AdminHeroSliderToggleAPIView(APIView):
    """
    Toggle is_active on/off for a hero slider (Admin only).
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        slider = get_object_or_404(HeroSlider, pk=pk)
        slider.is_active = not slider.is_active
        slider.save()
        return Response({
            "id": slider.id,
            "is_active": slider.is_active,
            "message": f"Slide active status set to {slider.is_active}.",
        })
