from django.contrib import admin
from .models import *
# Register your models here.

class CustomVariant(admin.ModelAdmin):
    list_display = [field.name for field in Variant._meta.fields]

admin.site.register(Variant, CustomVariant)
