from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,IsAuthenticated
from .models import *
from django.db import transaction
from django.db.models import Sum, F
from .serializers import *

class CategoryViewSet(viewsets.ModelViewSet):
    """
    API for managing products (CRUD).
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class SubCategoryViewSet(viewsets.ModelViewSet):
    """
    API for managing products (CRUD).
    """
    serializer_class = SubCategorySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = SubCategory.objects.all()
        category_id = self.request.query_params.get("category")  # Get category ID from query params
        if category_id:
            queryset = queryset.filter(category_id=category_id)  # Filter by category ID
        return queryset
    
class VariantViewSet(viewsets.ModelViewSet):
    """
    API for managing variants (CRUD).
    """
    serializer_class = VariantSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = Variant.objects.all()
        subcategory_id = self.request.query_params.get("subcategory")  # Get category ID from query params
        if subcategory_id:
            queryset = queryset.filter(subcategory_id=subcategory_id)  # Filter by category ID
        return queryset

class VariantOptionViewSet(viewsets.ModelViewSet):
    """
    API for managing sub-variants (CRUD).
    """
    serializer_class = VariantOptionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = VariantOption.objects.all()
        variant_id = self.request.query_params.get("variant")  # Get category ID from query params
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)  # Filter by category ID
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # product_id is auto-generated by signal
        serializer.save(created_by=self.request.user)

class ProductVariantItemViewSet(viewsets.ModelViewSet):
    queryset = ProductVariantItem.objects.all()
    serializer_class = ProductVariantItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductVariantItemCreateUpdateSerializer
        return ProductVariantItemSerializer
    
    def perform_update(self, serializer):
        instance = serializer.save()
        self._update_product_total_stock(instance.product)
    
    def perform_destroy(self, instance):
        product = instance.product
        instance.delete()
        self._update_product_total_stock(product)
    
    def _update_product_total_stock(self, product):
        total_stock = ProductVariantItem.objects.filter(
            product=product
        ).aggregate(models.Sum('quantity'))['quantity__sum'] or 0
        product.total_stock = total_stock
        product.save()
        
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
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
            
            # If hsn_code is not provided, it will be auto-populated from product
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
    
    @action(detail=False, methods=['get'], url_path='by-product/(?P<product_id>[^/.]+)')
    def by_product(self, request, product_id=None):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        variants = ProductVariantItem.objects.filter(product=product)
        serializer = ProductVariantItemSerializer(variants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        try:
            variant_item = self.get_object()
            quantity_change = request.data.get('quantity_change')

            if quantity_change is None:
                return Response(
                    {"error": "quantity_change is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the stock
            variant_item.quantity += int(quantity_change)
            variant_item.save()
            
            # Update total product stock
            product = variant_item.product
            total_stock = ProductVariantItem.objects.filter(product=product).aggregate(
                models.Sum('quantity')
            )['quantity__sum'] or 0
            product.total_stock = total_stock
            product.save()
            
            return Response({
                'id': variant_item.id,
                'new_quantity': variant_item.quantity,
                'total_product_stock': total_stock
            }, status=status.HTTP_200_OK)
        
        except ProductVariantItem.DoesNotExist:
            return Response(
                {"error": "Product variant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProductConfigurationViewSet(viewsets.ModelViewSet):
    queryset = ProductConfiguration.objects.all()
    serializer_class = ProductConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='by-variant-item/(?P<item_id>[^/.]+)')
    def by_variant_item(self, request, item_id=None):
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
    

class StockManagementViewSet(viewsets.ModelViewSet):
    """
    Comprehensive Stock Management ViewSet
    """
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['POST'], url_path='add-stock')
    def add_stock(self, request):
        """
        Add stock for a specific product variant
        """
        try:
            product_variant_id = request.data.get('product_variant_id')
            quantity = request.data.get('quantity')
            notes = request.data.get('notes', '')
            reference_number = request.data.get('reference_number', '')

            if not product_variant_id or not quantity:
                return Response(
                    {"error": "Product variant ID and quantity are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                product_variant = ProductVariantItem.objects.get(id=product_variant_id)
                
                # Create stock transaction
                stock_transaction = StockTransaction.objects.create(
                    product_variant=product_variant,
                    quantity=quantity,
                    transaction_type='add',
                    user=request.user,
                    notes=notes,
                    reference_number=reference_number
                )

                # Update product total stock
                product = product_variant.product
                product.total_stock = ProductVariantItem.objects.filter(
                    product=product
                ).aggregate(total=Sum('quantity'))['total'] or 0
                product.save()

                # Check low stock alert
                try:
                    low_stock_alert = LowStockAlert.objects.get(product_variant=product_variant)
                    if low_stock_alert.is_active and low_stock_alert.check_stock_level():
                        # Implement notification logic here (e.g., email, SMS)
                        low_stock_alert.last_notified = timezone.now()
                        low_stock_alert.save()
                except LowStockAlert.DoesNotExist:
                    pass

                serializer = self.get_serializer(stock_transaction)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ProductVariantItem.DoesNotExist:
            return Response(
                {"error": "Product variant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'], url_path='remove-stock')
    def remove_stock(self, request):
        """
        Remove stock for a specific product variant
        """
        try:
            product_variant_id = request.data.get('product_variant_id')
            quantity = request.data.get('quantity')
            notes = request.data.get('notes', '')
            reference_number = request.data.get('reference_number', '')

            if not product_variant_id or not quantity:
                return Response(
                    {"error": "Product variant ID and quantity are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                product_variant = ProductVariantItem.objects.get(id=product_variant_id)
                
                # Check if sufficient stock is available
                if product_variant.quantity < quantity:
                    return Response(
                        {"error": "Insufficient stock"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create stock transaction
                stock_transaction = StockTransaction.objects.create(
                    product_variant=product_variant,
                    quantity=quantity,
                    transaction_type='remove',
                    user=request.user,
                    notes=notes,
                    reference_number=reference_number
                )

                # Update product total stock
                product = product_variant.product
                product.total_stock = ProductVariantItem.objects.filter(
                    product=product
                ).aggregate(total=Sum('quantity'))['total'] or 0
                product.save()

                serializer = self.get_serializer(stock_transaction)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ProductVariantItem.DoesNotExist:
            return Response(
                {"error": "Product variant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['GET'], url_path='stock-history/(?P<product_variant_id>[^/.]+)')
    def stock_history(self, request, product_variant_id=None):
        """
        Retrieve stock transaction history for a specific product variant
        """
        try:
            product_variant = ProductVariantItem.objects.get(id=product_variant_id)
            
            # Get stock transactions with optional filtering
            transactions = StockTransaction.objects.filter(product_variant=product_variant)
            
            # Optional date range filtering
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if start_date:
                transactions = transactions.filter(timestamp__gte=start_date)
            if end_date:
                transactions = transactions.filter(timestamp__lte=end_date)
            
            # Optional transaction type filtering
            transaction_type = request.query_params.get('transaction_type')
            if transaction_type:
                transactions = transactions.filter(transaction_type=transaction_type)
            
            # Pagination
            page = self.paginate_queryset(transactions)
            if page is not None:
                serializer = StockTransactionSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = StockTransactionSerializer(transactions, many=True)
            return Response(serializer.data)

        except ProductVariantItem.DoesNotExist:
            return Response(
                {"error": "Product variant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LowStockAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing low stock alerts
    """
    queryset = LowStockAlert.objects.all()
    serializer_class = LowStockAlertSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['GET'], url_path='current-alerts')
    def current_low_stock_alerts(self, request):
        """
        Retrieve current low stock alerts
        """
        low_stock_alerts = LowStockAlert.objects.filter(
            is_active=True, 
            product_variant__quantity__lte=F('threshold')
        )
        print('====',low_stock_alerts)
        serializer = self.get_serializer(low_stock_alerts, many=True)
        return Response(serializer.data)


