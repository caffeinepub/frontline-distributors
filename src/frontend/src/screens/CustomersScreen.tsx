import { useState } from 'react';
import { useGetAllCustomers, useDeleteCustomer, useGetCallerRole } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import CustomerDialog from '../components/CustomerDialog';
import type { Customer } from '../types/local';
import { toast } from 'sonner';
import { normalizeAuthError } from '../utils/authErrors';

export default function CustomersScreen() {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const { data: isAdmin = false } = useGetCallerRole();
  const deleteCustomer = useDeleteCustomer();
  const { queueAction } = useOfflineQueue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleEdit = (customer: Customer) => {
    if (!isAdmin) {
      toast.error('Only admins can edit customers');
      return;
    }
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!isAdmin) {
      toast.error('Only admins can delete customers');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }

    try {
      await queueAction({
        type: 'deleteCustomer',
        payload: customer.id,
        execute: () => deleteCustomer.mutateAsync(customer.id),
      });

      toast.success('Customer deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMsg = normalizeAuthError(error);
      toast.error(errorMsg);
    }
  };

  const handleAdd = () => {
    if (!isAdmin) {
      toast.error('Only admins can add customers');
      return;
    }
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No customers found. {isAdmin && 'Add your first customer to get started.'}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id.toString()}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.address || '-'}</TableCell>
                      <TableCell>{customer.phoneNumber || '-'}</TableCell>
                      {isAdmin && (
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
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
      />
    </div>
  );
}
