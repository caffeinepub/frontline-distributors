import { useState, useEffect } from 'react';
import { useCreateProduct, useUpdateProduct, useGetAllProducts } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '../types/local';
import { toast } from 'sonner';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export default function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { data: products = [] } = useGetAllProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { queueAction } = useOfflineQueue();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [piecesPerCase, setPiecesPerCase] = useState('1');
  const [stockUnit, setStockUnit] = useState<'pieces' | 'cases'>('pieces');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setCost(product.cost?.toString() || '0');
      setStock(product.availableInventory.toString());
      setPiecesPerCase(product.piecesPerCase?.toString() || '1');
      setStockUnit('pieces');
    } else {
      setName('');
      setPrice('');
      setCost('0');
      setStock('');
      setPiecesPerCase('1');
      setStockUnit('pieces');
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost) || 0;
    const stockNum = parseInt(stock);
    const piecesPerCaseNum = parseInt(piecesPerCase);

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price (non-negative)');
      return;
    }

    if (isNaN(costNum) || costNum < 0) {
      toast.error('Please enter a valid cost (non-negative)');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      toast.error('Please enter a valid stock quantity (non-negative)');
      return;
    }

    if (isNaN(piecesPerCaseNum) || piecesPerCaseNum <= 0) {
      toast.error('Pieces per case must be a positive number');
      return;
    }

    if (stockUnit === 'cases' && (isNaN(piecesPerCaseNum) || piecesPerCaseNum <= 0)) {
      toast.error('Cannot use Cases unit when pieces per case is not set');
      return;
    }

    // Convert stock to pieces if unit is cases
    const stockInPieces = stockUnit === 'cases' ? stockNum * piecesPerCaseNum : stockNum;

    try {
      if (product) {
        // Update existing product
        const updatedProduct: Product = {
          ...product,
          name: name.trim(),
          price: BigInt(Math.round(priceNum)),
          cost: BigInt(Math.round(costNum)),
          availableInventory: BigInt(stockInPieces),
          piecesPerCase: BigInt(piecesPerCaseNum),
        };

        await queueAction({
          type: 'updateProduct',
          payload: updatedProduct,
          execute: () => updateProduct.mutateAsync(updatedProduct),
        });

        toast.success('Product updated successfully');
      } else {
        // Create new product - generate unique ID
        const maxId = products.reduce((max, p) => {
          const id = Number(p.id);
          return id > max ? id : max;
        }, 0);

        const newProduct: Product = {
          id: BigInt(maxId + 1),
          name: name.trim(),
          price: BigInt(Math.round(priceNum)),
          cost: BigInt(Math.round(costNum)),
          availableInventory: BigInt(stockInPieces),
          piecesPerCase: BigInt(piecesPerCaseNum),
        };

        await queueAction({
          type: 'createProduct',
          payload: newProduct,
          execute: () => createProduct.mutateAsync(newProduct),
        });

        toast.success('Product created successfully');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(product ? 'Failed to update product' : 'Failed to create product');
    }
  };

  // Calculate helper conversion for display
  const piecesPerCaseNum = parseInt(piecesPerCase) || 1;
  const currentStockPieces = product ? Number(product.availableInventory) : 0;
  const currentStockCases = piecesPerCaseNum > 1 ? (currentStockPieces / piecesPerCaseNum).toFixed(2) : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground border-border max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Selling Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost Price (₹)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="piecesPerCase">Pieces per Case</Label>
            <Input
              id="piecesPerCase"
              type="number"
              min="1"
              value={piecesPerCase}
              onChange={(e) => setPiecesPerCase(e.target.value)}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground">
              How many pieces are in one case? (Default: 1)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock Quantity</Label>
            <div className="flex gap-2">
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="flex-1"
              />
              <Select value={stockUnit} onValueChange={(value: 'pieces' | 'cases') => setStockUnit(value)}>
                <SelectTrigger className="w-28 sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="cases">Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {product && piecesPerCaseNum > 1 && (
              <p className="text-xs text-muted-foreground">
                Current stock: {currentStockPieces} pieces (≈ {currentStockCases} cases)
              </p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {product ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
