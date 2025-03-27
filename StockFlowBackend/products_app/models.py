import uuid
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_save
from django.dispatch import receiver
import random

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, db_index=True)  # Indexed for faster lookups

    class Meta:
        db_table = "categories"

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
    name = models.CharField(max_length=255, db_index=True)  # Indexed for searches

    class Meta:
        db_table = "subcategories"
        unique_together = (("category", "name"),)  # Avoid duplicate names under the same category

    def __str__(self):
        return f"{self.category.name} - {self.name}"



class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.BigIntegerField(unique=True, db_index=True, blank=True, null=True)  # Auto-generated now
    name = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_favourite = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    total_stock = models.PositiveIntegerField(default=0, blank=True, null=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE, related_name="products")
    hsn_code = models.CharField(max_length=255, blank=True, null=True)  # Add HSN code field to Product model

    class Meta:
        db_table = "products"
        ordering = ("-created_at", "product_id")

    def __str__(self):
        return self.name


# Signal to generate product_id before saving a new Product
@receiver(pre_save, sender=Product)
def generate_product_id(sender, instance, **kwargs):
    # Only generate if product_id is not set
    if not instance.product_id:
        # Generate a unique 8-digit ID
        while True:
            product_id = random.randint(10000000, 99999999)
            if not Product.objects.filter(product_id=product_id).exists():
                instance.product_id = product_id
                break


class Variant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=255, db_index=True)  # Example: "Size", "Color"

    class Meta:
        db_table = "variants"
        unique_together = (("subcategory", "name"),)  # Avoid duplicate variants for the same subcategory

    def __str__(self):
        return f"{self.subcategory.name} - {self.name}"


class VariantOption(models.Model):  # Changed name from VariantOptions to VariantOption
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name="options")
    option = models.CharField(max_length=255, db_index=True)  # Example: "Red", "Large"

    class Meta:
        db_table = "variant_options"
        unique_together = (("variant", "option"),)  # Avoid duplicate sub-variants under the same variant

    def __str__(self):
        return f"{self.variant.name}: {self.option}"


class ProductVariantItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="items")
    product_code = models.CharField(max_length=255, unique=True, db_index=True)  # Unique SKU for each variant
    image = models.ImageField(upload_to="uploads/", blank=True, null=True)  # Variant-specific image
    quantity = models.PositiveIntegerField(default=0)  # Stock level for this variant
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Variant price
    hsn_code = models.CharField(max_length=255, blank=True, null=True)  # Tax code specific to this variant

    class Meta:
        db_table = "product_variant_items"

    def __str__(self):
        return f"{self.product.name} - {self.product_code} | Stock: {self.quantity} | Price: {self.price}"

class ProductConfiguration(models.Model):  # Changed name from Product_Configuration
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_item = models.ForeignKey(ProductVariantItem, on_delete=models.CASCADE, related_name="configurations")
    variant_option = models.ForeignKey(VariantOption, on_delete=models.CASCADE, related_name="configurations")

    class Meta:
        db_table = "product_configurations"
        unique_together = (("product_item", "variant_option"),)  # Prevent duplicate mappings

    def __str__(self):
        return f"{self.product_item.product.name} - {self.variant_option.variant.name}: {self.variant_option.option}"

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class StockTransaction(models.Model):
    """
    Model to track stock transactions (additions and removals)
    """
    TRANSACTION_TYPES = (
        ('add', 'Stock Addition'),
        ('remove', 'Stock Removal'),
        ('adjustment', 'Stock Adjustment')
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_variant = models.ForeignKey('ProductVariantItem', on_delete=models.CASCADE, related_name='stock_transactions')
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Optional reference to source document (like purchase order or sales invoice)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'stock_transactions'
        ordering = ['-timestamp']
        verbose_name_plural = 'Stock Transactions'

    def __str__(self):
        return f"{self.product_variant} - {self.transaction_type} - {self.quantity} units"

    def save(self, *args, **kwargs):
        # Update product variant stock when transaction is saved
        if self.transaction_type == 'add':
            self.product_variant.quantity += self.quantity
        elif self.transaction_type == 'remove':
            self.product_variant.quantity -= self.quantity
        
        self.product_variant.save()
        super().save(*args, **kwargs)

class LowStockAlert(models.Model):
    """
    Model to track and manage low stock alerts
    """
    product_variant = models.OneToOneField('ProductVariantItem', on_delete=models.CASCADE)
    threshold = models.IntegerField(default=10)
    is_active = models.BooleanField(default=True)
    last_notified = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'low_stock_alerts'

    def __str__(self):
        return f"Low Stock Alert for {self.product_variant}"

    def check_stock_level(self):
        """
        Check if current stock is below threshold
        """
        return self.product_variant.quantity <= self.threshold

