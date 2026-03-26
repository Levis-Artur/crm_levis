import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logoutWithBackend } from '@/lib/auth/backend';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  try {
    await logoutWithBackend(accessToken);
  } catch {
    // Always clear local cookies even if the backend logout call fails.
  }

  return clearAuthCookies(NextResponse.json({ success: true }, { status: 200 }));
}
