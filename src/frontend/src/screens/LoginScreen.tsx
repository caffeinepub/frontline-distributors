import { useState, useRef, useEffect } from 'react';
import { usePasswordAuth } from '../auth/passwordAuth';
import { useLoginAsOwner, useLoginAsSalesman, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useActorStatus } from '../hooks/useActorStatus';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Trash2, AlertCircle, LogOut, ArrowLeft, Info, XCircle } from 'lucide-react';
import { normalizeAuthError } from '../utils/authErrors';
import { resetCachedApp } from '../utils/resetCachedApp';
import { clearSessionParameter } from '../utils/urlParams';
import { useQueryClient } from '@tanstack/react-query';

interface LoginScreenProps {
  showProfileSetup?: boolean;
  onReturnToLogin?: () => void;
}

export default function LoginScreen({ showProfileSetup = false, onReturnToLogin }: LoginScreenProps) {
  const { login: setPasswordAuth, logout: clearPasswordAuth, isAuthenticated, role: sessionRole } = usePasswordAuth();
  const { status: actorStatus, error: actorError, diagnostics, retry: retryActor } = useActorStatus();
  const { clear: clearIdentity } = useInternetIdentity();
  const loginAsOwner = useLoginAsOwner();
  const loginAsSalesman = useLoginAsSalesman();
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();
  
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<'Owner' | 'Salesman'>('Salesman');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'salesman'>('salesman');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const loginInProgressRef = useRef(false);

  // Initialize profile role from session role when showing profile setup
  useEffect(() => {
    if (showProfileSetup && sessionRole) {
      // Map session role (lowercase) to profile role (capitalized)
      const mappedRole = sessionRole === 'owner' ? 'Owner' : 'Salesman';
      setProfileRole(mappedRole);
    }
  }, [showProfileSetup, sessionRole]);

  // Actor is ready when status is 'ready'
  const isActorReady = actorStatus === 'ready';
  const isActorError = actorStatus === 'error';
  const isActorInitializing = actorStatus === 'initializing';
  
  // Login button is disabled only during login attempt or if actor doesn't exist yet
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
      if (isActorError) {
        toast.error('Cannot login: Server connection failed. Please retry connection.');
      } else {
        toast.error('Connecting to server, please wait...');
      }
      return;
    }

    // Capture the role at the moment of click/Enter
    const roleForThisAttempt = selectedRole;

    setIsLoggingIn(true);
    loginInProgressRef.current = true;

    try {
      // Clear any stale auth state before attempting login
      clearPasswordAuth();
      queryClient.clear();

      let result;
      if (roleForThisAttempt === 'owner') {
        result = await loginAsOwner.mutateAsync(password);
      } else {
        result = await loginAsSalesman.mutateAsync(password);
      }

      // Only persist auth state if backend login succeeded
      if (result.__kind__ === 'ok') {
        // Backend login succeeded - persist the session role
        setPasswordAuth(roleForThisAttempt);
        
        // Immediately invalidate the profile query to trigger refetch
        await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        
        toast.success(`Logged in as ${roleForThisAttempt === 'owner' ? 'Owner' : 'Salesman'}`);
      } else if (result.__kind__ === 'errorMessage') {
        // Backend returned an error message
        const errorMsg = normalizeAuthError(result.errorMessage);
        toast.error(errorMsg);
        // Ensure auth state remains cleared
        clearPasswordAuth();
      } else {
        // Unexpected result format
        toast.error('Login failed. Please try again.');
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
      // This ensures the UI never stays stuck in a disabled state
      setIsLoggingIn(false);
      loginInProgressRef.current = false;
    }
  };

  const handleRetryConnection = () => {
    toast.info('Retrying connection...');
    retryActor();
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

  const handleContinueWithoutAdminToken = async () => {
    toast.info('Clearing admin token and retrying...');
    // Clear the admin token from session storage
    clearSessionParameter('caffeineAdminToken');
    // Clear Internet Identity state to force anonymous actor
    await clearIdentity();
    // Clear all cached queries
    queryClient.clear();
    // Retry actor initialization
    retryActor();
  };

  const handleReturnToLogin = () => {
    if (onReturnToLogin) {
      onReturnToLogin();
    }
  };

  const handleProfileSetup = async () => {
    if (!profileName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // Validate that profile role matches session role
    if (sessionRole) {
      const expectedRole = sessionRole === 'owner' ? 'Owner' : 'Salesman';
      if (profileRole !== expectedRole) {
        toast.error(`Profile role must match your login role (${expectedRole}). Please return to login and try again.`);
        return;
      }
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
    // Determine the locked role based on session
    const lockedRole = sessionRole === 'owner' ? 'Owner' : 'Salesman';
    
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
              <Label htmlFor="profile-name">Your Name</Label>
              <Input
                id="profile-name"
                type="text"
                placeholder="Enter your name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProfileSetup();
                  }
                }}
                disabled={saveProfile.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-role">Role</Label>
              <Select
                value={profileRole}
                onValueChange={(value) => setProfileRole(value as 'Owner' | 'Salesman')}
                disabled={true}
              >
                <SelectTrigger id="profile-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Salesman">Salesman</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Role is locked to match your login session ({lockedRole})
              </p>
            </div>

            <Button
              onClick={handleProfileSetup}
              disabled={saveProfile.isPending}
              className="w-full"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>

            {onReturnToLogin && (
              <Button
                variant="outline"
                onClick={handleReturnToLogin}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Detect if the error is likely related to missing/invalid admin token
  const isLikelyTokenError = actorError && (
    actorError.message.toLowerCase().includes('secret') ||
    actorError.message.toLowerCase().includes('token') ||
    actorError.message.toLowerCase().includes('initialize') ||
    !diagnostics.hasAdminToken
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Frontline Distributors</CardTitle>
          <CardDescription>
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actor initialization status */}
          {isActorInitializing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Connecting to server...
              </AlertDescription>
            </Alert>
          )}

          {/* Actor initialization error */}
          {isActorError && actorError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">Failed to connect to server</div>
                <div className="text-sm">{normalizeAuthError(actorError)}</div>
                
                {/* Technical details toggle */}
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="text-xs underline hover:no-underline mt-2 block"
                >
                  {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                </button>
                
                {showTechnicalDetails && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs font-mono space-y-1">
                    <div><strong>Status:</strong> {diagnostics.queryStatus}</div>
                    <div><strong>Has Admin Token:</strong> {diagnostics.hasAdminToken ? 'Yes' : 'No'}</div>
                    <div><strong>Identity:</strong> {diagnostics.identityPrincipal || 'Anonymous'}</div>
                    {diagnostics.errorMessage && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <strong>Error:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-words">
                          {diagnostics.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoginButtonDisabled) {
                  handleLogin();
                }
              }}
              disabled={isLoggingIn}
            />
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Owner password: <strong>24161852</strong> | Salesman password: <strong>12345</strong>
              </p>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoginButtonDisabled}
            className="w-full"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Having trouble?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryConnection}
                disabled={isLoggingIn}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
              
              {isLikelyTokenError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContinueWithoutAdminToken}
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Continue Without Admin Token
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSession}
                disabled={isLoggingIn}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Clear Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCachesAndReload}
                disabled={isLoggingIn}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Caches & Reload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
