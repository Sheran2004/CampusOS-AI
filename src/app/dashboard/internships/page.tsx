import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { JOB_DATABASE, matchJobs } from '@/lib/ai';
import { InternshipsView } from './internships-view';

export const dynamic = 'force-dynamic';

export default async function InternshipsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const allInternships = JOB_DATABASE.filter((j) => j.type === 'internship');

  // Run match scoring against student's skills (if any)
  const matches =
    user.skills.length > 0
      ? (await matchJobs({
          candidateSkills: user.skills,
          targetRole: user.targetRole,
        })).filter((m) => m.job.type === 'internship')
      : [];

  const [savedJobs, applications] = await Promise.all([
    storage.getSavedJobs(user.id),
    storage.getApplications(user.id),
  ]);

  return (
    <InternshipsView
      internships={allInternships}
      matches={matches}
      userSkills={user.skills || []}
      savedJobIds={savedJobs.filter((id: string) => allInternships.some((j) => j.id === id))}
      appliedJobIds={applications.map((a: any) => a.jobId).filter((id: string) => allInternships.some((j) => j.id === id))}
      hasSkills={user.skills.length > 0}
    />
  );
}