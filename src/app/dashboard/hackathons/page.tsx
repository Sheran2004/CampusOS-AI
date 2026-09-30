import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { HACKATHON_DATABASE } from '@/lib/ai';
import { redirect } from 'next/navigation';
import { HackathonsView } from './hackathons-view';

export const dynamic = 'force-dynamic';

export default async function HackathonsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Fetch existing teams for all hackathons (best-effort)
  const teamMap: Record<string, any[]> = {};
  for (const h of HACKATHON_DATABASE) {
    try {
      teamMap[h.id] = await storage.getTeamsForHackathon(h.id);
    } catch {
      teamMap[h.id] = [];
    }
  }

  return <HackathonsView hackathons={HACKATHON_DATABASE} initialTeams={teamMap} userSkills={user.skills || []} />;
}
