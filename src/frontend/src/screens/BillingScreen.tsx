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

    setBillLines([...billLines, { product, quantity: qty, unit: quantityUnit }]);
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

    // Validate credit amount against final total (including GST)
    if (creditAmt > totals.finalTotal) {
      toast.error('Credit amount cannot exceed total');
      return;
    }

    try {
      // Generate unique bill ID
      const maxId = bills.reduce((max, b) => {
        const id = Number(b.id);
        return id > max ? id : max;
      }, 0);

      // Expand products by computed piece count for storage
      const expandedProducts: Product[] = [];
      billLines.forEach(line => {
        const piecesPerCase = Number(line.product.piecesPerCase) || 1;
        const requiredPieces = line.unit === 'pieces' ? line.quantity : line.quantity * piecesPerCase;
        
        // Add the product requiredPieces times
        for (let i = 0; i < requiredPieces; i++) {
          expandedProducts.push(line.product);
        }
      });

      const newBill: Bill = {
        id: BigInt(maxId + 1),
        customerId: BigInt(selectedCustomerId),
        products: expandedProducts,
        discount: BigInt(Math.round(discountAmount)),
        creditAmount: BigInt(Math.round(creditAmt)),
        timestamp: BigInt(Date.now()),
        gstApplied,
        gstRate: BigInt(Math.round(parseFloat(gstRate))),
        gstAmount: BigInt(totals.gstAmount),
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

  const handlePrintBill = (bill: Bill) => {
    const customer = customers.find(c => c.id === bill.customerId);
    if (!customer) {
      toast.error('Customer not found');
      return;
    }
    printInvoice(bill, customer);
  };

  // Sort bills by timestamp descending (most recent first)
  const sortedBills = [...bills].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  const recentBills = sortedBills.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Create new bills and manage transactions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bill Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Add Product</Label>
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id.toString()} value={product.id.toString()}>
                        {product.name} (₹{Number(product.price)}) - Stock: {Number(product.availableInventory)} pcs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-20"
                />
                <Select value={quantityUnit} onValueChange={(value: 'pieces' | 'cases') => setQuantityUnit(value)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="cases">Cases</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddLine} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bill Lines */}
            {billLines.length > 0 && (
              <div className="space-y-2">
                <Label>Items</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billLines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>{line.product.name}</TableCell>
                          <TableCell>
                            {line.quantity} {line.unit === 'cases' ? 'Cases' : 'Pieces'}
                          </TableCell>
                          <TableCell>₹{(Number(line.product.price) * line.quantity).toLocaleString()}</TableCell>
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

            {/* Discount and Credit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit">Credit Amount (₹)</Label>
                <Input
                  id="credit"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* GST Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gst-toggle">Apply GST</Label>
                <Switch
                  id="gst-toggle"
                  checked={gstApplied}
                  onCheckedChange={setGstApplied}
                />
              </div>
              
              {gstApplied && (
                <div className="space-y-2">
                  <Label htmlFor="gst-rate">GST Rate</Label>
                  <Select value={gstRate} onValueChange={setGstRate}>
                    <SelectTrigger id="gst-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map(rate => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toLocaleString()}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="text-destructive">-₹{totals.discount.toLocaleString()}</span>
                </div>
              )}
              {gstApplied && totals.gstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>GST ({gstRate}%):</span>
                  <span>₹{totals.gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₹{totals.finalTotal.toLocaleString()}</span>
              </div>
              {creditAmt > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Credit Amount:</span>
                  <span>₹{creditAmt.toLocaleString()}</span>
                </div>
              )}
              {creditAmt > 0 && (
                <div className="flex justify-between text-sm font-semibold">
                  <span>Amount to Pay:</span>
                  <span>₹{(totals.finalTotal - creditAmt).toLocaleString()}</span>
                </div>
              )}
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
            <div className="space-y-3">
              {recentBills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No bills created yet
                </p>
              ) : (
                recentBills.map(bill => {
                  const customer = customers.find(c => c.id === bill.customerId);
                  const total = calculateBillTotal(bill);
                  
                  return (
                    <div
                      key={bill.id.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{customer?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(Number(bill.timestamp)).toLocaleDateString()} • 
                          {bill.products.length} items
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">₹{total.toLocaleString()}</p>
                          {Number(bill.creditAmount) > 0 && (
                            <p className="text-xs text-amber-600">
                              Credit: ₹{Number(bill.creditAmount).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintBill(bill)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
