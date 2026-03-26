import { PageIntro } from '@/components/app-shell/page-intro';
import { requireSession } from '@/lib/auth/session';
import { t } from '@/lib/i18n';
import { AssistantChat } from '@/features/ai/components/assistant-chat';

export default async function AssistantPage() {
  const session = await requireSession();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.assistant.eyebrow}
        title={t.assistant.title}
        description={t.assistant.description}
      />

      <AssistantChat roleCode={session.user.roleCode} />
    </div>
  );
}
