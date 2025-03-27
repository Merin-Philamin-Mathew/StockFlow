from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')  
router.register(r'categories',CategoryViewSet, basename='category')  
router.register(r'sub-categories',SubCategoryViewSet, basename='sub_category')  
router.register(r'variants', VariantViewSet, basename='variant')  
router.register(r'variant-options', VariantOptionViewSet, basename='variant-options')
router.register(r'product-variants', ProductVariantItemViewSet)
router.register(r'product-configurations', ProductConfigurationViewSet)
router.register(r'stock', StockManagementViewSet,basename='stocktransaction')
router.register(r'low-stock-alerts', LowStockAlertViewSet, basename='low-stock-alert')

urlpatterns = [
    path('', include(router.urls)),
    path('product-variants/<str:pk>/adjust-stock/', 
         ProductVariantItemViewSet.as_view({'put': 'adjust_stock'}), 
         name='product-variant-adjust-stock'),

]
