import type { ScreenId } from '../App';
import { LayoutDashboard, Package, FileText, Users, CreditCard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SideNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const navItems: Array<{ id: ScreenId; label: string; icon: any }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'billing', label: 'Billing', icon: FileText },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'credits', label: 'Credits', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export default function SideNav({ currentScreen, onNavigate }: SideNavProps) {
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
