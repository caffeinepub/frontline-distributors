import { useState } from 'react';
import { useGetAllProducts, useDeleteProduct } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ProductDialog from '../components/ProductDialog';
import ResponsiveTableCards, { CardRow } from '../components/ResponsiveTableCards';
import type { Product } from '../backend';
import { toast } from 'sonner';

export default function ProductsScreen() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const deleteProduct = useDeleteProduct();
  const { queueAction } = useOfflineQueue();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete product "${product.name}"?`)) return;

    try {
      await queueAction({
        type: 'deleteProduct',
        payload: product.id,
        execute: () => deleteProduct.mutateAsync(product.id),
      });
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete product');
    }
  };

  const renderProductCard = (product: Product) => {
    const stock = Number(product.availableInventory);
    const isLowStock = stock < 10;

    return (
      <Card key={product.id.toString()}>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-base">{product.name}</h3>
            <Badge variant={isLowStock ? 'destructive' : 'default'}>
              {isLowStock ? 'Low Stock' : 'In Stock'}
            </Badge>
          </div>
          <div className="space-y-2">
            <CardRow label="Price" value={`₹${Number(product.price).toLocaleString()}`} />
            <CardRow label="Stock" value={stock} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(product)}
              className="flex-1 gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(product)}
              className="flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your inventory and product catalog
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No products found. Add your first product to get started.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stock = Number(product.availableInventory);
                      const isLowStock = stock < 10;
                      
                      return (
                        <TableRow key={product.id.toString()}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>₹{Number(product.price).toLocaleString()}</TableCell>
                          <TableCell>{stock}</TableCell>
                          <TableCell>
                            <Badge variant={isLowStock ? 'destructive' : 'default'}>
                              {isLowStock ? 'Low Stock' : 'In Stock'}
                            </Badge>
                          </TableCell>
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <ResponsiveTableCards
                  data={products}
                  renderCard={renderProductCard}
                  emptyMessage="No products found. Add your first product to get started."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
      />
    </div>
  );
}
