import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProductsScreen from './screens/ProductsScreen';
import BillingScreen from './screens/BillingScreen';
import CustomersScreen from './screens/CustomersScreen';
import CreditsScreen from './screens/CreditsScreen';
import ReportsScreen from './screens/ReportsScreen';
import AppLayout from './components/AppLayout';
import { Toaster } from '@/components/ui/sonner';

// Screen navigation model
export type ScreenId = 'dashboard' | 'products' | 'billing' | 'customers' | 'credits' | 'reports';

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');

  // Determine authentication state
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showApp = isAuthenticated && !profileLoading && isFetched && userProfile !== null;

  // Show loading state during initialization
  if (isInitializing || (isAuthenticated && !isFetched)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated or profile setup needed
  if (!isAuthenticated || showProfileSetup) {
    return (
      <>
        <LoginScreen showProfileSetup={showProfileSetup} />
        <Toaster />
      </>
    );
  }

  // Show main app when authenticated and profile exists
  if (showApp) {
    return (
      <>
        <AppLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          {currentScreen === 'dashboard' && <DashboardScreen />}
          {currentScreen === 'products' && <ProductsScreen />}
          {currentScreen === 'billing' && <BillingScreen />}
          {currentScreen === 'customers' && <CustomersScreen />}
          {currentScreen === 'credits' && <CreditsScreen />}
          {currentScreen === 'reports' && <ReportsScreen />}
        </AppLayout>
        <Toaster />
      </>
    );
  }

  return null;
}

export default App;
