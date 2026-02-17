import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Trash2, LogOut } from 'lucide-react';
import { normalizeAuthError } from '../utils/authErrors';
import { resetCachedApp } from '../utils/resetCachedApp';

interface AppStartupErrorProps {
  error: Error;
  onRetry: () => void;
  onClearAuth?: () => void;
  diagnostics?: Record<string, any>;
  isWatchdogTimeout?: boolean;
  compact?: boolean;
}

export default function AppStartupError({
  error,
  onRetry,
  onClearAuth,
  diagnostics,
  isWatchdogTimeout = false,
  compact = false,
}: AppStartupErrorProps) {
  const normalizedError = normalizeAuthError(error);
  const isAuthError = normalizedError.toLowerCase().includes('unauthorized') ||
                      normalizedError.toLowerCase().includes('access denied') ||
                      normalizedError.toLowerCase().includes('permission') ||
                      normalizedError.toLowerCase().includes('admin');

  const handleClearCachesAndReload = async () => {
    await resetCachedApp();
  };

  const handleClearSessionAndReturnToLogin = () => {
    if (onClearAuth) {
      onClearAuth();
    }
  };

  if (compact) {
    // Compact mode for embedding in other screens (e.g., LoginScreen)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div className="font-medium">
            {isWatchdogTimeout ? 'Startup Timeout' : isAuthError ? 'Access Denied' : 'Connection Error'}
          </div>
          <div className="text-sm">{normalizedError}</div>
          
          {diagnostics && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer hover:underline">
                Technical Details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words bg-muted/50 p-2 rounded">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
            <Button size="sm" onClick={handleClearCachesAndReload} variant="outline">
              <Trash2 className="mr-2 h-3 w-3" />
              Clear Cache
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Full-page mode (original behavior)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl font-bold">
              {isWatchdogTimeout ? 'Startup Timeout' : isAuthError ? 'Access Denied' : 'Startup Error'}
            </CardTitle>
          </div>
          <CardDescription>
            {isWatchdogTimeout
              ? 'The application took too long to start. This might be a temporary issue.'
              : isAuthError
              ? 'You do not have permission to access this application.'
              : 'An error occurred while starting the application.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-sm break-words">
              {normalizedError}
            </AlertDescription>
          </Alert>

          {isAuthError && (
            <Alert>
              <AlertDescription className="text-sm">
                If you believe you should have access, please contact the application administrator.
                You can also try clearing your session and logging in again.
              </AlertDescription>
            </Alert>
          )}

          {diagnostics && (
            <details className="rounded-md border p-3 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={handleClearCachesAndReload}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cache
              </Button>
            </div>
            {onClearAuth && (
              <Button
                variant="outline"
                onClick={handleClearSessionAndReturnToLogin}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Clear Session & Return to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
