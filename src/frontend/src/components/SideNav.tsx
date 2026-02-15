import { useEffect } from 'react';
import type { ScreenId } from '../App';
import { LayoutDashboard, Package, FileText, Users, CreditCard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SideNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const navItems: Array<{ id: ScreenId; label: string; icon: any }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'credits', label: 'Credits', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const STORAGE_KEY = 'frontline-last-screen';

export default function SideNav({ currentScreen, onNavigate }: SideNavProps) {
  // Persist last selected screen
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentScreen);
    } catch (error) {
      console.error('Failed to persist screen selection:', error);
    }
  }, [currentScreen]);

  // Restore last selected screen on mount
  useEffect(() => {
    try {
      const lastScreen = localStorage.getItem(STORAGE_KEY) as ScreenId | null;
      if (lastScreen && navItems.some(item => item.id === lastScreen)) {
        onNavigate(lastScreen);
      }
    } catch (error) {
      console.error('Failed to restore screen selection:', error);
    }
  }, [onNavigate]);

  return (
    <aside className="w-64 border-r bg-card">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className="justify-start gap-3"
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
