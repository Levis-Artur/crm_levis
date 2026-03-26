import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_TOKEN_COOKIE } from './constants';
import { fetchCurrentUser } from './backend';
import type { AppRole } from './types';

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const session = await fetchCurrentUser(accessToken);

  if (!session?.user) {
    return null;
  }

  return session;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireRole(roles: AppRole | AppRole[]) {
  const session = await requireSession();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(session.user.roleCode)) {
    redirect('/dashboard');
  }

  return session;
}
