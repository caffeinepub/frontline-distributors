import { useState } from 'react';
import { useGetAllCustomers, useGetAllProducts, useGetAllBills, useCreateBill, useGetCallerRole } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Printer } from 'lucide-react';
import type { Product, Bill } from '../types/local';
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
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create new bills and manage transactions
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Create Bill Form */}
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
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id.toString()} value={product.id.toString()}>
                          {product.name} - ₹{Number(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={quantityUnit} onValueChange={(v) => setQuantityUnit(v as 'pieces' | 'cases')}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="cases">Cases</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleAddLine} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Add to Bill
              </Button>
            </div>

            {billLines.length > 0 && (
              <div className="space-y-3">
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Product</TableHead>
                          <TableHead className="w-[20%] text-right">Qty</TableHead>
                          <TableHead className="w-[30%] text-right">Amount</TableHead>
                          <TableHead className="w-[10%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billLines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-sm">{line.product.name}</TableCell>
                            <TableCell className="text-right text-sm">{line.quantity}</TableCell>
                            <TableCell className="text-right text-sm">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount (₹)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit">Credit Amount (₹)</Label>
                    <Input
                      id="credit"
                      type="number"
                      min="0"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t pt-3">
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
                          {GST_RATES.map((rate) => (
                            <SelectItem key={rate.value} value={rate.value}>
                              {rate.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Discount:</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {gstApplied && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>GST ({gstRate}%):</span>
                      <span>₹{totals.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{totals.finalTotal.toLocaleString()}</span>
                  </div>
                  {creditAmt > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Credit:</span>
                        <span>₹{creditAmt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base text-primary">
                        <span>Amount Due:</span>
                        <span>₹{Math.max(0, totals.finalTotal - creditAmt).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleCreateBill} className="w-full" size="lg">
                  Create Bill
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No bills created yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => {
                  const customer = customers.find(c => c.id === bill.customerId);
                  const billTotal = calculateBillTotal(bill);
                  
                  return (
                    <div
                      key={bill.id.toString()}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {customer?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(Number(bill.timestamp)).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">₹{billTotal.toLocaleString()}</p>
                          {Number(bill.creditAmount) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Credit: ₹{Number(bill.creditAmount).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => printInvoice(bill, customer || { id: bill.customerId, name: 'Unknown', address: '', phoneNumber: '' })}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
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
