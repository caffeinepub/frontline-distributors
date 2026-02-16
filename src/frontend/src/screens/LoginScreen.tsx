import { useState, useRef } from 'react';
import { usePasswordAuth } from '../auth/passwordAuth';
import { useLoginAsOwner, useLoginAsSalesman, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Trash2, AlertCircle, LogOut } from 'lucide-react';
import { normalizeAuthError } from '../utils/authErrors';
import { resetCachedApp } from '../utils/resetCachedApp';
import { useQueryClient } from '@tanstack/react-query';

interface LoginScreenProps {
  showProfileSetup?: boolean;
}

export default function LoginScreen({ showProfileSetup = false }: LoginScreenProps) {
  const { login: setPasswordAuth, logout: clearPasswordAuth, isAuthenticated } = usePasswordAuth();
  const { actor, isFetching: actorInitializing } = useActor();
  const loginAsOwner = useLoginAsOwner();
  const loginAsSalesman = useLoginAsSalesman();
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();
  
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<'Owner' | 'Salesman'>('Salesman');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'salesman'>('salesman');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginInProgressRef = useRef(false);

  const isActorReady = !!actor && !actorInitializing;
  // Login button is disabled while actor is initializing OR during login attempt
  const isLoginButtonDisabled = !isActorReady || isLoggingIn;

  const handleLogin = async () => {
    // Guard: prevent double-submission
    if (loginInProgressRef.current) {
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    if (!isActorReady) {
      toast.error('Connecting to server, please wait...');
      return;
    }

    // Capture the role at the moment of click/Enter
    const roleForThisAttempt = selectedRole;

    setIsLoggingIn(true);
    loginInProgressRef.current = true;

    try {
      // Clear any stale auth state before attempting login
      clearPasswordAuth();

      let result;
      if (roleForThisAttempt === 'owner') {
        result = await loginAsOwner.mutateAsync(password);
      } else {
        result = await loginAsSalesman.mutateAsync(password);
      }

      // Only persist auth state if backend login succeeded
      if (result.__kind__ === 'ok') {
        setPasswordAuth(roleForThisAttempt);
        toast.success(`Logged in as ${roleForThisAttempt === 'owner' ? 'Owner' : 'Salesman'}`);
      } else {
        // Backend returned an error message
        const errorMsg = normalizeAuthError(result.errorMessage);
        toast.error(errorMsg);
        // Ensure auth state remains cleared
        clearPasswordAuth();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Normalize the error for user display
      const errorMsg = normalizeAuthError(error);
      toast.error(errorMsg);
      // Ensure auth state is cleared on any exception
      clearPasswordAuth();
    } finally {
      // Always exit loading state and clear the guard, regardless of success or failure
      setIsLoggingIn(false);
      loginInProgressRef.current = false;
    }
  };

  const handleRetryConnection = () => {
    toast.info('Retrying connection...');
    // Force a page reload to re-initialize the actor
    window.location.reload();
  };

  const handleClearCachesAndReload = async () => {
    toast.info('Clearing caches and reloading...');
    await resetCachedApp();
  };

  const handleClearSession = () => {
    toast.info('Clearing saved session...');
    clearPasswordAuth();
    queryClient.clear();
    // Reset form
    setPassword('');
    setSelectedRole('salesman');
  };

  const handleProfileSetup = async () => {
    if (!profileName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: profileName.trim(),
        role: profileRole,
      });
      toast.success('Profile created successfully!');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      const errorMsg = normalizeAuthError(error);
      toast.error(errorMsg);
    }
  };

  if (showProfileSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                disabled={saveProfile.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={profileRole}
                onValueChange={(value) => setProfileRole(value as 'Owner' | 'Salesman')}
                disabled={saveProfile.isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Salesman">Salesman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleProfileSetup}
              disabled={saveProfile.isPending}
              className="w-full"
            >
              {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Frontline Distributors
          </CardTitle>
          <CardDescription className="text-base">
            Inventory, Billing & Credit Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actorInitializing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting to server...</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {actorInitializing && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryConnection}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCachesAndReload}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Caches
                </Button>
              </div>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSession}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Clear Saved Session
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Login As</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as 'owner' | 'salesman')}
              disabled={isLoggingIn}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="salesman">Salesman</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoginButtonDisabled) {
                  handleLogin();
                }
              }}
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoginButtonDisabled}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging In...
              </>
            ) : actorInitializing ? (
              'Connecting...'
            ) : (
              'Login'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
