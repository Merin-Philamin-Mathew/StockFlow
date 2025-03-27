import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Plus, Minus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/config/axios";

const ProductsTable = ({ products, refreshData }) => {
  const [viewProduct, setViewProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    variantId: null,
    quantity: 0
  });
  
  // Group products by product ID to combine variants
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.product]) {
      acc[product.product] = {
        id: product.product,
        name: product.product_name,
        code: product.product_code.split('-')[0], // Get base product code
        subcategory: product.subcategory,
        totalStock: 0,
        totalValue: 0,
        variants: []
      };
    }
    
    // Add this variant
    acc[product.product].variants.push({
      id: product.id,
      code: product.product_code,
      price: product.price,
      quantity: product.quantity,
      configurations: product.configurations,
      image: product.image
    });
    
    acc[product.product].totalStock += product.quantity;
    acc[product.product].totalValue += parseFloat(product.price) * product.quantity;
    
    return acc;
  }, {});
  
  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await api.delete(`/products/${productToDelete}/`);
      refreshData();
      setDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleStockAdjustment = async (variantId, adjustment) => {
    try {
      const response = await api.put(`/product-variants/${variantId}/adjust-stock/`, {
        quantity_change: adjustment
      });
      console.log(response.data);
      refreshData();
      setStockAdjustment({ variantId: null, quantity: 0 });
    } catch (error) {
      console.error("Error adjusting stock:", error);
    }
  };

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Stock</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(groupedProducts).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              Object.values(groupedProducts).map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.subcategory}</TableCell>
                  <TableCell className="text-right">{product.totalStock}</TableCell>
                  <TableCell className="text-right">₹{product.totalValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setViewProduct(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setProductToDelete(product.id);
                          setDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product View Dialog */}
      {viewProduct && (
        <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{viewProduct.name}</DialogTitle>
              <DialogDescription>
                Product Code: {viewProduct.code} | Category: {viewProduct.subcategory}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewProduct.variants.map((variant) => (
                <div 
                  key={variant.id} 
                  className="border rounded-lg p-4 flex flex-col"
                >
                  {/* Variant Image */}
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={variant.image} 
                      alt={variant.code}
                      className="max-h-48 object-cover rounded-md"
                    />
                  </div>

                  {/* Variant Details */}
                  <div className="flex-grow">
                    <div className="font-semibold">{variant.code}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {variant.configurations.map(config => 
                        `${config.variant_name}: ${config.option_value}`
                      ).join(', ')}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div>Price: ₹{parseFloat(variant.price).toFixed(2)}</div>
                        <div>Stock: {variant.quantity}</div>
                      </div>
                      
                      {/* Stock Adjustment */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setStockAdjustment({
                            variantId: variant.id,
                            quantity: stockAdjustment.quantity-1 || 0
                          })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number" 
                          value={stockAdjustment.variantId === variant.id ? stockAdjustment.quantity : 0}
                          onChange={(e) => setStockAdjustment({
                            variantId: variant.id,
                            quantity: parseInt(e.target.value) || 0
                          })}
                          className="w-20 text-center"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleStockAdjustment(variant.id, stockAdjustment.quantity+1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductsTable;