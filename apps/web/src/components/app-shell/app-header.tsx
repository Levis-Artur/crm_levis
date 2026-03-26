'use client';

import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import type { AuthenticatedUser } from '@/lib/auth/types';
import { getRoleLabel, t } from '@/lib/i18n';
import type { NavigationItem } from '@/lib/navigation';
import { getNavigationTitle } from '@/lib/navigation';
import { getUserDisplayName } from '@/lib/auth/user';
import { LogoutButton } from './logout-button';
import { MobileNav } from './mobile-nav';

interface AppHeaderProps {
  user: AuthenticatedUser;
  items: NavigationItem[];
}

export function AppHeader({ user, items }: AppHeaderProps) {
  const pathname = usePathname();
  const title = getNavigationTitle(pathname, user.roleCode);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <MobileNav user={user} items={items} />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t.app.crmWorkspace}
          </p>
          <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
            <p className="text-xs text-muted-foreground">
              {user.phone ?? getRoleLabel(user.roleCode)}
            </p>
          </div>
          <Badge>{getRoleLabel(user.roleCode)}</Badge>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
