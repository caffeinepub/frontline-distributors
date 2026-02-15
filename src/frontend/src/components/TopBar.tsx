import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, User, Download, Menu } from 'lucide-react';
import SyncIndicator from './SyncIndicator';
import { toast } from 'sonner';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  onMobileMenuClick?: () => void;
}

export default function TopBar({ onMobileMenuClick }: TopBarProps) {
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
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          {onMobileMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuClick}
              className="md:hidden p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">Frontline Distributors</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {/* Sync Indicator */}
          <div className="hidden sm:block">
            <SyncIndicator />
          </div>
          
          {/* Install App Button - PWA only, hidden on small screens */}
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              className="hidden lg:flex gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden xl:inline">Add to Home Screen</span>
              <span className="xl:hidden">Install</span>
            </Button>
          )}
          
          {/* User Info - Compact on mobile */}
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5 sm:px-3 sm:py-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="text-xs sm:text-sm min-w-0">
                <div className="font-medium truncate max-w-[80px] sm:max-w-none">{userProfile.name}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground hidden md:block">{userProfile.role}</div>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1 sm:gap-2 px-2 sm:px-3"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
