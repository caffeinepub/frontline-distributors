import { AlertCircle, RefreshCw, AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetCachedApp } from '@/utils/resetCachedApp';
import { normalizeAuthError } from '@/utils/authErrors';
import type { StartupDiagnostics } from '@/hooks/useStartupWatchdog';

interface AppStartupErrorProps {
  error: Error | unknown;
  onRetry: () => void;
  onClearAuth?: () => void;
  diagnostics?: StartupDiagnostics | null;
  isWatchdogTimeout?: boolean;
}

export default function AppStartupError({ 
  error, 
  onRetry, 
  onClearAuth,
  diagnostics,
  isWatchdogTimeout = false 
}: AppStartupErrorProps) {
  const rawErrorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorMessage = normalizeAuthError(rawErrorMessage);
  
  // Check if this is an authorization error
  const isAuthError = rawErrorMessage.includes('Unauthorized') || 
                      rawErrorMessage.includes('Only admins') || 
                      rawErrorMessage.includes('Only users');
  
  const handleResetCache = async () => {
    await resetCachedApp();
  };

  const handleClearAuthAndReturnToLogin = () => {
    if (onClearAuth) {
      onClearAuth();
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              {isWatchdogTimeout ? (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              ) : (
                <AlertCircle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">
                {isWatchdogTimeout ? 'Startup Timeout' : isAuthError ? 'Access Denied' : 'Startup Error'}
              </CardTitle>
              <CardDescription>
                {isWatchdogTimeout 
                  ? 'The application took too long to start'
                  : isAuthError 
                  ? 'You do not have permission to access this application'
                  : 'An error occurred during startup'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={isAuthError ? "destructive" : "default"}>
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {isAuthError && (
            <Alert>
              <AlertDescription className="text-sm">
                This application requires admin or user privileges. Please contact the application owner if you believe you should have access.
              </AlertDescription>
            </Alert>
          )}

          {isWatchdogTimeout && diagnostics && (
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-semibold text-muted-foreground">Diagnostic Information:</p>
              <p><span className="font-medium">Phase:</span> {diagnostics.phase}</p>
              <p><span className="font-medium">Authenticated:</span> {diagnostics.isAuthenticated ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Profile Fetched:</span> {diagnostics.isFetched ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Profile Loading:</span> {diagnostics.profileLoading ? 'Yes' : 'No'}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handleResetCache} variant="outline" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
          </div>
          {onClearAuth && (
            <Button 
              onClick={handleClearAuthAndReturnToLogin} 
              variant="secondary" 
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Clear Session & Return to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
