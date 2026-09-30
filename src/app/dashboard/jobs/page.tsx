import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { matchJobs } from '@/lib/ai';
import { JobsList } from './jobs-list';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [matches, savedJobs, applications] = await Promise.all([
    user.skills.length > 0
      ? matchJobs({
          candidateSkills: user.skills,
          targetRole: user.targetRole,
          branch: user.branch,
          year: user.year,
        })
      : [],
    storage.getSavedJobs(user.id),
    storage.getApplications(user.id),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Job Matching</h1>
        <p className="text-muted-foreground mt-1">
          See your match % before applying. Targeting <strong>{user.targetRole || 'Software Developer'}</strong>
          {user.skills.length > 0 && ` with ${user.skills.length} skills on file`}.
        </p>
      </div>

      <JobsList
        matches={matches}
        hasSkills={user.skills.length > 0}
        savedJobIds={savedJobs}
        appliedJobIds={applications.map((a: any) => a.jobId)}
      />
    </div>
  );
}
