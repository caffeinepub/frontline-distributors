import { useGetAllProducts, useGetAllCustomers, useGetAllBills } from '../hooks/useQueries';
import { useSyncStatus } from '../offline/useSyncStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, FileText, CreditCard } from 'lucide-react';

export default function DashboardScreen() {
  const { data: products = [], isLoading: productsLoading } = useGetAllProducts();
  const { data: customers = [], isLoading: customersLoading } = useGetAllCustomers();
  const { data: bills = [], isLoading: billsLoading } = useGetAllBills();
  const { pendingCount } = useSyncStatus();

  // Calculate total credit amount from bills
  const totalCredits = bills.reduce((sum, bill) => sum + Number(bill.creditAmount), 0);

  const stats = [
    {
      title: 'Total Products',
      value: products.length,
      icon: Package,
      loading: productsLoading,
    },
    {
      title: 'Total Customers',
      value: customers.length,
      icon: Users,
      loading: customersLoading,
    },
    {
      title: 'Total Bills',
      value: bills.length,
      icon: FileText,
      loading: billsLoading,
    },
    {
      title: 'Total Credits',
      value: `₹${totalCredits.toLocaleString()}`,
      icon: CreditCard,
      loading: billsLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your inventory and business operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sync Status Card */}
      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Pending Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You have {pendingCount} pending change{pendingCount !== 1 ? 's' : ''} waiting to sync.
              Changes will be synchronized automatically when you're back online.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Stock Products</span>
              <span className="font-medium">
                {products.filter(p => Number(p.availableInventory) < 10).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bills This Session</span>
              <span className="font-medium">{bills.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Customers</span>
              <span className="font-medium">{customers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
