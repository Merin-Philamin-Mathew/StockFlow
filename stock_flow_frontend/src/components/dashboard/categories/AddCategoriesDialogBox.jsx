import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Add Category Dialog Component
const AddCategoryDialog = ({ open, onOpenChange, refreshData }) => {
    const [categoryForm, setCategoryForm] = useState({
      name: '',
      description: ''
    });
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        await api.post('/categories/', categoryForm);
        setCategoryForm({ name: '', description: '' });
        onOpenChange(false);
        refreshData();
      } catch (error) {
        console.error("Error creating category:", error);
      }
    };
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new product category
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="Enter category name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description (Optional)</Label>
                <Input
                  id="categoryDescription"
                  placeholder="Enter category description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };
  
export default AddCategoryDialog
