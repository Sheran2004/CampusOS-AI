import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { SkillGapAnalyzer } from './skill-gap-analyzer';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          See your exact match % for any role. Get a personalized roadmap to close gaps.
        </p>
      </div>

      <SkillGapAnalyzer
        initialSkills={user.skills}
        initialRole={user.targetRole || ''}
      />
    </div>
  );
}
