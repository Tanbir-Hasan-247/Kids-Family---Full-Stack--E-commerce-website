from django.urls import path
from .views import (
    LiveBannersListAPIView,
    AdminBannerListCreateAPIView,
    AdminBannerDetailAPIView,
    AdminBannerToggleActiveAPIView,
    HeroSliderListAPIView,
    AdminHeroSliderListCreateAPIView,
    AdminHeroSliderDetailAPIView,
    AdminHeroSliderToggleAPIView,
)

app_name = "promotions"

urlpatterns = [
    # Banners (Promo)
    path("banners/live/", LiveBannersListAPIView.as_view(), name="live_banners"),
    path("banners/", AdminBannerListCreateAPIView.as_view(), name="banner_list_create"),
    path("banners/<int:pk>/", AdminBannerDetailAPIView.as_view(), name="banner_detail"),
    path("banners/<int:pk>/toggle/", AdminBannerToggleActiveAPIView.as_view(), name="banner_toggle"),

    # Hero Sliders (GhorerBazar-Style Responsive Carousel)
    path("sliders/", HeroSliderListAPIView.as_view(), name="hero_sliders_active"),
    path("sliders/all/", AdminHeroSliderListCreateAPIView.as_view(), name="admin_sliders_list_create"),
    path("sliders/<int:pk>/", AdminHeroSliderDetailAPIView.as_view(), name="admin_slider_detail"),
    path("sliders/<int:pk>/toggle/", AdminHeroSliderToggleAPIView.as_view(), name="admin_slider_toggle"),
]
