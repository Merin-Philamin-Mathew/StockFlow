import { Button } from '@/components/ui/button';
import { Edit, PlusCircle, Trash2, ChevronRight, Plus } from 'lucide-react';
import React, { useState } from 'react';
import api from "@/config/axios";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import CategoryDialog from './CategoriesDialog';
import SubCategoryDialog from './SubCategoriesDialog';
import VariantDialog from '../variants/VariantDialog';
import VariantOptionDialog from '../variants/VariantOptionsDialog';

// Main Categories Tab Component
const CategoriesTab = ({ categories, refreshData }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);
  const [expandedVariant, setExpandedVariant] = useState(null);
  
  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) return;
    
    try {
      const response = await api.get(`/sub-categories/?category=${categoryId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };
  
  const fetchVariants = async (subcategoryId) => {
    if (!subcategoryId) return;
    
    try {
      const response = await api.get(`/variants/?subcategory=${subcategoryId}`);
      setVariants(response.data);
    } catch (error) {
      console.error("Error fetching variants:", error);
      setVariants([]);
    }
  };
  
  const fetchVariantOptions = async (variantId) => {
    if (!variantId) return;
    
    try {
      const response = await api.get(`/variant-options/?variant=${variantId}`);
      setVariantOptions(response.data);
    } catch (error) {
      console.error("Error fetching variant options:", error);
      setVariantOptions([]);
    }
  };
  
  const handleCategoryExpand = async (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      return;
    }
    
    setExpandedCategory(categoryId);
    setSelectedCategory(categoryId);
    await fetchSubcategories(categoryId);
  };
  
  const handleSubcategoryExpand = async (subcategoryId) => {
    if (expandedSubcategory === subcategoryId) {
      setExpandedSubcategory(null);
      return;
    }
    
    setExpandedSubcategory(subcategoryId);
    setSelectedSubCategory(subcategoryId);
    await fetchVariants(subcategoryId);
  };
  
  const handleVariantExpand = async (variantId) => {
    if (expandedVariant === variantId) {
      setExpandedVariant(null);
      return;
    }
    
    setExpandedVariant(variantId);
    setSelectedVariant(variantId);
    await fetchVariantOptions(variantId);
  };
  
  const openDialog = (type, categoryId = null, subcategoryId = null, variantId = null) => {
    setDialogType(type);
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subcategoryId);
    setSelectedVariant(variantId);
    setShowDialog(true);
  };
  
  const handleDelete = async (type, id) => {
    const endpoint = {
      'category': '/categories/',
      'subcategory': '/sub-categories/',
      'variant': '/variants/',
      'variantOption': '/variant-options/'
    }[type];
    
    if (!endpoint) return;
    
    try {
      await api.delete(`${endpoint}${id}/`);
      refreshData();
      
      // Reset selections and refresh related data
      if (type === 'category') {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSelectedVariant(null);
        setExpandedCategory(null);
        setExpandedSubcategory(null);
        setExpandedVariant(null);
        setSubcategories([]);
        setVariants([]);
        setVariantOptions([]);
      } else if (type === 'subcategory') {
        setSelectedSubCategory(null);
        setSelectedVariant(null);
        setExpandedSubcategory(null);
        setExpandedVariant(null);
        setVariants([]);
        setVariantOptions([]);
        if (expandedCategory) fetchSubcategories(expandedCategory);
      } else if (type === 'variant') {
        setSelectedVariant(null);
        setExpandedVariant(null);
        setVariantOptions([]);
        if (expandedSubcategory) fetchVariants(expandedSubcategory);
      } else if (type === 'variantOption') {
        if (expandedVariant) fetchVariantOptions(expandedVariant);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categories Management</h2>
        <Button onClick={() => openDialog('category')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
      
      <div className="border rounded-md bg-card text-card-foreground">
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={expandedCategory}
          onValueChange={handleCategoryExpand}
        >
          {categories.length === 0 ? (
            <div className="p-4 text-center">No categories found</div>
          ) : (
            categories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-transparent dark:from-blue-900/30 dark:to-transparent hover:bg-muted/50">
                  <div className="flex w-full justify-between items-center">
                    <div className="font-medium">{category.name}</div>
                    <div className="flex items-center gap-2 mr-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog('subcategory', category.id);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="ml-1">Subcategory</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit logic would go here
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('category', category.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gradient-to-r from-blue-500/5 to-transparent dark:from-blue-900/20 dark:to-transparent">
                  <div className="pl-4 pr-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Subcategories</h3>
                    </div>
                    
                    {/* Nested Accordion for Subcategories */}
                    <Accordion 
                      type="single" 
                      collapsible 
                      className="w-full border-l border-border/40"
                      value={expandedSubcategory}
                      onValueChange={handleSubcategoryExpand}
                    >
                      {subcategories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No subcategories found</div>
                      ) : (
                        subcategories.map((subcategory) => (
                          <AccordionItem key={subcategory.id} value={subcategory.id}>
                            <AccordionTrigger className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500/10 to-transparent dark:from-indigo-900/30 dark:to-transparent hover:bg-muted/50">
                              <div className="flex w-full justify-between items-center">
                                <div className="font-medium">{subcategory.name}</div>
                                <div className="flex items-center gap-2 mr-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDialog('variant', category.id, subcategory.id);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span className="ml-1">Variant</span>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Edit logic would go here
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete('subcategory', subcategory.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-gradient-to-r from-indigo-500/5 to-transparent dark:from-indigo-900/20 dark:to-transparent">
                              <div className="pl-4 pr-2">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium">Variants</h4>
                                </div>
                                
                                {/* Nested Accordion for Variants */}
                                <Accordion 
                                  type="single" 
                                  collapsible 
                                  className="w-full border-l border-border/40"
                                  value={expandedVariant}
                                  onValueChange={handleVariantExpand}
                                >
                                  {variants.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">No variants found</div>
                                  ) : (
                                    variants.map((variant) => (
                                      <AccordionItem key={variant.id} value={variant.id}>
                                        <AccordionTrigger className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500/10 to-transparent dark:from-purple-900/30 dark:to-transparent hover:bg-muted/50">
                                          <div className="flex w-full justify-between items-center">
                                            <div className="font-medium">{variant.name}</div>
                                            <div className="flex items-center gap-2 mr-4">
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openDialog('variantOption', category.id, subcategory.id, variant.id);
                                                }}
                                              >
                                                <Plus className="h-4 w-4" />
                                                <span className="ml-1">Option</span>
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Edit logic would go here
                                                }}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDelete('variant', variant.id);
                                                }}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="bg-gradient-to-r from-purple-500/5 to-transparent dark:from-purple-900/20 dark:to-transparent">
                                          <div className="pl-4 pr-2">
                                            <div className="mb-2">
                                              <h5 className="text-sm font-medium mb-2">Variant Options</h5>
                                              <div className="space-y-2 bg-gradient-to-r from-pink-500/5 to-transparent dark:from-pink-900/20 dark:to-transparent p-2 rounded-md">
                                                {variantOptions.length === 0 ? (
                                                  <div className="p-2 text-sm text-muted-foreground">No options found</div>
                                                ) : (
                                                  <div className="flex flex-wrap gap-2">
                                                    {variantOptions.map((option) => (
                                                      <div key={option.id} className="flex items-center gap-2 p-2 border rounded-md bg-card shadow-sm dark:border-border/60">
                                                        <Badge variant="outline">{option.option}</Badge>
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm"
                                                          onClick={() => handleDelete('variantOption', option.id)}
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))
                                  )}
                                </Accordion>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      )}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          )}
        </Accordion>
      </div>
      
      {/* Render appropriate dialog based on dialogType */}
      {dialogType === 'category' && (
        <CategoryDialog 
          open={showDialog}
          onOpenChange={setShowDialog}
          refreshData={refreshData}
        />
      )}
      
      {dialogType === 'subcategory' && (
        <SubCategoryDialog 
          open={showDialog}
          onOpenChange={setShowDialog}
          categoryId={selectedCategory}
          refreshData={() => {
            refreshData();
            if (expandedCategory) {
              fetchSubcategories(expandedCategory);
            }
          }}
        />
      )}
      
      {dialogType === 'variant' && (
        <VariantDialog 
          open={showDialog}
          onOpenChange={setShowDialog}
          subcategoryId={selectedSubCategory}
          refreshData={() => {
            refreshData();
            if (expandedSubcategory) {
              fetchVariants(expandedSubcategory);
            }
          }}
        />
      )}
      
      {dialogType === 'variantOption' && (
        <VariantOptionDialog 
          open={showDialog}
          onOpenChange={setShowDialog}
          variantId={selectedVariant}
          refreshData={() => {
            refreshData();
            if (expandedVariant) {
              fetchVariantOptions(expandedVariant);
            }
          }}
        />
      )}
    </div>
  );
};

export default CategoriesTab;