'use client';

import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { t, translateApiMessage } from '@/lib/i18n';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestedNextPath = searchParams.get('next');
  const nextPath: Route =
    requestedNextPath && requestedNextPath.startsWith('/')
      ? (requestedNextPath as Route)
      : '/dashboard';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(translateApiMessage(payload?.message, t.auth.signInError));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/70 bg-white/92">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl">{t.auth.signInTitle}</CardTitle>
          <CardDescription className="mt-2 text-sm leading-6">
            {t.auth.signInDescription}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="identifier">{t.auth.identifierLabel}</Label>
            <Input
              id="identifier"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t.auth.identifierPlaceholder}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.passwordLabel}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? t.auth.signingIn : t.auth.signIn}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
