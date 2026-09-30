import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { PortfolioView } from './portfolio-view';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [latestResume, portfolio] = await Promise.all([
    storage.getLatestResume(user.id),
    storage.getPortfolio(user.id),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Builder</h1>
        <p className="text-muted-foreground mt-1">
          Auto-generated from your resume + profile. Edit and export to GitHub Pages / LinkedIn / Notion.
        </p>
      </div>

      <PortfolioView
        user={user}
        resumeFeedback={latestResume?.feedback || null}
        initialPortfolio={portfolio}
      />
    </div>
  );
}
