import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UpgradeClient } from './upgrade-client';

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <UpgradeClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.isPro,
        proExpiresAt: user.proExpiresAt,
      }}
    />
  );
}