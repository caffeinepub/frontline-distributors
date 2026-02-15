import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface LoginScreenProps {
  showProfileSetup?: boolean;
}

export default function LoginScreen({ showProfileSetup = false }: LoginScreenProps) {
  const { login, loginStatus, isLoggingIn } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<'Owner' | 'Salesman'>('Salesman');

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
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
      toast.error('Failed to create profile. Please try again.');
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
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Sign in with Internet Identity to access your account
            </p>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </Button>
          {loginStatus === 'loginError' && (
            <p className="text-sm text-destructive text-center">
              Login failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
