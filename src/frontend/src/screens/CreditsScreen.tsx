import { useGetAllBills, useGetAllCustomers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import ResponsiveTableCards, { CardRow } from '../components/ResponsiveTableCards';

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

  const renderCreditCard = (summary: typeof creditSummary[0]) => (
    <Card key={summary.customer.id.toString()}>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-base">{summary.customer.name}</h3>
          <Badge variant={summary.hasPending ? 'destructive' : 'default'}>
            {summary.hasPending ? 'Pending' : 'Paid'}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardRow label="Phone" value={summary.customer.phoneNumber} />
          <CardRow label="Total Bills" value={summary.billCount} />
          <CardRow 
            label="Credit Amount" 
            value={`₹${summary.totalCredit.toLocaleString()}`}
            className="font-semibold"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Credits</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
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
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <ResponsiveTableCards
                  data={creditSummary}
                  renderCard={renderCreditCard}
                  emptyMessage="No credit records found"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1 p-3 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Customers with Credit</p>
              <p className="text-xl sm:text-2xl font-bold">
                {creditSummary.filter(s => s.hasPending).length}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Credit Amount</p>
              <p className="text-xl sm:text-2xl font-bold">
                ₹{creditSummary.reduce((sum, s) => sum + s.totalCredit, 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 p-3 bg-muted rounded-lg sm:col-span-2 md:col-span-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Bills with Credit</p>
              <p className="text-xl sm:text-2xl font-bold">
                {bills.filter(b => Number(b.creditAmount) > 0).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
