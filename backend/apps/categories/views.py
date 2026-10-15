from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import ProtectedError
from .models import Category
from .serializers import CategorySerializer


class CategoryListCreateAPIView(generics.ListCreateAPIView):
    """
    List categories or create a new category (Admin only for POST).
    By default, returns root categories with their nested children.
    Pass ?all=true to return flat list of all categories.
    """
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        show_all = self.request.query_params.get("all", "false").lower() == "true"
        if show_all:
            return Category.objects.all().select_related("parent").prefetch_related("children").order_by("name")
        return (
            Category.objects.filter(parent__isnull=True)
            .select_related("parent")
            .prefetch_related("children__parent")
            .order_by("id")
        )


class CategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a category by slug or pk.
    """
    serializer_class = CategorySerializer
    queryset = Category.objects.all().select_related("parent").prefetch_related("children")

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_object(self):
        lookup = self.kwargs.get("slug_or_id")
        if lookup.isdigit():
            return generics.get_object_or_404(Category, pk=int(lookup))
        return generics.get_object_or_404(Category, slug=lookup)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response(
                {"success": True, "message": "Category deleted successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "detail": "এই ক্যাটাগরিতে পণ্য যুক্ত থাকায় এটি মুছে ফেলা সম্ভব নয়। অনুগ্রহ করে আগে পণ্যগুলো অন্য ক্যাটাগরিতে স্থানান্তর করুন বা মুছে ফেলুন।",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

