from rest_framework import serializers
from .models import Product, Variant, VariantOption,Category, SubCategory, ProductVariantItem, ProductConfiguration

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = "__all__"

class ProductSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source="created_by.id")
    class Meta:
        model = Product
        fields = "__all__"
  

class VariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Variant
        fields = "__all__"

class VariantOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantOption
        fields = "__all__"


class ProductConfigurationSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source='variant_option.variant.name', read_only=True)
    option_value = serializers.CharField(source='variant_option.option', read_only=True)
    
    class Meta:
        model = ProductConfiguration
        fields = ['id', 'product_item', 'variant_option', 'variant_name', 'option_value']

class ProductVariantItemSerializer(serializers.ModelSerializer):
    configurations = ProductConfigurationSerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    subcategory = serializers.CharField(source='product.subcategory', read_only=True)
    
    class Meta:
        model = ProductVariantItem
        fields = ['id', 'product','product_name', 'product_code', 'image', 'quantity', 'price', 
                  'hsn_code','subcategory', 'configurations']
                  
class ProductVariantItemCreateUpdateSerializer(serializers.ModelSerializer):
    variant_options = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = ProductVariantItem
        fields = ['id', 'product', 'product_code', 'image', 'quantity', 'price', 
                  'hsn_code', 'variant_options']
        extra_kwargs = {
            'product_code': {'required': False},
            'hsn_code': {'required': False},
        }
    
    def create(self, validated_data):
        variant_options = validated_data.pop('variant_options')
        
        # Generate product_code if not provided
        if 'product_code' not in validated_data or not validated_data['product_code']:
            product = validated_data['product']
            # Get variant options details for code generation
            variant_option_objects = []
            for option_id in variant_options:
                try:
                    option = VariantOption.objects.get(id=option_id)
                    variant_option_objects.append(option)
                except VariantOption.DoesNotExist:
                    pass
            
            # Create a code combining product ID and variant options
            option_codes = "-".join([opt.option[:3].upper() for opt in variant_option_objects])
            validated_data['product_code'] = f"{product.product_id}-{option_codes}"
        
        # Copy hsn_code from product if not provided
        if 'hsn_code' not in validated_data or not validated_data['hsn_code']:
            # If the product has an hsn_code field, copy it
            product = validated_data['product']
            if hasattr(product, 'hsn_code') and product.hsn_code:
                validated_data['hsn_code'] = product.hsn_code
        
        product_item = ProductVariantItem.objects.create(**validated_data)
        
        # Create configurations
        for option_id in variant_options:
            try:
                variant_option = VariantOption.objects.get(id=option_id)
                ProductConfiguration.objects.create(
                    product_item=product_item,
                    variant_option=variant_option
                )
            except VariantOption.DoesNotExist:
                pass
                
        return product_item
    
    def update(self, instance, validated_data):
        # Update fields
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.price = validated_data.get('price', instance.price)
        
        # Only update product_code if explicitly provided
        if 'product_code' in validated_data and validated_data['product_code']:
            instance.product_code = validated_data.get('product_code')
            
        # Only update hsn_code if explicitly provided
        if 'hsn_code' in validated_data and validated_data['hsn_code']:
            instance.hsn_code = validated_data.get('hsn_code')
        
        # Handle image separately to avoid overwriting with None
        if 'image' in validated_data:
            instance.image = validated_data.get('image')
            
        instance.save()
        
        # Handle variant options if provided
        if 'variant_options' in validated_data:
            variant_options = validated_data.pop('variant_options')
            
            # If product_code was not explicitly provided but variant options changed,
            # we may want to regenerate the product_code
            if 'product_code' not in validated_data:
                variant_option_objects = []
                for option_id in variant_options:
                    try:
                        option = VariantOption.objects.get(id=option_id)
                        variant_option_objects.append(option)
                    except VariantOption.DoesNotExist:
                        pass
                
                # Create a code combining product ID and variant options
                option_codes = "-".join([opt.option[:3].upper() for opt in variant_option_objects])
                instance.product_code = f"{instance.product.product_id}-{option_codes}"
                instance.save()
            
            # Update configurations
            instance.configurations.all().delete()
            for option_id in variant_options:
                try:
                    variant_option = VariantOption.objects.get(id=option_id)
                    ProductConfiguration.objects.create(
                        product_item=instance,
                        variant_option=variant_option
                    )
                except VariantOption.DoesNotExist:
                    pass
                    
        return instance