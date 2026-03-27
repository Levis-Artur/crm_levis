'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      setError(t.auth.logoutError);
    } finally {
      router.replace('/login' as Route);
      router.refresh();
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Button variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={isSubmitting}>
        <LogOut className="mr-2 h-4 w-4" />
        {isSubmitting ? t.auth.signingOut : t.auth.signOut}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
