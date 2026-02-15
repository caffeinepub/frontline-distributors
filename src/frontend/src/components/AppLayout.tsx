import { ReactNode, useState } from 'react';
import type { ScreenId } from '../App';
import TopBar from './TopBar';
import SideNav from './SideNav';
import MobileNavDrawer from './MobileNavDrawer';

interface AppLayoutProps {
  children: ReactNode;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export default function AppLayout({ children, currentScreen, onNavigate }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMobileNavigate = (screen: ScreenId) => {
    onNavigate(screen);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Side Navigation - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <SideNav currentScreen={currentScreen} onNavigate={onNavigate} />
      </div>
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        currentScreen={currentScreen}
        onNavigate={handleMobileNavigate}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <TopBar onMobileMenuClick={() => setMobileNavOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children || (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No content available</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-card px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <div className="mx-auto max-w-7xl text-center text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Frontline Distributors • Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
