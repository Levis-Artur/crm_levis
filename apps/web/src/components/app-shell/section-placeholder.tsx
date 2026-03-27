import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { PageIntro } from './page-intro';

interface SectionPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  details: ReadonlyArray<string>;
}

export function SectionPlaceholder({
  eyebrow,
  title,
  description,
  details,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow={eyebrow} title={title} description={description} />

      <Card>
        <CardHeader>
          <CardTitle>{t.common.modulePlaceholderTitle}</CardTitle>
          <CardDescription>{t.common.modulePlaceholderDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {details.map((detail) => (
              <li key={detail} className="rounded-2xl border border-border/70 bg-secondary/50 px-4 py-3">
                {detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
