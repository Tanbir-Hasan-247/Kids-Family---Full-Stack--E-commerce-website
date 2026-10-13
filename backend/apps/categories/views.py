from rest_framework import generics, permissions
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
            return Category.objects.all().order_by("name")
        return Category.objects.filter(parent__isnull=True).prefetch_related("children").order_by("id")


class CategoryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a category by slug or pk.
    """
    serializer_class = CategorySerializer
    queryset = Category.objects.all()

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_object(self):
        lookup = self.kwargs.get("slug_or_id")
        if lookup.isdigit():
            return generics.get_object_or_404(Category, pk=int(lookup))
        return generics.get_object_or_404(Category, slug=lookup)

