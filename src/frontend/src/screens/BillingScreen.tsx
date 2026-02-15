import { useState } from 'react';
import { useGetAllCustomers, useGetAllProducts, useGetAllBills, useCreateBill } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Printer } from 'lucide-react';
import type { Product, Bill } from '../backend';
import { toast } from 'sonner';
import { calculateBillingTotals, calculateBillTotal } from '../utils/billingTotals';
import { printInvoice } from '../utils/printInvoice';

interface BillLine {
  product: Product;
  quantity: number;
  unit: 'pieces' | 'cases';
}

const GST_RATES = [
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

export default function BillingScreen() {
  const { data: customers = [] } = useGetAllCustomers();
  const { data: products = [] } = useGetAllProducts();
  const { data: bills = [] } = useGetAllBills();
  const createBill = useCreateBill();
  const { queueAction } = useOfflineQueue();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [billLines, setBillLines] = useState<BillLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState<'pieces' | 'cases'>('pieces');
  const [discount, setDiscount] = useState('0');
  const [creditAmount, setCreditAmount] = useState('0');
  const [gstApplied, setGstApplied] = useState(false);
  const [gstRate, setGstRate] = useState('18');

  // Calculate totals using the shared utility
  const subtotal = billLines.reduce((sum, line) => {
    return sum + Number(line.product.price) * line.quantity;
  }, 0);
  const discountAmount = parseFloat(discount) || 0;
  const creditAmt = parseFloat(creditAmount) || 0;
  
  const totals = calculateBillingTotals({
    subtotal,
    discount: discountAmount,
    gstApplied,
    gstRate: parseFloat(gstRate),
  });

  const handleAddLine = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const piecesPerCase = Number(product.piecesPerCase) || 1;

    // Validate pieces per case for cases unit
    if (quantityUnit === 'cases' && piecesPerCase <= 0) {
      toast.error('Cannot use Cases unit when pieces per case is not set for this product');
      return;
    }

    // Calculate required pieces
    const requiredPieces = quantityUnit === 'pieces' ? qty : qty * piecesPerCase;

    // Validate against available inventory (in pieces)
    if (requiredPieces > Number(product.availableInventory)) {
      toast.error('Insufficient stock available');
      return;
    }

    // Store quantity in pieces for consistency
    const quantityInPieces = quantityUnit === 'pieces' ? qty : qty * piecesPerCase;

    setBillLines([...billLines, { product, quantity: quantityInPieces, unit: 'pieces' }]);
    setSelectedProductId('');
    setQuantity('1');
    setQuantityUnit('pieces');
  };

  const handleRemoveLine = (index: number) => {
    setBillLines(billLines.filter((_, i) => i !== index));
  };

  const handleCreateBill = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (billLines.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    try {
      const maxId = bills.reduce((max, b) => {
        const id = Number(b.id);
        return id > max ? id : max;
      }, 0);

      const newBill: Bill = {
        id: BigInt(maxId + 1),
        customerId: BigInt(selectedCustomerId),
        products: billLines.map(line => line.product),
        discount: BigInt(Math.round(discountAmount)),
        creditAmount: BigInt(Math.round(creditAmt)),
        timestamp: BigInt(Date.now()),
        gstApplied,
        gstRate: BigInt(Math.round(parseFloat(gstRate))),
        gstAmount: BigInt(Math.round(totals.gstAmount)),
      };

      await queueAction({
        type: 'createBill',
        payload: newBill,
        execute: () => createBill.mutateAsync(newBill),
      });

      toast.success('Bill created successfully');

      // Reset form
      setSelectedCustomerId('');
      setBillLines([]);
      setDiscount('0');
      setCreditAmount('0');
      setGstApplied(false);
      setGstRate('18');
    } catch (error: any) {
      console.error('Create bill error:', error);
      toast.error('Failed to create bill');
    }
  };

  const recentBills = [...bills]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Create new bills and manage transactions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Bill Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Add Products</Label>
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {products.map((product) => (
                      <SelectItem key={product.id.toString()} value={product.id.toString()}>
                        {product.name} - ₹{Number(product.price)} (Stock: {Number(product.availableInventory)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-24"
                />
                <Select value={quantityUnit} onValueChange={(value: 'pieces' | 'cases') => setQuantityUnit(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="cases">Cases</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddLine} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            {billLines.length > 0 && (
              <div className="space-y-2">
                <Label>Bill Items</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billLines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>{line.product.name}</TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell className="text-right">
                            ₹{(Number(line.product.price) * line.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLine(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (₹)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gst-toggle">Apply GST</Label>
                <Switch
                  id="gst-toggle"
                  checked={gstApplied}
                  onCheckedChange={setGstApplied}
                />
              </div>
              {gstApplied && (
                <Select value={gstRate} onValueChange={setGstRate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {GST_RATES.map((rate) => (
                      <SelectItem key={rate.value} value={rate.value}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit">Credit Amount (₹)</Label>
              <Input
                id="credit"
                type="number"
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="pt-4 space-y-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              {gstApplied && (
                <div className="flex justify-between text-sm">
                  <span>GST ({gstRate}%):</span>
                  <span>₹{totals.gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{totals.finalTotal.toLocaleString()}</span>
              </div>
              {creditAmt > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Credit:</span>
                  <span>₹{creditAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-primary">
                <span>Amount Due:</span>
                <span>₹{(totals.finalTotal - creditAmt).toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={handleCreateBill} className="w-full" size="lg">
              <FileText className="mr-2 h-4 w-4" />
              Create Bill
            </Button>
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bills yet</p>
            ) : (
              <div className="space-y-2">
                {recentBills.map((bill) => {
                  const customer = customers.find(c => c.id === bill.customerId);
                  const billTotal = calculateBillTotal(bill);
                  return (
                    <div
                      key={bill.id.toString()}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{customer?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(Number(bill.timestamp)).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold">₹{billTotal.toLocaleString()}</p>
                        {Number(bill.creditAmount) > 0 && (
                          <p className="text-xs text-amber-600">
                            Credit: ₹{Number(bill.creditAmount).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (customer) {
                            printInvoice(bill, customer);
                          } else {
                            toast.error('Customer not found');
                          }
                        }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
