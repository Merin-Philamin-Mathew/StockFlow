// VariantDialog.jsx - For adding variants to a subcategory
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

const VariantDialog = ({ open, onOpenChange, subcategoryId, refreshData }) => {
  const [formData, setFormData] = useState({
    name: '',
    subcategory: subcategoryId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Update subcategory ID if it changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, subcategory: subcategoryId }));
  }, [subcategoryId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/variants/', formData);
      setFormData({ name: '', subcategory: subcategoryId });
      onOpenChange(false);
      refreshData();
    } catch (error) {
      console.error("Error creating variant:", error);
      setError(error.response?.data?.message || 'Failed to create variant');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Variant</DialogTitle>
            <DialogDescription>
              Create a new variant type (e.g., Size, Color)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variantName">Variant Name</Label>
              <Input
                id="variantName"
                placeholder="Enter variant name (e.g., Size, Color)"
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
              {isSubmitting ? 'Creating...' : 'Create Variant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VariantDialog;