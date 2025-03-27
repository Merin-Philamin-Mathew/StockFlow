import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription 
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
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertCircle 
} from "lucide-react";
import { 
  ToastProvider, 
  ToastViewport, 
  Toast, 
  ToastTitle, 
  ToastDescription,
  ToastClose 
} from "@/components/ui/toast";
import api from "@/config/axios";

const StockManagementTab = () => {
  const [products1, setProducts1] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantItems, setVariantItems] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState('add');
  const [stockHistory, setStockHistory] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'default'
  });

  const showToast = (title, description, variant = 'default') => {
    setToast({
      open: true,
      title,
      description,
      variant
    });
  };
  useEffect(() => {
    fetchProducts1();
    fetchLowStockAlerts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductVariants(selectedProduct);
    } else {
      setVariantItems([]);
      setSelectedVariant(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedVariant) {
      fetchStockHistory(selectedVariant);
    }
  }, [selectedVariant]);

  const fetchProducts1 = async () => {
    try {
      const response = await api.get(`/products/`);
      setProducts1(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts1([]);
    }
  };

  const fetchProductVariants = async (productId) => {
    try {
      const response = await api.get(`/product-variants/by-product/${productId}`);
      setVariantItems(response.data);
      setSelectedVariant(response.data.length > 0 ? response.data[0].id : null);
    } catch (error) {
      console.error("Error fetching variant items:", error);
      setVariantItems([]);
      showToast('Error', 'Failed to fetch product variants', 'destructive');
    }
  };


  const fetchStockHistory = async (variantId) => {
    try {
      const response = await api.get(`/stock/stock-history/${variantId}/`);
      setStockHistory(response.data);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      showToast('Error', 'Failed to fetch stock history', 'destructive');
    }
  };


  const fetchLowStockAlerts = async () => {
    try {
      const response = await api.get('/low-stock-alerts/current-alerts/');
      setLowStockAlerts(response.data);
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      showToast('Error', 'Failed to fetch low stock alerts', 'destructive');
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct || !selectedVariant || quantity <= 0) {
      showToast('Validation Error', 'Please select a product, variant, and enter a valid quantity', 'destructive');
      return;
    }

    try {
      const endpoint = operation === 'add' 
        ? `/stock/add-stock/`
        : `/stock/remove-stock/`;
      
      await api.post(endpoint, {
        product_variant_id: selectedVariant,
        quantity: parseInt(quantity),
        notes: notes
      });

      // Refresh data
      fetchProductVariants(selectedProduct);
      fetchStockHistory(selectedVariant);
      fetchLowStockAlerts();

      // Reset form
      setQuantity(1);
      setNotes('');
      // Show success toast
      showToast('Success', `Stock ${operation}ed successfully`, 'default');
    } catch (error) {
      console.error("Error updating stock:", error);
      showToast('Error', `Failed to ${operation} stock: ${error.response?.data?.error || 'Unknown error'}`, 'destructive');
    }
  }

  return (
    <ToastProvider>
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center text-yellow-600">
              <AlertCircle className="mr-2" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.map(alert => (
              <div key={alert.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">
                    {alert.product_variant_details.product_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Current Stock: {alert.current_stock} 
                    (Threshold: {alert.threshold})
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stock Management Form */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>Update stock levels for product variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="productSelect">Select Product</Label>
            <select
              id="productSelect"
              className="w-full p-2 border rounded-md"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Select a product</option>
              {products1.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Variant Selection */}
          {selectedProduct && (
            <div className="space-y-2">
              <Label htmlFor="variantSelect">Select Variant</Label>
              <select
                id="variantSelect"
                className="w-full p-2 border rounded-md"
                value={selectedVariant || ''}
                onChange={(e) => setSelectedVariant(e.target.value)}
                disabled={variantItems.length === 0}
              >
                {variantItems.length === 0 ? (
                  <option value="">No variants available</option>
                ) : (
                  variantItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {Object.entries(item.configurations)
                        .map(([key, value]) => `(${value.variant_name}: ${value.option_value})`)
                        .join(' ')}
                      {' (Current Stock: ' + item.quantity + ')'}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Stock Update Form */}
          {selectedVariant && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="operation">Operation</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={operation === 'add' ? 'default' : 'outline'}
                      onClick={() => setOperation('add')}
                      className="flex-1"
                    >
                      <ArrowDownCircle className="mr-2" /> Add Stock
                    </Button>
                    <Button
                      variant={operation === 'remove' ? 'default' : 'outline'}
                      onClick={() => setOperation('remove')}
                      className="flex-1"
                    >
                      <ArrowUpCircle className="mr-2" /> Remove Stock
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter transaction notes"
                />
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleStockUpdate} 
                disabled={!selectedVariant || quantity <= 0}
                className="w-full"
              >
                {operation === 'add' ? 'Add' : 'Remove'} Stock
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock History */}
      {selectedVariant && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No stock transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  stockHistory.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {transaction.transaction_type === 'add' ? (
                          <span className="text-green-600">Add</span>
                        ) : (
                          <span className="text-red-600">Remove</span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>{transaction.notes || '-'}</TableCell>
                      <TableCell>{transaction.user_username}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    
      {/* Toast Notification */}
      {toast.open && (
          <Toast 
            open={toast.open} 
            onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
            className={`${toast.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          >
            <div className="grid gap-1">
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </div>
    </ToastProvider>
  );
};

export default StockManagementTab;