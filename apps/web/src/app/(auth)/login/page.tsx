import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSession } from '@/lib/auth/session';
import { t } from '@/lib/i18n';

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_28%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="rounded-[2rem] border border-border/60 bg-slate-950 p-8 text-slate-50 shadow-[0_32px_100px_-45px_rgba(15,23,42,0.5)] sm:p-10 lg:p-12">
          <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-300">
            {t.auth.heroBadge}
          </Badge>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.auth.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            {t.auth.heroDescription}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {t.auth.highlights.map((item) => (
              <Card key={item} className="border-white/10 bg-white/5 text-slate-50 shadow-none">
                <CardContent className="p-5 text-sm leading-6 text-slate-300">{item}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
