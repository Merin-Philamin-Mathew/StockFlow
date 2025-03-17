from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')  
router.register(r'categories',CategoryViewSet, basename='category')  
router.register(r'sub-categories',SubCategoryViewSet, basename='sub_category')  
router.register(r'variants', VariantViewSet, basename='variant')  
router.register(r'variant-options', VariantOptionViewSet)
router.register(r'product-variants', ProductVariantItemViewSet)
router.register(r'product-configurations', ProductConfigurationViewSet)


urlpatterns = [
    path('', include(router.urls)),
]
