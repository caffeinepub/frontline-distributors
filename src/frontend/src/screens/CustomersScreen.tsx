import { useState } from 'react';
import { useGetAllCustomers, useDeleteCustomer } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import CustomerDialog from '../components/CustomerDialog';
import type { Customer } from '../backend';
import { toast } from 'sonner';

export default function CustomersScreen() {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const deleteCustomer = useDeleteCustomer();
  const { queueAction } = useOfflineQueue();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete customer "${customer.name}"?`)) return;

    try {
      await queueAction({
        type: 'deleteCustomer',
        payload: customer.id,
        execute: () => deleteCustomer.mutateAsync(customer.id),
      });
      toast.success('Customer deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : customers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No customers found. Add your first customer to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id.toString()}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phoneNumber}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
      />
    </div>
  );
}
