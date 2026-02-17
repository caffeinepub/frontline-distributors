import { useState } from 'react';
import { useGetAllProducts, useDeleteProduct, useGetCallerRole } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ProductDialog from '../components/ProductDialog';
import type { Product } from '../types/local';
import { toast } from 'sonner';
import { normalizeAuthError } from '../utils/authErrors';

export default function ProductsScreen() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const { data: isAdmin = false } = useGetCallerRole();
  const deleteProduct = useDeleteProduct();
  const { queueAction } = useOfflineQueue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    if (!isAdmin) {
      toast.error('Only admins can edit products');
      return;
    }
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!isAdmin) {
      toast.error('Only admins can delete products');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    try {
      await queueAction({
        type: 'deleteProduct',
        payload: product.id,
        execute: () => deleteProduct.mutateAsync(product.id),
      });

      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMsg = normalizeAuthError(error);
      toast.error(errorMsg);
    }
  };

  const handleAdd = () => {
    if (!isAdmin) {
      toast.error('Only admins can add products');
      return;
    }
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No products found. {isAdmin && 'Add your first product to get started.'}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Per Case</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id.toString()}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">₹{Number(product.price)}</TableCell>
                      <TableCell className="text-right">₹{Number(product.cost)}</TableCell>
                      <TableCell className="text-right">{Number(product.availableInventory)}</TableCell>
                      <TableCell className="text-right">{Number(product.piecesPerCase)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}
