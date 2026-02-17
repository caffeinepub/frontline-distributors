import { useState } from 'react';
import { useGetAllBills, useGetAllExpenses, useGetAllCustomers, useGetAllProducts, useCreateExpense, useDeleteExpense, useSyncExpenses, useGetCallerRole } from '../hooks/useQueries';
import { useOfflineQueue } from '../offline/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ResponsiveTableCards, { CardRow } from '../components/ResponsiveTableCards';
import type { Expense } from '../backend';
import { toast } from 'sonner';
import { getDailySales, getDateRangeSummary, calculateProfit } from '../utils/reporting';

const EXPENSE_CATEGORIES = ['Fuel', 'Maintenance', 'Salary', 'Rent', 'Utilities', 'Other'];

export default function ReportsScreen() {
  const { data: bills = [] } = useGetAllBills();
  const { data: expenses = [] } = useGetAllExpenses();
  const { data: customers = [] } = useGetAllCustomers();
  const { data: products = [] } = useGetAllProducts();
  const { data: isAdmin = false } = useGetCallerRole();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const syncExpenses = useSyncExpenses();
  const { queueAction } = useOfflineQueue();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Other');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreateExpense = async () => {
    if (!isAdmin) {
      toast.error('Only admins can create expenses');
      return;
    }

    if (!expenseDescription.trim() || !expenseAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const maxId = expenses.reduce((max, e) => {
        const id = Number(e.id);
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

  const handleDeleteExpense = async (expense: Expense) => {
    if (!isAdmin) {
      toast.error('Only admins can delete expenses');
      return;
    }

    if (!confirm(`Delete expense "${expense.description}"?`)) return;

    try {
      await queueAction({
        type: 'deleteExpense',
        payload: expense.id,
        execute: () => deleteExpense.mutateAsync(expense.id),
      });
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleExportExpenses = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Amount'].join(','),
      ...expenses.map(e => [
        new Date(Number(e.timestamp)).toLocaleDateString(),
        `"${e.description}"`,
        e.category,
        Number(e.amount),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Expenses exported');
  };

  const handleImportExpenses = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast.error('Only admins can import expenses');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      const newExpenses: Expense[] = [];

      const maxId = expenses.reduce((max, e) => Number(e.id) > max ? Number(e.id) : max, 0);
      let nextId = maxId + 1;

      for (const line of lines) {
        if (!line.trim()) continue;
        const [, description, category, amount] = line.split(',');
        if (description && amount) {
          newExpenses.push({
            id: BigInt(nextId++),
            description: description.replace(/"/g, ''),
            category: category || 'Other',
            amount: BigInt(Math.round(parseFloat(amount))),
            timestamp: BigInt(Date.now()),
          });
        }
      }

      if (newExpenses.length > 0) {
        await queueAction({
          type: 'syncExpenses',
          payload: newExpenses,
          execute: () => syncExpenses.mutateAsync(newExpenses),
        });
        toast.success(`Imported ${newExpenses.length} expenses`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import expenses');
    }

    event.target.value = '';
  };

  const dailySales = getDailySales(bills, customers);
  
  // Calculate date range summary
  const startTime = startDate ? new Date(startDate) : new Date(0);
  const endTime = endDate ? new Date(new Date(endDate).getTime() + 86400000) : new Date();
  const summary = getDateRangeSummary(bills, expenses, startTime, endTime);
  const profitData = calculateProfit(bills, products, expenses, startTime.getTime(), endTime.getTime());

  const renderExpenseCard = (expense: Expense) => (
    <Card key={expense.id.toString()}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-base">{expense.description}</h3>
          <span className="text-sm font-medium">₹{Number(expense.amount).toLocaleString()}</span>
        </div>
        <div className="space-y-2">
          <CardRow label="Category" value={expense.category} />
          <CardRow label="Date" value={new Date(Number(expense.timestamp)).toLocaleDateString()} />
        </div>
        {isAdmin && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteExpense(expense)}
              className="w-full gap-2"
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
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View sales reports and manage expenses
        </p>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date Range Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-xl sm:text-2xl font-bold">₹{summary.totalRevenue.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold">₹{summary.totalExpenses.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">COGS</p>
                    <p className="text-xl sm:text-2xl font-bold">₹{profitData.totalCOGS.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-xl sm:text-2xl font-bold">₹{profitData.netProfit.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySales.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No sales data available
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Bills</TableHead>
                          <TableHead className="text-right">Sales</TableHead>
                          <TableHead className="text-right">Credits</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailySales.map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>{day.date}</TableCell>
                            <TableCell className="text-right">{day.billCount}</TableCell>
                            <TableCell className="text-right">₹{day.totalSales.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{day.totalCredits.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {dailySales.map((day) => (
                      <Card key={day.date}>
                        <CardContent className="p-4 space-y-2">
                          <h3 className="font-semibold">{day.date}</h3>
                          <CardRow label="Bills" value={day.billCount} />
                          <CardRow label="Sales" value={`₹${day.totalSales.toLocaleString()}`} />
                          <CardRow label="Credits" value={`₹${day.totalCredits.toLocaleString()}`} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isAdmin && (
              <>
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>
                        Record a new business expense
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="expense-desc">Description</Label>
                        <Input
                          id="expense-desc"
                          placeholder="Enter description"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expense-category">Category</Label>
                        <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                          <SelectTrigger id="expense-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expense-amount">Amount (₹)</Label>
                        <Input
                          id="expense-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => setExpenseDialogOpen(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateExpense} className="w-full sm:w-auto">
                        Add Expense
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleExportExpenses} className="gap-2 w-full sm:w-auto">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
                  <label>
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleImportExpenses}
                    />
                  </label>
                </Button>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense List</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No expenses recorded yet
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id.toString()}>
                            <TableCell>
                              {new Date(Number(expense.timestamp)).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell className="text-right">
                              ₹{Number(expense.amount).toLocaleString()}
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {expenses.map(renderExpenseCard)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
