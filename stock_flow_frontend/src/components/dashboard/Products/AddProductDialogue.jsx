import api from '@/config/axios';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Plus, Camera, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

// Validation schema using Zod - HSN code optional
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  product_code: z.string().optional(),
  hsn_code: z.string().optional(),
  is_active: z.boolean().default(true),
  image: z.any().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  productVariants: z.array(
    z.object({
      variantOptions: z.array(
        z.object({
          variant: z.string().optional(),
          variantId: z.string().optional(),
          option: z.string().optional(),
          optionId: z.string().optional(),
        })
      ).min(1, 'At least one variant option is required'),
      price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
      hsn_code: z.string().optional(),
      image: z.any().optional(),
    })
  ).nonempty('At least one variant is required')
});

const AddProductDialog = ({ open, onOpenChange, refreshData }) => {
  // Form setup with React Hook Form
  const { register, handleSubmit, control, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      product_code: '',
      hsn_code: '',
      is_active: true,
      category: '',
      subcategory: '',
      productVariants: [{ 
        variantOptions: [], 
        price: 0, 
        quantity: 0, 
        hsn_code: '',
        image: null
      }]
    }
  });

  const watchCategory = watch('category');
  const watchSubcategory = watch('subcategory');
  const watchHsnCode = watch('hsn_code');
  const watchProductVariants = watch('productVariants');
  
  // Image preview states
  const [variantImagePreviews, setVariantImagePreviews] = useState([]);
  
  // Field array for product variants
  const { fields, append, remove } = useFieldArray({
    control,
    name: "productVariants"
  });
  
  // Create a ref for each file input element
  // This is the key change - create a proper array of refs
  const fileInputRefs = useRef([]);
  
  // Data state
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [availableVariants, setAvailableVariants] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isSubCategoryLoading, setIsSubCategoryLoading] = useState(false);
  const [isVariantLoading, setIsVariantLoading] = useState(false);
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch subcategories when category changes
  useEffect(() => {
    if (watchCategory) {
      fetchSubCategories(watchCategory);
    } else {
      setSubCategories([]);
      setValue('subcategory', '');
    }
  }, [watchCategory, setValue]);
  
  // Fetch variants when subcategory changes
  useEffect(() => {
    if (watchSubcategory) {
      fetchVariants(watchSubcategory);
    } else {
      setAvailableVariants([]);
      reset({
        ...watch(),
        productVariants: [{ 
          variantOptions: [], 
          price: 0, 
          quantity: 0, 
          hsn_code: watchHsnCode || '',
          image: null
        }]
      });
      setVariantImagePreviews([]);
    }
  }, [watchSubcategory, reset, watch, watchHsnCode]);
  
  // Set default HSN code for variants when product HSN code changes
  useEffect(() => {
    if (watchHsnCode && watchProductVariants.length > 0) {
      watchProductVariants.forEach((variant, index) => {
        if (!variant.hsn_code) {
          setValue(`productVariants.${index}.hsn_code`, watchHsnCode);
        }
      });
    }
  }, [watchHsnCode, watchProductVariants, setValue]);
  
  // Make sure we have enough refs for all the variants
  useEffect(() => {
    // Initialize the refs array to the right size
    fileInputRefs.current = Array(fields.length).fill().map((_, i) => 
      fileInputRefs.current[i] || React.createRef()
    );
  }, [fields.length]);
  
  // Fetch categories
  const fetchCategories = async () => {
    setIsCategoryLoading(true);
    try {
      const response = await api.get('/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsCategoryLoading(false);
    }
  };
  
  // Fetch subcategories for a selected category
  const fetchSubCategories = async (categoryId) => {
    setIsSubCategoryLoading(true);
    try {
      const response = await api.get(`/sub-categories/?category=${categoryId}`);
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setIsSubCategoryLoading(false);
    }
  };
  
  // Fetch variants for a selected subcategory
  const fetchVariants = async (subcategoryId) => {
    setIsVariantLoading(true);
    try {
      const response = await api.get(`/variants/?subcategory=${subcategoryId}`);
      const variantsWithOptions = await Promise.all(
        response.data.map(async (variant) => {
          try {
            const optionsResponse = await api.get(`/variant-options/?variant=${variant.id}`);
            return {
              ...variant,
              options: optionsResponse.data
            };
          } catch (error) {
            console.error(`Error fetching options for variant ${variant.id}:`, error);
            return {
              ...variant,
              options: []
            };
          }
        })
      );
      setAvailableVariants(variantsWithOptions);
    } catch (error) {
      console.error("Error fetching variants:", error);
      toast.error("Failed to load variants");
    } finally {
      setIsVariantLoading(false);
    }
  };
  
  // Add a new empty variant
  const addNewVariant = () => {
    append({ 
      variantOptions: [], 
      price: 0, 
      quantity: 0, 
      hsn_code: watchHsnCode || '',
      image: null
    });
    
    // Add a new empty preview
    setVariantImagePreviews(prev => [...prev, null]);
  };
  
  // Update a variant option to a specific product variant
  const updateVariantOption = (variantIndex, variant, option) => {
    const currentVariantOptions = [...(watchProductVariants[variantIndex]?.variantOptions || [])];
    
    // Check if we already have an option for this variant type
    const existingOptionIndex = currentVariantOptions.findIndex(
      vo => vo.variantId === variant.id
    );
    
    let updatedVariantOptions = [...currentVariantOptions];
    
    if (existingOptionIndex >= 0) {
      // Update existing option
      updatedVariantOptions[existingOptionIndex] = {
        variant: variant.name,
        variantId: variant.id,
        option: option.option,
        optionId: option.id
      };
    } else {
      // Add new option
      updatedVariantOptions.push({
        variant: variant.name,
        variantId: variant.id,
        option: option.option,
        optionId: option.id
      });
    }
    
    setValue(`productVariants.${variantIndex}.variantOptions`, updatedVariantOptions);
  };
  
  // Remove a variant option from a specific product variant
  const removeVariantOption = (variantIndex, variantId) => {
    const currentVariantOptions = [...(watchProductVariants[variantIndex]?.variantOptions || [])];
    const updatedVariantOptions = currentVariantOptions.filter(
      vo => vo.variantId !== variantId
    );
    
    setValue(`productVariants.${variantIndex}.variantOptions`, updatedVariantOptions);
  };
  
  // Generate a random product code
  const generateProductCode = () => {
    return `PROD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };
  
  // Handle image selection for a variant
  const handleVariantImageChange = (e, index) => {
    if (e.target.files && e.target.files[0]) {
      setValue(`productVariants.${index}.image`, e.target.files[0]);
      
      const previewURL = URL.createObjectURL(e.target.files[0]);
      setVariantImagePreviews(prev => {
        const newPreviews = [...prev];
        newPreviews[index] = previewURL;
        return newPreviews;
      });
    }
  };
  
  // Remove image from a variant
  const removeVariantImage = (index) => {
    setValue(`productVariants.${index}.image`, null);
    
    // Clear the file input
    if (fileInputRefs.current[index] && fileInputRefs.current[index].current) {
      fileInputRefs.current[index].current.value = '';
    }
    
    // Remove preview
    setVariantImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[index] = null;
      return newPreviews;
    });
  };
  
  // Click the hidden file input - This is the important function that's not working
  const triggerVariantImageInput = (index) => {
    if (fileInputRefs.current[index] && fileInputRefs.current[index].current) {
      fileInputRefs.current[index].current.click();
    }
  };
  
  // Submit the form
  const onSubmit = async (data) => {
    // Validate that each variant has at least one option
    const invalidVariants = data.productVariants.filter(
      variant => !variant.variantOptions || variant.variantOptions.length === 0
    );
    
    if (invalidVariants.length > 0) {
      toast.error(`All variants must have at least one option selected`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the product
      const productData = {
        name: data.name,
        product_code: data.product_code || generateProductCode(),
        hsn_code: data.hsn_code || "",
        total_stock: data.productVariants.reduce((total, variant) => total + Number(variant.quantity), 0),
        is_active: data.is_active,
        image: data.image,
        subcategory: data.subcategory  
      };
      
      const productResponse = await api.post('/products/', productData);
      const productId = productResponse.data.id;
      
      // Create product variants
      const variantPromises = data.productVariants.map(variant => {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('product', productId);
        formData.append('price', variant.price);
        formData.append('quantity', variant.quantity);
        formData.append('hsn_code', variant.hsn_code || data.hsn_code || "");
        
        // Add variant options
        variant.variantOptions.forEach(vo => {
          formData.append('variant_options', vo.optionId);
        });
        
        // Add image if exists
        if (variant.image) {
          formData.append('image', variant.image);
        }
        
        return api.post('/product-variants/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });
      
      await Promise.all(variantPromises);
      
      toast.success("Product created successfully!");
      reset();
      setVariantImagePreviews([]);
      refreshData && refreshData();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product with variants and options.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product_code">Product Code (Optional)</Label>
              <Input id="product_code" {...register('product_code')} placeholder="Auto-generated if empty" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code (Optional)</Label>
              <Input id="hsn_code" {...register('hsn_code')} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register('is_active')}
                  className="h-4 w-4"
                />
                <span>Active</span>
              </div>
            </div>
          </div>
          
          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                {...register('category')}
                className="w-full p-2 border rounded-md"
                disabled={isCategoryLoading}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory *</Label>
              <select
                id="subcategory"
                {...register('subcategory')}
                className="w-full p-2 border rounded-md"
                disabled={isSubCategoryLoading || !watchCategory}
              >
                <option value="">Select Subcategory</option>
                {subCategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
              {errors.subcategory && <p className="text-sm text-red-500">{errors.subcategory.message}</p>}
            </div>
          </div>
          
          {/* Product Variants */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Product Variants</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addNewVariant}
                disabled={!watchSubcategory || isVariantLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>
            
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Variant #{index + 1}</h4>
                  {fields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                
                {/* Variant Options */}
                <div className="space-y-2">
                  <Label>Variant Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableVariants.map(variant => (
                      <div key={variant.id} className="border rounded-md p-2 space-y-2">
                        <h5 className="font-medium">{variant.name}</h5>
                        <div className="flex flex-wrap gap-1">
                          {variant.options.map(option => {
                            const isSelected = watchProductVariants[index]?.variantOptions?.some(
                              vo => vo.variantId === variant.id && vo.optionId === option.id
                            );
                            
                            return (
                              <Badge 
                                key={option.id}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => isSelected 
                                  ? removeVariantOption(index, variant.id)
                                  : updateVariantOption(index, variant, option)
                                }
                              >
                                {option.option}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {watchProductVariants[index]?.variantOptions?.length === 0 && 
                    <p className="text-sm text-amber-500">Select at least one variant option</p>
                  }
                </div>
                
                {/* Variant Image Upload */}
                <div className="space-y-2">
                  <Label>Variant Image</Label>
                  <div className="flex items-center gap-4">
                    {/* Image preview area */}
                    <div 
                      className="border rounded-md w-24 h-24 flex items-center justify-center overflow-hidden bg-gray-50"
                    >
                      {variantImagePreviews[index] ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={variantImagePreviews[index]} 
                            alt="Variant preview" 
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(index)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRefs.current[index]}
                      onChange={(e) => handleVariantImageChange(e, index)}
                    />
                    
                    {/* Upload button */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => triggerVariantImageInput(index)}
                    >
                      {variantImagePreviews[index] ? 'Change Image' : 'Upload Image'}
                    </Button>
                  </div>
                </div>
                
                {/* Variant Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`productVariants.${index}.price`}>Price *</Label>
                    <Input
                      id={`productVariants.${index}.price`}
                      type="number"
                      step="0.01"
                      {...register(`productVariants.${index}.price`)}
                    />
                    {errors.productVariants?.[index]?.price && (
                      <p className="text-sm text-red-500">{errors.productVariants[index].price.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`productVariants.${index}.quantity`}>Quantity *</Label>
                    <Input
                      id={`productVariants.${index}.quantity`}
                      type="number"
                      {...register(`productVariants.${index}.quantity`)}
                    />
                    {errors.productVariants?.[index]?.quantity && (
                      <p className="text-sm text-red-500">{errors.productVariants[index].quantity.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`productVariants.${index}.hsn_code`}>HSN Code (Optional)</Label>
                    <Input
                      id={`productVariants.${index}.hsn_code`}
                      placeholder={watchHsnCode || "Same as product"}
                      {...register(`productVariants.${index}.hsn_code`)}
                    />
                  </div>
                </div>
                
                {/* Display Selected Variants */}
                {watchProductVariants[index]?.variantOptions?.length > 0 && (
                  <div className="mt-2">
                    <Label>Selected Options:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {watchProductVariants[index].variantOptions.map((vo, voIndex) => (
                        <Badge key={voIndex} className="bg-green-100 text-green-800 border-green-300">
                          {vo.variant}: {vo.option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;