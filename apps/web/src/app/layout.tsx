import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { t } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: t.app.name,
    template: `%s | ${t.app.name}`,
  },
  description: t.app.frontendDescription,
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="uk">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
