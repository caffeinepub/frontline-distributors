import { useState, useEffect } from 'react';
import { useCreateCustomer, useUpdateCustomer, useGetAllCustomers } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Customer } from '../backend';
import { toast } from 'sonner';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export default function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const { data: customers = [] } = useGetAllCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { queueAction } = useOfflineQueue();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhoneNumber(customer.phoneNumber);
      setAddress(customer.address);
    } else {
      setName('');
      setPhoneNumber('');
      setAddress('');
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phoneNumber.trim()) {
      toast.error('Please fill in name and phone number');
      return;
    }

    try {
      if (customer) {
        // Update existing customer
        const updatedCustomer: Customer = {
          ...customer,
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
        };

        await queueAction({
          type: 'updateCustomer',
          payload: updatedCustomer,
          execute: () => updateCustomer.mutateAsync(updatedCustomer),
        });

        toast.success('Customer updated successfully');
      } else {
        // Create new customer - generate unique ID
        const maxId = customers.reduce((max, c) => {
          const id = Number(c.id);
          return id > max ? id : max;
        }, 0);

        const newCustomer: Customer = {
          id: BigInt(maxId + 1),
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim(),
        };

        await queueAction({
          type: 'createCustomer',
          payload: newCustomer,
          execute: () => createCustomer.mutateAsync(newCustomer),
        });

        toast.success('Customer created successfully');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(customer ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background text-foreground border-border max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {customer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
