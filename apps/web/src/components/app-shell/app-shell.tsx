import type { ReactNode } from 'react';
import type { AuthenticatedUser } from '@/lib/auth/types';
import { getNavigationItems } from '@/lib/navigation';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

interface AppShellProps {
  user: AuthenticatedUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const items = getNavigationItems(user.roleCode);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <AppSidebar user={user} items={items} />
        <div className="min-h-screen">
          <AppHeader user={user} items={items} />
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
