import React, { useState } from 'react'
import ProductsTable from './ProductsTable';
import AddProductDialog from './AddProductDialogue';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Products Tab Component
const ProductsTab = ({ products, refreshData }) => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Product List</h2>
        <Button onClick={() => setShowAddProduct(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      
      <ProductsTable products={products} refreshData={refreshData} />
      
      <AddProductDialog 
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        refreshData={refreshData}
      />
    </div>
  );
};


export default ProductsTab
