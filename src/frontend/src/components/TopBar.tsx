import { useState } from 'react';
import { usePasswordAuth } from '../auth/passwordAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import SyncIndicator from './SyncIndicator';
import { useQueryClient } from '@tanstack/react-query';

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { logout, isAuthenticated } = usePasswordAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo/Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate">
            Frontline Distributors
          </h1>
        </div>

        {/* Sync indicator - compact on mobile */}
        <div className="flex-shrink-0">
          <SyncIndicator />
        </div>

        {/* User profile or logout button - always visible when authenticated */}
        {isAuthenticated && (
          <div className="relative flex-shrink-0">
            {userProfile ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 sm:gap-2 px-2 sm:px-3"
                  onClick={() => setShowProfile(!showProfile)}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {userProfile.name}
                  </span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                {showProfile && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfile(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-2 shadow-lg z-50">
                      <div className="px-3 py-2 border-b mb-2">
                        <p className="font-medium text-sm">{userProfile.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userProfile.role}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Return to Login</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
