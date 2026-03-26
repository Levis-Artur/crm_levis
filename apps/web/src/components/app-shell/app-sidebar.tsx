import { Badge } from '@/components/ui/badge';
import type { AuthenticatedUser } from '@/lib/auth/types';
import { getRoleLabel, t } from '@/lib/i18n';
import { getUserDisplayName } from '@/lib/auth/user';
import type { NavigationItem } from '@/lib/navigation';
import { NavigationLinks } from './navigation-links';

interface AppSidebarProps {
  user: AuthenticatedUser;
  items: NavigationItem[];
}

export function AppSidebar({ user, items }: AppSidebarProps) {
  return (
    <aside className="hidden border-r border-border/70 bg-slate-950 text-slate-50 lg:flex lg:min-h-screen lg:w-[280px] lg:flex-col">
      <div className="flex h-full flex-col px-6 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {t.app.name}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t.app.workspace}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {t.app.workspaceDescription}
          </p>
        </div>

        <div className="mt-8 flex-1">
          <NavigationLinks items={items} />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-300">
            {getRoleLabel(user.roleCode)}
          </Badge>
          <p className="mt-4 text-sm text-slate-400">{t.app.currentSession}</p>
          <p className="mt-1 text-base font-medium">{getUserDisplayName(user)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {user.phone ?? t.common.noContactData}
          </p>
        </div>
      </div>
    </aside>
  );
}
