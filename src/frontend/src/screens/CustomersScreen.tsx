import { useState } from 'react';
import { useGetAllCustomers, useDeleteCustomer, useGetCallerRole } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import CustomerDialog from '../components/CustomerDialog';
import ResponsiveTableCards, { CardRow } from '../components/ResponsiveTableCards';
import type { Customer } from '../backend';
import { toast } from 'sonner';

export default function CustomersScreen() {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const { data: isAdmin = false } = useGetCallerRole();
  const deleteCustomer = useDeleteCustomer();
  const { queueAction } = useOfflineQueue();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAdd = () => {
    if (!isAdmin) {
      toast.error('Only admins can add customers');
      return;
    }
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    if (!isAdmin) {
      toast.error('Only admins can edit customers');
      return;
    }
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!isAdmin) {
      toast.error('Only admins can delete customers');
      return;
    }

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

  const renderCustomerCard = (customer: Customer) => (
    <Card key={customer.id.toString()}>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-base">{customer.name}</h3>
        <div className="space-y-2">
          <CardRow label="Phone" value={customer.phoneNumber} />
          <CardRow label="Address" value={customer.address || 'N/A'} />
        </div>
        {isAdmin && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(customer)}
              className="flex-1 gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(customer)}
              className="flex-1 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        )}
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
              No customers found. {isAdmin ? 'Add your first customer to get started.' : ''}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Address</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id.toString()}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phoneNumber}</TableCell>
                        <TableCell>{customer.address}</TableCell>
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

              {/* Mobile Card View */}
              <div className="md:hidden">
                <ResponsiveTableCards
                  data={customers}
                  renderCard={renderCustomerCard}
                  emptyMessage={`No customers found. ${isAdmin ? 'Add your first customer to get started.' : ''}`}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editingCustomer}
        />
      )}
    </div>
  );
}
