import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AppStartupErrorProps {
  error: Error | unknown;
  onRetry: () => void;
}

export default function AppStartupError({ error, onRetry }: AppStartupErrorProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Unable to Start Application</CardTitle>
              <CardDescription>
                We encountered an error while loading your profile
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
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">This could be due to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Network connectivity issues</li>
              <li>Backend service temporarily unavailable</li>
              <li>Browser cache conflicts</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={onRetry} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="w-full"
          >
            Clear Cache & Retry
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
