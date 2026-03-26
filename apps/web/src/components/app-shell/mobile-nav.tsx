'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthenticatedUser } from '@/lib/auth/types';
import { t } from '@/lib/i18n';
import { getUserDisplayName } from '@/lib/auth/user';
import type { NavigationItem } from '@/lib/navigation';
import { LogoutButton } from './logout-button';
import { NavigationLinks } from './navigation-links';

interface MobileNavProps {
  user: AuthenticatedUser;
  items: NavigationItem[];
}

export function MobileNav({ user, items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
        aria-label={t.common.openNavigation}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label={t.common.closeNavigationOverlay}
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-slate-950 px-5 py-6 text-slate-50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {t.app.name}
                </p>
                <p className="mt-2 text-lg font-semibold">{t.app.workspace}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-50 hover:bg-white/10 hover:text-slate-50"
                onClick={() => setIsOpen(false)}
                aria-label={t.common.closeNavigation}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-8 flex-1">
              <NavigationLinks items={items} onNavigate={() => setIsOpen(false)} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
              <p className="mt-1 text-sm text-slate-400">
                {user.phone ?? t.common.noContactData}
              </p>
              <LogoutButton className="mt-4" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
