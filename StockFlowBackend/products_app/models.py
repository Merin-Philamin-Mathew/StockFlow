import uuid
from django.db import models
from django.contrib.auth.models import User

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
    product_id = models.BigIntegerField(unique=True, db_index=True)  # Base product identifier
    name = models.CharField(max_length=255, db_index=True)  # Common name for all variants
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_favourite = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    total_stock = models.PositiveIntegerField(default=0,blank=True, null=True)  # Stock level for this variant
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE, related_name="products")

    class Meta:
        db_table = "products"
        ordering = ("-created_at", "product_id")

    def __str__(self):
        return self.name



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
