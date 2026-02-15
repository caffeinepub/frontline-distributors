import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, User, Download } from 'lucide-react';
import SyncIndicator from './SyncIndicator';
import { toast } from 'sonner';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function TopBar() {
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { isInstallable, promptInstall } = usePWAInstall();

  const handleLogout = async () => {
    try {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleInstall = async () => {
    try {
      await promptInstall();
      toast.success('App installation prompt shown');
    } catch (error) {
      console.error('Install error:', error);
      toast.info('To install, use your browser\'s "Add to Home Screen" option');
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Frontline Distributors</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sync Indicator */}
          <SyncIndicator />
          
          {/* Install App Button - PWA only */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Add to Home Screen
            </Button>
          )}
          
          {/* User Info */}
          {userProfile && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{userProfile.name}</div>
                <div className="text-xs text-muted-foreground">{userProfile.role}</div>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
