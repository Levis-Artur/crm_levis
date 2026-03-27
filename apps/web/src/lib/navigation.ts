import type { Route } from 'next';
import type { AppRole } from './auth/types';
import { t } from './i18n';

export type NavigationIconKey =
  | 'assistant'
  | 'dashboard'
  | 'orders'
  | 'returns'
  | 'my-finance'
  | 'admin-finance'
  | 'users';

export interface NavigationItem {
  title: string;
  href: Route;
  iconKey: NavigationIconKey;
  roles: AppRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: t.navigation.assistant,
    href: '/assistant',
    iconKey: 'assistant',
    roles: ['admin', 'manager'],
  },
  {
    title: t.navigation.dashboard,
    href: '/dashboard',
    iconKey: 'dashboard',
    roles: ['admin', 'manager'],
  },
  {
    title: t.navigation.orders,
    href: '/orders',
    iconKey: 'orders',
    roles: ['admin', 'manager'],
  },
  {
    title: t.navigation.returns,
    href: '/returns',
    iconKey: 'returns',
    roles: ['admin', 'manager'],
  },
  {
    title: t.navigation.myFinance,
    href: '/my-finance',
    iconKey: 'my-finance',
    roles: ['manager'],
  },
  {
    title: t.navigation.adminFinance,
    href: '/admin-finance',
    iconKey: 'admin-finance',
    roles: ['admin'],
  },
  {
    title: t.navigation.users,
    href: '/users',
    iconKey: 'users',
    roles: ['admin'],
  },
];

export function getNavigationItems(role: AppRole) {
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function getNavigationTitle(pathname: string, role: AppRole) {
  const item = getNavigationItems(role).find((entry) =>
    pathname === entry.href || pathname.startsWith(`${entry.href}/`),
  );

  return item?.title ?? t.navigation.fallbackTitle;
}
