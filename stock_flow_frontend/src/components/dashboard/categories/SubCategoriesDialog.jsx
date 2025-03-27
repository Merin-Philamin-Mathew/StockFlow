// SubCategoryDialog.jsx - For adding subcategories to a category
import React, { useState } from 'react';
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
import api from "@/config/axios";

const SubCategoryDialog = ({ open, onOpenChange, categoryId, refreshData }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: categoryId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Update category ID if it changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  }, [categoryId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/sub-categories/', formData);
      setFormData({ name: '', category: categoryId });
      onOpenChange(false);
      refreshData();
    } catch (error) {
      console.error("Error creating subcategory:", error);
      setError(error.response?.data?.message || 'Failed to create subcategory');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>
              Create a new subcategory for this category
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subcategoryName">Subcategory Name</Label>
              <Input
                id="subcategoryName"
                placeholder="Enter subcategory name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Subcategory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubCategoryDialog;



