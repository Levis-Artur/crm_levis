import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/session';

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole('admin');
  return children;
}
