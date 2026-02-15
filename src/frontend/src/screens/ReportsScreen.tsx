import { useState, useMemo } from 'react';
import { useGetAllBills, useGetAllProducts, useGetAllExpenses, useGetAllCustomers, useCreateExpense, useDeleteExpense } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Expense } from '../backend';
import { toast } from 'sonner';
import { getDailySales, getDateRangeSummary, calculateProfit } from '../utils/reporting';

const EXPENSE_CATEGORIES = [
  'Diesel',
  'Maintenance',
  'Salary',
  'Food',
  'Utilities',
  'Rent',
  'Other',
];

export default function ReportsScreen() {
  const { data: bills = [] } = useGetAllBills();
  const { data: products = [] } = useGetAllProducts();
  const { data: expenses = [] } = useGetAllExpenses();
  const { data: customers = [] } = useGetAllCustomers();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const { queueAction } = useOfflineQueue();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Other');
  const [dateRangeStart, setDateRangeStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateRangeEnd, setDateRangeEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Calculate daily sales
  const dailySales = useMemo(() => getDailySales(bills, customers), [bills, customers]);

  // Calculate date range summary
  const summary = useMemo(() => {
    const start = new Date(dateRangeStart).getTime();
    const end = new Date(dateRangeEnd).getTime() + 86400000; // Add 1 day to include end date
    return getDateRangeSummary(bills, expenses, start, end);
  }, [bills, expenses, dateRangeStart, dateRangeEnd]);

  // Calculate profit
  const profitData = useMemo(() => {
    const start = new Date(dateRangeStart).getTime();
    const end = new Date(dateRangeEnd).getTime() + 86400000;
    return calculateProfit(bills, products, expenses, start, end);
  }, [bills, products, expenses, dateRangeStart, dateRangeEnd]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount (non-negative)');
      return;
    }

    try {
      const maxId = expenses.reduce((max, exp) => {
        const id = Number(exp.id);
        return id > max ? id : max;
      }, 0);

      const newExpense: Expense = {
        id: BigInt(maxId + 1),
        description: expenseDescription.trim(),
        amount: BigInt(Math.round(amount)),
        category: expenseCategory,
        timestamp: BigInt(Date.now()),
      };

      await queueAction({
        type: 'createExpense',
        payload: newExpense,
        execute: () => createExpense.mutateAsync(newExpense),
      });

      toast.success('Expense added successfully');
      setExpenseDialogOpen(false);
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseCategory('Other');
    } catch (error: any) {
      console.error('Create expense error:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: bigint) => {
    try {
      await queueAction({
        type: 'deleteExpense',
        payload: expenseId,
        execute: () => deleteExpense.mutateAsync(expenseId),
      });
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          View sales, profit, expenses, and business insights
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.billCount} bills
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">₹{summary.totalDiscounts.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GST Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary.totalGST.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">₹{summary.totalCredits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">₹{summary.totalExpenses.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{profitData.netProfit.toLocaleString()}
                </div>
                {profitData.hasMissingCosts && (
                  <p className="text-xs text-amber-600 mt-1">
                    Some products missing cost data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Sales Tab */}
        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Bills</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{day.billCount}</TableCell>
                        <TableCell className="text-right">₹{day.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-amber-600">₹{day.totalCredits.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profitData.hasMissingCosts && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some products are missing cost data. Profit calculations may be incomplete. Please update product costs in the Products screen.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total Revenue</span>
                  <span className="text-lg font-bold">₹{profitData.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Cost of Goods Sold (COGS)</span>
                  <span className="text-lg font-bold text-destructive">₹{profitData.totalCOGS.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Gross Profit</span>
                  <span className={`text-lg font-bold ${profitData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profitData.grossProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total Expenses</span>
                  <span className="text-lg font-bold text-destructive">₹{profitData.totalExpenses.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                  <span className="font-bold text-lg">Net Profit</span>
                  <span className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profitData.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <Button onClick={() => setExpenseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...expenses]
                      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                      .map((expense) => (
                        <TableRow key={expense.id.toString()}>
                          <TableCell>
                            {new Date(Number(expense.timestamp)).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right">₹{Number(expense.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (₹)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
