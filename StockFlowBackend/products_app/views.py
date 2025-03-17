from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,IsAuthenticated
from .models import Product, Variant, VariantOption, Category, SubCategory, ProductVariantItem, ProductConfiguration

from .serializers import (ProductSerializer, VariantSerializer, VariantOptionSerializer, CategorySerializer, SubCategorySerializer,
ProductVariantItemSerializer,
    ProductVariantItemCreateUpdateSerializer,
    ProductConfigurationSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API for managing products (CRUD).
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class SubCategoryViewSet(viewsets.ModelViewSet):
    """
    API for managing products (CRUD).
    """
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    """
    API for managing products (CRUD).
    """
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class VariantViewSet(viewsets.ModelViewSet):
    """
    API for managing variants (CRUD).
    """
    queryset = Variant.objects.all()
    serializer_class = VariantSerializer
    permission_classes = [IsAuthenticated]

class VariantOptionViewSet(viewsets.ModelViewSet):
    """
    API for managing sub-variants (CRUD).
    """
    queryset = VariantOption.objects.all()
    serializer_class = VariantOptionSerializer
    permission_classes = [IsAuthenticated]


class ProductVariantItemViewSet(viewsets.ModelViewSet):
    """
    API for managing product variant items (CRUD).
    """
    queryset = ProductVariantItem.objects.all()
    serializer_class = ProductVariantItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductVariantItemCreateUpdateSerializer
        return ProductVariantItemSerializer
    
    def perform_update(self, serializer):
        """Update the product's total stock after updating a variant item."""
        instance = serializer.save()
        self._update_product_total_stock(instance.product)
    
    def perform_destroy(self, instance):
        """Update the product's total stock after deleting a variant item."""
        product = instance.product
        instance.delete()
        self._update_product_total_stock(product)
    
    def _update_product_total_stock(self, product):
        """Helper method to update a product's total stock."""
        total_stock = ProductVariantItem.objects.filter(
            product=product
        ).aggregate(models.Sum('quantity'))['quantity__sum'] or 0
        product.total_stock = total_stock
        product.save()
        
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Create multiple product variant items in a single request.
        """
        items_data = request.data.get('items', [])
        created_items = []
        product_id = None
        
        for item_data in items_data:
            serializer = ProductVariantItemCreateUpdateSerializer(data=item_data)
            if serializer.is_valid():
                item = serializer.save()
                created_items.append(ProductVariantItemSerializer(item).data)
                product_id = item.product.id
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update total stock for the product
        if product_id:
            product = Product.objects.get(id=product_id)
            self._update_product_total_stock(product)
            
        return Response(created_items, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='add-to-product/(?P<product_id>[^/.]+)')
    def add_to_product(self, request, product_id=None):
        """
        Add variant items to an existing product.
        """
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        items_data = request.data.get('items', [])
        created_items = []
        
        for item_data in items_data:
            # Ensure the product ID is set correctly
            item_data['product'] = product_id
            
            # No need to manually generate product_code here - 
            # the serializer will handle it if not provided
            
            serializer = ProductVariantItemCreateUpdateSerializer(data=item_data)
            if serializer.is_valid():
                item = serializer.save()
                created_items.append(ProductVariantItemSerializer(item).data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update total stock for the product
        self._update_product_total_stock(product)
            
        return Response(created_items, status=status.HTTP_201_CREATED)


class ProductConfigurationViewSet(viewsets.ModelViewSet):
    """
    API for managing product configurations (CRUD).
    """
    queryset = ProductConfiguration.objects.all()
    serializer_class = ProductConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='by-variant-item/(?P<item_id>[^/.]+)')
    def by_variant_item(self, request, item_id=None):
        """
        Get all configurations for a specific product variant item.
        """
        try:
            item = ProductVariantItem.objects.get(id=item_id)
        except ProductVariantItem.DoesNotExist:
            return Response(
                {"error": "Product variant item not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        configurations = ProductConfiguration.objects.filter(product_item=item)
        serializer = ProductConfigurationSerializer(configurations, many=True)
        return Response(serializer.data)