import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ResumeBuilderClient } from './builder-client';

export const dynamic = 'force-dynamic';

export default async function ResumeBuilderPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <ResumeBuilderClient
      userName={user.name}
      userEmail={user.email}
    />
  );
}