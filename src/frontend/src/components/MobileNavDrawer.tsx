import type { ScreenId } from '../App';
import { LayoutDashboard, Package, FileText, Users, CreditCard, BarChart3 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function MobileNavDrawer({ open, onOpenChange, currentScreen, onNavigate }: MobileNavDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-64 p-0 !bg-background border-r !opacity-100"
      >
        <SheetHeader className="p-4 border-b !bg-background !opacity-100">
          <SheetTitle className="!text-foreground !opacity-100">Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4 !bg-background !opacity-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className="justify-start gap-3 !opacity-100"
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="h-5 w-5 !opacity-100" />
                <span className="!opacity-100">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
