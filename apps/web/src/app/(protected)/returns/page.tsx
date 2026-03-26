import { requireSession } from '@/lib/auth/session';
import { fetchManagerOptions } from '@/features/orders/server';
import { ReturnsListView } from '@/features/returns/components/returns-list-view';
import { parseReturnsListSearchParams } from '@/features/returns/query';
import { fetchReturns } from '@/features/returns/server';

type ReturnsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const session = await requireSession();
  const filters = parseReturnsListSearchParams(await searchParams);
  const [returnsData, managers] = await Promise.all([
    fetchReturns(filters),
    session.user.roleCode === 'admin' ? fetchManagerOptions() : Promise.resolve([]),
  ]);

  return (
    <ReturnsListView
      role={session.user.roleCode}
      filters={filters}
      managers={managers}
      returnsData={returnsData}
    />
  );
}
