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
import { Plus, Trash2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ResponsiveTableCards, { CardRow } from '../components/ResponsiveTableCards';
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

  const renderDailySalesCard = (day: ReturnType<typeof getDailySales>[0]) => (
    <Card key={day.date}>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-base">{new Date(day.date).toLocaleDateString()}</h3>
        <div className="space-y-1.5">
          <CardRow label="Bills" value={day.billCount} />
          <CardRow label="Gross Sales" value={`₹${day.totalSales.toLocaleString()}`} />
          <CardRow label="Credits" value={`₹${day.totalCredits.toLocaleString()}`} className="text-amber-600" />
        </div>
      </CardContent>
    </Card>
  );

  const renderExpenseCard = (expense: Expense) => (
    <Card key={expense.id.toString()}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base truncate">{expense.description}</h3>
            <p className="text-xs text-muted-foreground">{expense.category}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteExpense(expense.id)}
            className="flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1.5">
          <CardRow label="Amount" value={`₹${Number(expense.amount).toLocaleString()}`} className="font-semibold" />
          <CardRow label="Date" value={new Date(Number(expense.timestamp)).toLocaleDateString()} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View sales, profit, expenses, and business insights
        </p>
      </div>

      <Tabs defaultValue="summary" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily Sales</TabsTrigger>
          <TabsTrigger value="profit" className="text-xs sm:text-sm">Profit</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs sm:text-sm">Expenses</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₹{summary.totalSales.toLocaleString()}</div>
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
                <div className="text-xl sm:text-2xl font-bold text-destructive">₹{summary.totalDiscounts.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GST Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₹{summary.totalGST.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-amber-600">₹{summary.totalCredits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-destructive">₹{summary.totalExpenses.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
        <TabsContent value="daily" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
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
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    <ResponsiveTableCards
                      data={dailySales}
                      renderCard={renderDailySalesCard}
                      emptyMessage="No sales data available"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profitData.hasMissingCosts && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    Some products are missing cost data. Profit calculations may be incomplete. Please update product costs in the Products screen.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm sm:text-base">Total Revenue</span>
                  <span className="text-base sm:text-lg font-bold">₹{profitData.totalRevenue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm sm:text-base">Cost of Goods Sold (COGS)</span>
                  <span className="text-base sm:text-lg font-bold text-destructive">₹{profitData.totalCOGS.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm sm:text-base">Gross Profit</span>
                  <span className={`text-base sm:text-lg font-bold ${profitData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profitData.grossProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm sm:text-base">Total Expenses</span>
                  <span className="text-base sm:text-lg font-bold text-destructive">₹{profitData.totalExpenses.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border-2 border-primary">
                  <span className="font-bold text-base sm:text-lg">Net Profit</span>
                  <span className={`text-xl sm:text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{profitData.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <CardTitle>Expense List</CardTitle>
              <Button onClick={() => setExpenseDialogOpen(true)} size="sm" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses recorded</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id.toString()}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell>₹{Number(expense.amount).toLocaleString()}</TableCell>
                            <TableCell>{new Date(Number(expense.timestamp)).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
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
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    <ResponsiveTableCards
                      data={expenses}
                      renderCard={renderExpenseCard}
                      emptyMessage="No expenses recorded"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="bg-background text-foreground border-border max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input
                id="expense-description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Enter expense description"
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
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setExpenseDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
