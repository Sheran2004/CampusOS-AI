import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const metrics = await storage.getMetrics(user.id);
  const applications = await storage.getApplications(user.id);
  const savedJobs = await storage.getSavedJobs(user.id);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, preferences, and account</p>
      </div>

      <SettingsForm
        user={user}
        metrics={metrics}
        applicationsCount={applications.length}
        savedJobsCount={savedJobs.length}
      />
    </div>
  );
}
