import { useGetAllBills, useGetAllCustomers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CreditsScreen() {
  const { data: bills = [], isLoading: billsLoading } = useGetAllBills();
  const { data: customers = [], isLoading: customersLoading } = useGetAllCustomers();

  // Calculate credit summary per customer
  const creditSummary = customers.map(customer => {
    const customerBills = bills.filter(b => b.customerId === customer.id);
    const totalCredit = customerBills.reduce((sum, bill) => sum + Number(bill.creditAmount), 0);
    const billCount = customerBills.length;

    return {
      customer,
      totalCredit,
      billCount,
      hasPending: totalCredit > 0,
    };
  }).filter(summary => summary.billCount > 0);

  const isLoading = billsLoading || customersLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Credits</h2>
        <p className="text-muted-foreground">
          Track customer credit balances and payment status
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Credit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : creditSummary.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No credit records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Total Bills</TableHead>
                  <TableHead>Credit Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditSummary.map(summary => (
                  <TableRow key={summary.customer.id.toString()}>
                    <TableCell className="font-medium">{summary.customer.name}</TableCell>
                    <TableCell>{summary.customer.phoneNumber}</TableCell>
                    <TableCell>{summary.billCount}</TableCell>
                    <TableCell className="font-medium">
                      ₹{summary.totalCredit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={summary.hasPending ? 'destructive' : 'default'}>
                        {summary.hasPending ? 'Pending' : 'Paid'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Customers with Credit</p>
              <p className="text-2xl font-bold">
                {creditSummary.filter(s => s.hasPending).length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Credit Amount</p>
              <p className="text-2xl font-bold">
                ₹{creditSummary.reduce((sum, s) => sum + s.totalCredit, 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Bills with Credit</p>
              <p className="text-2xl font-bold">
                {bills.filter(b => Number(b.creditAmount) > 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
