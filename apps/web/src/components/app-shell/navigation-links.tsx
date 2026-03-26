'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BanknoteArrowDown,
  ClipboardList,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  RefreshCcw,
  Users,
} from 'lucide-react';
import type { NavigationIconKey, NavigationItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface NavigationLinksProps {
  items: NavigationItem[];
  onNavigate?: () => void;
}

const navigationIcons: Record<NavigationIconKey, ComponentType<{ className?: string }>> = {
  assistant: MessageSquareText,
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  returns: RefreshCcw,
  'my-finance': ReceiptText,
  'admin-finance': BanknoteArrowDown,
  users: Users,
};

export function NavigationLinks({ items, onNavigate }: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
        const Icon = navigationIcons[item.iconKey];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
