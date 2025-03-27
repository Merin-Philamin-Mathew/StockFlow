from rest_framework import serializers
from .models import *
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
        extra_kwargs = {
            'hsn_code': {'required': False}, }
  

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
    
    def validate(self, data):
        """
        Validate that no duplicate product configurations exist for the same product.
        """
        product = data['product']
        variant_options = data['variant_options']
        
        # Sort variant options to ensure consistent comparison
        sorted_variant_options = sorted(variant_options)
        
        # Get all existing product variants for this product
        existing_variants = ProductVariantItem.objects.filter(product=product)
        
        for existing_variant in existing_variants:
            # Get configurations for this variant
            existing_configs = ProductConfiguration.objects.filter(product_item=existing_variant)
            existing_option_ids = sorted([str(config.variant_option.id) for config in existing_configs])
            
            # Check if the configuration is the same (same set of variant options)
            if existing_option_ids == sorted_variant_options:
                variant_options_info = []
                for option_id in variant_options:
                    try:
                        option = VariantOption.objects.get(id=option_id)
                        variant_options_info.append(f"{option.variant.name}: {option.option}")
                    except VariantOption.DoesNotExist:
                        continue
                
                option_details = ", ".join(variant_options_info)
                raise serializers.ValidationError(
                    f"A product variant with the same configuration already exists. "
                    f"Configuration: {option_details}"
                )
        
        return data
    
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
        # Check for duplicates if variant_options are being updated
        if 'variant_options' in validated_data:
            variant_options = validated_data['variant_options']
            product = instance.product
            
            # Sort variant options to ensure consistent comparison
            sorted_variant_options = sorted(variant_options)
            
            # Get all existing product variants for this product except the current instance
            existing_variants = ProductVariantItem.objects.filter(product=product).exclude(id=instance.id)
            
            for existing_variant in existing_variants:
                # Get configurations for this variant
                existing_configs = ProductConfiguration.objects.filter(product_item=existing_variant)
                existing_option_ids = sorted([str(config.variant_option.id) for config in existing_configs])
                
                # Check if the configuration is the same (same set of variant options)
                if existing_option_ids == sorted_variant_options:
                    variant_options_info = []
                    for option_id in variant_options:
                        try:
                            option = VariantOption.objects.get(id=option_id)
                            variant_options_info.append(f"{option.variant.name}: {option.option}")
                        except VariantOption.DoesNotExist:
                            continue
                    
                    option_details = ", ".join(variant_options_info)
                    raise serializers.ValidationError(
                        f"A product variant with the same configuration already exists. "
                        f"Configuration: {option_details}"
                    )
        
        # Existing update logic
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


class StockTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for Stock Transactions
    """
    product_variant_details = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StockTransaction
        fields = [
            'id', 
            'product_variant', 
            'product_variant_details',
            'quantity', 
            'transaction_type', 
            'timestamp', 
            'user', 
            'user_username',
            'notes', 
            'reference_number'
        ]
        read_only_fields = ['timestamp']

    def get_product_variant_details(self, obj):
        """
        Get detailed information about the product variant
        """
        variant = obj.product_variant
        return {
            'product_name': variant.product.name,
            'product_code': variant.product_code,
            'configurations': [
                {
                    'variant_name': config.variant_option.variant.name,
                    'option_value': config.variant_option.option
                } for config in variant.configurations.all()
            ]
        }

class LowStockAlertSerializer(serializers.ModelSerializer):
    """
    Serializer for Low Stock Alerts
    """
    product_variant_details = serializers.SerializerMethodField()
    current_stock = serializers.SerializerMethodField()

    class Meta:
        model = LowStockAlert
        fields = [
            'id', 
            'product_variant', 
            'product_variant_details',
            'threshold', 
            'is_active', 
            'last_notified',
            'current_stock'
        ]

    def get_product_variant_details(self, obj):
        """
        Get detailed information about the product variant
        """
        variant = obj.product_variant
        return {
            'product_name': variant.product.name,
            'product_code': variant.product_code,
            'configurations': [
                {
                    'variant_name': config.variant_option.variant.name,
                    'option_value': config.variant_option.option
                } for config in variant.configurations.all()
            ]
        }

    def get_current_stock(self, obj):
        """
        Get current stock of the product variant
        """
        return obj.product_variant.quantity



