import { ReactNode } from 'react';
import type { ScreenId } from '../App';
import TopBar from './TopBar';
import SideNav from './SideNav';

interface AppLayoutProps {
  children: ReactNode;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export default function AppLayout({ children, currentScreen, onNavigate }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Side Navigation */}
      <SideNav currentScreen={currentScreen} onNavigate={onNavigate} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children || (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No content available</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-card px-6 py-4">
          <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
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
