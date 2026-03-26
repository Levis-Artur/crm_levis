import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { t } from '@/lib/i18n';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: t.common.unauthorized }, { status: 401 });
  }

  return NextResponse.json(session, { status: 200 });
}
