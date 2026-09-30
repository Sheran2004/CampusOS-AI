import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ResourcesView } from './resources-view';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <ResourcesView />;
}