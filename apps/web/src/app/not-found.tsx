import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-lg border-border/70 bg-white/92">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Сторінку не знайдено</CardTitle>
          <CardDescription>
            Запитаний маршрут недоступний або більше не існує.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className={buttonVariants()}>
            {t.navigation.dashboard}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
