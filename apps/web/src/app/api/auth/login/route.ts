import { NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth/cookies';
import { loginWithBackend } from '@/lib/auth/backend';
import { t } from '@/lib/i18n';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };

    const identifier = body.identifier?.trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ message: t.auth.missingCredentials }, { status: 400 });
    }

    const session = await loginWithBackend(identifier, password);
    const response = NextResponse.json({ user: session.user }, { status: 200 });

    return applyAuthCookies(response, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : t.auth.signInError;
    return NextResponse.json({ message }, { status: 401 });
  }
}
