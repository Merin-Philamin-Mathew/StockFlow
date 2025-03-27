// VariantOptionDialog.jsx - For adding options to a variant
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

const VariantOptionDialog = ({ open, onOpenChange, variantId, refreshData }) => {
  const [formData, setFormData] = useState({
    option: '',
    variant: variantId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Update variant ID if it changes
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, variant: variantId }));
  }, [variantId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/variant-options/', formData);
      setFormData({ option: '', variant: variantId });
      onOpenChange(false);
      refreshData();
    } catch (error) {
      console.error("Error creating variant option:", error);
      setError(error.response?.data?.message || 'Failed to create variant option');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Variant Option</DialogTitle>
            <DialogDescription>
              Create a new option for this variant (e.g., Red, Large)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="optionValue">Option Value</Label>
              <Input
                id="optionValue"
                placeholder="Enter option value (e.g., Red, Large)"
                value={formData.option}
                onChange={(e) => setFormData({...formData, option: e.target.value})}
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
              {isSubmitting ? 'Creating...' : 'Create Option'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VariantOptionDialog;