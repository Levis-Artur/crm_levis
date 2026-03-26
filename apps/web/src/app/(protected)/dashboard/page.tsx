import { BarChart3, ShieldCheck, Users2, WalletCards } from 'lucide-react';
import { PageIntro } from '@/components/app-shell/page-intro';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { t } from '@/lib/i18n';

type DashboardIconKey = 'auth' | 'users' | 'finance' | 'operations';

const foundationCards = [
  {
    title: t.dashboard.cards.auth.title,
    description: t.dashboard.cards.auth.description,
    iconKey: 'auth',
  },
  {
    title: t.dashboard.cards.users.title,
    description: t.dashboard.cards.users.description,
    iconKey: 'users',
  },
  {
    title: t.dashboard.cards.finance.title,
    description: t.dashboard.cards.finance.description,
    iconKey: 'finance',
  },
  {
    title: t.dashboard.cards.operations.title,
    description: t.dashboard.cards.operations.description,
    iconKey: 'operations',
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  iconKey: DashboardIconKey;
}>;

const dashboardIcons: Record<DashboardIconKey, typeof ShieldCheck> = {
  auth: ShieldCheck,
  users: Users2,
  finance: WalletCards,
  operations: BarChart3,
};

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.dashboard.eyebrow}
        title={t.dashboard.title(session.user.firstName)}
        description={t.dashboard.description}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {foundationCards.map((card) => {
          const Icon = dashboardIcons[card.iconKey];

          return (
            <Card key={card.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary">{t.common.ready}</Badge>
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.workspaceStatusTitle}</CardTitle>
          <CardDescription>{t.dashboard.workspaceStatusDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
            {t.dashboard.statusNotes[0]}
          </div>
          <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
            {t.dashboard.statusNotes[1]}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
