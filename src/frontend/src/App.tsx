import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useStartupWatchdog } from './hooks/useStartupWatchdog';
import { BUILD_ID } from './utils/buildInfo';
import { resetCachedApp } from './utils/resetCachedApp';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProductsScreen from './screens/ProductsScreen';
import BillingScreen from './screens/BillingScreen';
import CustomersScreen from './screens/CustomersScreen';
import CreditsScreen from './screens/CreditsScreen';
import ReportsScreen from './screens/ReportsScreen';
import AppLayout from './components/AppLayout';
import AppStartupError from './components/AppStartupError';
import { Toaster } from '@/components/ui/sonner';

// Screen navigation model
export type ScreenId = 'dashboard' | 'products' | 'billing' | 'customers' | 'credits' | 'reports';

const BUILD_ID_KEY = 'app_build_id';
const BUILD_RESET_FLAG = 'app_build_reset_in_progress';

function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');

  // Detect new deployment and trigger cache reset
  useEffect(() => {
    const checkBuildVersion = async () => {
      try {
        // Check if we're already in the middle of a reset to avoid loops
        const resetInProgress = sessionStorage.getItem(BUILD_RESET_FLAG);
        if (resetInProgress === 'true') {
          console.log('[Build Check] Reset already in progress, skipping');
          sessionStorage.removeItem(BUILD_RESET_FLAG);
          return;
        }

        const storedBuildId = localStorage.getItem(BUILD_ID_KEY);
        
        if (storedBuildId && storedBuildId !== BUILD_ID) {
          console.log(`[Build Check] New deployment detected: ${storedBuildId} → ${BUILD_ID}`);
          
          // Set flag to prevent reload loops
          sessionStorage.setItem(BUILD_RESET_FLAG, 'true');
          
          // Perform cache reset
          await resetCachedApp();
          
          // Update stored build ID
          localStorage.setItem(BUILD_ID_KEY, BUILD_ID);
          
          // The resetCachedApp function will reload the page
        } else if (!storedBuildId) {
          // First run, just store the build ID
          console.log(`[Build Check] First run, storing build ID: ${BUILD_ID}`);
          localStorage.setItem(BUILD_ID_KEY, BUILD_ID);
        } else {
          console.log(`[Build Check] Build ID matches: ${BUILD_ID}`);
        }
      } catch (error) {
        console.error('[Build Check] Error checking build version:', error);
        // Don't block app startup on build check errors
      }
    };

    checkBuildVersion();
  }, []);

  // Determine authentication state
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
  const showApp = isAuthenticated && !profileLoading && isFetched && userProfile !== null;

  // Determine startup phase for diagnostics
  let startupPhase = 'Unknown';
  if (isInitializing) {
    startupPhase = 'Initializing identity';
  } else if (isAuthenticated && !isFetched) {
    startupPhase = 'Fetching user profile';
  } else if (isAuthenticated && profileLoading) {
    startupPhase = 'Loading profile data';
  } else if (showProfileSetup) {
    startupPhase = 'Profile setup required';
  } else if (showApp) {
    startupPhase = 'Ready';
  }

  // Determine if we're in a loading state
  const isLoadingState = isInitializing || (isAuthenticated && !isFetched);

  // Start watchdog
  const { watchdogTriggered, capturedDiagnostics } = useStartupWatchdog({
    isLoading: isLoadingState,
    diagnostics: {
      phase: startupPhase,
      isInitializing,
      isAuthenticated,
      isFetched,
      profileLoading,
    },
    timeoutMs: 15000, // 15 seconds
  });

  // Show watchdog error if triggered
  if (watchdogTriggered) {
    return (
      <>
        <AppStartupError
          error={new Error('Application startup timeout')}
          onRetry={() => window.location.reload()}
          diagnostics={capturedDiagnostics}
          isWatchdogTimeout={true}
        />
        <Toaster />
      </>
    );
  }

  // Show loading state during initialization
  if (isLoadingState) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (isAuthenticated && profileError) {
    return (
      <>
        <AppStartupError
          error={profileError}
          onRetry={() => window.location.reload()}
        />
        <Toaster />
      </>
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

  // Fallback: should never reach here, but show loading instead of null
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    </div>
  );
}

export default App;
