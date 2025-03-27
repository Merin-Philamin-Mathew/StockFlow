import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

  import { 

    Package, 
    ArrowDownCircle, 
    ArrowUpCircle,
  } from "lucide-react";
import Header from "../partials/Header";
import api from "@/config/axios";
import SummaryCard from "./SummaryCard";
import ProductsTab from "./Products/ProductsTab";
import CategoriesTab from "./categories/CategoriesTab";
import StockManagementTab from "./stock/StockManagementTab";


// Main Dashboard Component
const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, variantsRes] = await Promise.all([
        api.get('/product-variants/'),
        api.get('/categories/'),
        api.get('/variants/'),
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setVariants(variantsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
        <Header/>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <SummaryCard
            title="Total Products"
            value={products.length}
            description="Products in inventory"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard 
            title="Categories" 
            value={categories.length}
            description="Product categories"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard 
            title="Stock Value" 
            value={`${calculateTotalStockValue(products).toFixed(2)}`}
            description="Total inventory value"
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          {/* <TabsList className="grid grid-cols-2 md:w-[400px]"> */}
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="stock">Stock Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            <ProductsTab
              products={products}
              categories={categories}
              variants={variants}
              refreshData={fetchDashboardData}
            />
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab 
              categories={categories}
              refreshData={fetchDashboardData}
            />
          </TabsContent>
          
          <TabsContent value="stock" className="space-y-4">
            <StockManagementTab 
              products={products}
              refreshData={fetchDashboardData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Helper function to calculate total stock value
const calculateTotalStockValue = (products) => {
  return products.reduce((total, product) => {
    const productValue = product.quantity * (product.price || 0);
    return total + productValue;
  }, 0);
};






// // Stock Management Tab Component
// const StockManagementTab = ({ products, refreshData }) => {
//   const [selectedProduct, setSelectedProduct] = useState('');
//   const [selectedVariant, setSelectedVariant] = useState(null);
//   const [variantItems, setVariantItems] = useState([]);
//   const [quantity, setQuantity] = useState(1);
//   const [operation, setOperation] = useState('add'); // 'add' or 'remove'

//   useEffect(() => {
//     if (selectedProduct) {
//       fetchProductVariants(selectedProduct);
//     } else {
//       setVariantItems([]);
//       setSelectedVariant(null);
//     }
//   }, [selectedProduct]);

//   const fetchProductVariants = async (productId) => {
//     try {
//       const response = await api.get(`/product-variants/?product=${productId}`);
//       setVariantItems(response.data);
//       setSelectedVariant(response.data.length > 0 ? response.data[0].id : null);
//     } catch (error) {
//       console.error("Error fetching variant items:", error);
//       setVariantItems([]);
//     }
//   };

//   const handleStockUpdate = async () => {
//     if (!selectedProduct || !selectedVariant || quantity <= 0) {
//       return;
//     }

//     try {
//       const endpoint = operation === 'add' 
//         ? `/product-variant-items/${selectedVariant}/add-stock/` 
//         : `/product-variant-items/${selectedVariant}/remove-stock/`;
        
//       await api.post(endpoint, {
//         quantity: parseInt(quantity)
//       });
      
//       // Refresh data
//       fetchProductVariants(selectedProduct);
//       refreshData();
      
//       // Reset form
//       setQuantity(1);
//     } catch (error) {
//       console.error("Error updating stock:", error);
//     }
//   };
// console.log(products,'ldfjldlfjdlfdlj')
//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Stock Management</CardTitle>
//           <CardDescription>Update stock levels for product variants</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="productSelect">Select Product</Label>
//             <select
//               id="productSelect"
//               className="w-full p-2 border rounded-md"
//               value={selectedProduct}
//               onChange={(e) => setSelectedProduct(e.target.value)}
//             >
//               <option value="">Select a product</option>
//               {products.map(product => (
//                 <option key={product.id} value={product.id}>
//                   {product.product_name} ({product.product_code})
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           {selectedProduct && (
//             <>
//               <div className="space-y-2">
//                 <Label htmlFor="variantSelect">Select Variant</Label>
//                 <select
//                   id="variantSelect"
//                   className="w-full p-2 border rounded-md"
//                   value={selectedVariant || ''}
//                   onChange={(e) => setSelectedVariant(e.target.value)}
//                   disabled={variantItems.length === 0}
//                 >
//                   {variantItems.length === 0 ? (
//                     <option value="">No variants available</option>
//                   ) : (
//                     variantItems.map(item => (
//                       <option key={item.id} value={item.id}>
//                         {Object.entries(item.variant_options)
//                           .map(([key, value]) => `${key}: ${value}`)
//                           .join(', ')}
//                         {' (Current Stock: ' + item.quantity + ')'}
//                       </option>
//                     ))
//                   )}
//                 </select>
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="quantity">Quantity</Label>
//                   <Input
//                     id="quantity"
//                     type="number"
//                     min="1"
//                     value={quantity}
//                     onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
//                   />
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="operation">Operation</Label>
//                   <div className="flex gap-2">
//                     <Button
//                       type="button"
//                       variant={operation === 'add' ? 'default' : 'outline'}
//                       className="flex-1"
//                       onClick={() => setOperation('add')}
//                     >
//                       <ArrowDownCircle className="mr-2 h-4 w-4" /> 
//                       Add Stock
//                     </Button>
//                     <Button
//                       type="button"
//                       variant={operation === 'remove' ? 'default' : 'outline'}
//                       className="flex-1"
//                       onClick={() => setOperation('remove')}
//                     >
//                       <ArrowUpCircle className="mr-2 h-4 w-4" /> 
//                       Remove Stock
//                     </Button>
//                   </div>
//                 </div>
//               </div>
              
//               <Button 
//                 onClick={handleStockUpdate} 
//                 disabled={!selectedVariant || quantity <= 0}
//                 className="w-full"
//               >
//                 {operation === 'add' ? 'Add' : 'Remove'} Stock
//               </Button>
//             </>
//           )}
//         </CardContent>
//       </Card>
      
//       {selectedProduct && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Stock History</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="border rounded-md">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Variant</TableHead>
//                     <TableHead>Current Stock</TableHead>
//                     <TableHead>Last Updated</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {variantItems.length === 0 ? (
//                     <TableRow>
//                       <TableCell colSpan={3} className="text-center py-4">
//                         No variants found for this product
//                       </TableCell>
//                     </TableRow>
//                   ) : (
//                     variantItems.map((item) => (
//                       <TableRow key={item.id}>
//                         <TableCell>
//                           {Object.entries(item.variant_options)
//                             .map(([key, value]) => `${key}: ${value}`)
//                             .join(', ')}
//                         </TableCell>
//                         <TableCell>{item.quantity}</TableCell>
//                         <TableCell>{new Date(item.updated_at || item.created_at).toLocaleString()}</TableCell>
//                       </TableRow>
//                     ))
//                   )}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

export default Dashboard;