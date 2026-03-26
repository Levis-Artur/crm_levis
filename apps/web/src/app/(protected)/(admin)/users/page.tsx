import { SectionPlaceholder } from '@/components/app-shell/section-placeholder';
import { t } from '@/lib/i18n';

export default function UsersPage() {
  return (
    <SectionPlaceholder
      eyebrow={t.placeholders.users.eyebrow}
      title={t.placeholders.users.title}
      description={t.placeholders.users.description}
      details={t.placeholders.users.details}
    />
  );
}
