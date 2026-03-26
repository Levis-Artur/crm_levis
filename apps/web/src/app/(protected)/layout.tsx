import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { requireSession } from '@/lib/auth/session';

type ProtectedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();

  return <AppShell user={session.user}>{children}</AppShell>;
}
