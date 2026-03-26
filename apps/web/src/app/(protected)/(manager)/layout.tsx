import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/session';

type ManagerLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function ManagerLayout({ children }: ManagerLayoutProps) {
  await requireRole('manager');
  return children;
}
