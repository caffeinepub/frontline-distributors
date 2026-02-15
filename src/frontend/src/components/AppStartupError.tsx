import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetCachedApp } from '@/utils/resetCachedApp';
import type { StartupDiagnostics } from '@/hooks/useStartupWatchdog';

interface AppStartupErrorProps {
  error: Error | unknown;
  onRetry: () => void;
  diagnostics?: StartupDiagnostics | null;
  isWatchdogTimeout?: boolean;
}

export default function AppStartupError({ 
  error, 
  onRetry, 
  diagnostics,
  isWatchdogTimeout = false 
}: AppStartupErrorProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  
  const handleResetCache = async () => {
    await resetCachedApp();
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
              <CardTitle>
                {isWatchdogTimeout ? 'Startup Timeout' : 'Unable to Start Application'}
              </CardTitle>
              <CardDescription>
                {isWatchdogTimeout 
                  ? 'The application took too long to load'
                  : 'We encountered an error while loading your profile'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {diagnostics && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Startup Diagnostics:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="font-medium">Phase:</span> {diagnostics.phase}</li>
                <li><span className="font-medium">Identity initializing:</span> {diagnostics.isInitializing ? 'Yes' : 'No'}</li>
                <li><span className="font-medium">Authenticated:</span> {diagnostics.isAuthenticated ? 'Yes' : 'No'}</li>
                <li><span className="font-medium">Profile fetched:</span> {diagnostics.isFetched ? 'Yes' : 'No'}</li>
                <li><span className="font-medium">Profile loading:</span> {diagnostics.profileLoading ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">This could be due to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Network connectivity issues</li>
              <li>Backend service temporarily unavailable</li>
              <li>Browser cache conflicts</li>
              <li>Service worker interference</li>
            </ul>
          </div>

          {isWatchdogTimeout && (
            <Alert>
              <AlertDescription className="text-sm">
                <p className="font-medium mb-2">Try Service Worker Safe Mode:</p>
                <p>
                  If the problem persists, try opening the same URL with <code className="bg-muted px-1 py-0.5 rounded">?nosw=1</code> appended to bypass service worker caching.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Example: <code className="bg-muted px-1 py-0.5 rounded">{window.location.href.split('?')[0]}?nosw=1</code>
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={onRetry} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            variant="outline"
            onClick={handleResetCache}
            className="w-full"
          >
            Clear All Caches & Retry
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
