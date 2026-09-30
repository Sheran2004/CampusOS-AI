import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { calculatePlacementReadiness } from '@/lib/ai';
import { Sparkles, LayoutDashboard, FileText, Target, MessageSquare, Briefcase, TrendingUp, LogOut, Settings, Trophy, Users, Briefcase as Portfolio, Github, Crown, BookOpen, BriefcaseBusiness } from 'lucide-react';
import { LogoutButton } from './logout-button';
import { DashboardSidebarLink } from './dashboard-sidebar-link';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationsBell } from '@/components/notifications-bell';
import type { InterviewSession } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [resume, interviews, metrics] = await Promise.all([
    storage.getLatestResume(user.id),
    storage.getInterviews(user.id),
    storage.getMetrics(user.id),
  ]);

  const interviewAvg = interviews.length
    ? Math.round(interviews.reduce((s: number, i: InterviewSession) => s + i.feedback.score, 0) / interviews.length)
    : 0;

  const readiness = calculatePlacementReadiness({
    resumeScore: resume?.score || 0,
    skillMatchAvg: 62, // would come from skill gap analyzer avg
    mockInterviewAvg: interviewAvg,
    projectsCount: 2,
    internshipsCount: 0,
    githubActivity: 24,
    appliedThisMonth: metrics.jobsApplied,
  });

  const nav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/resume', icon: FileText, label: 'Resume' },
    { href: '/dashboard/skills', icon: Target, label: 'Skill Gap' },
    { href: '/dashboard/interviews', icon: MessageSquare, label: 'Mock Interview' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
    { href: '/dashboard/internships', icon: BriefcaseBusiness, label: 'Internships' },
    { href: '/dashboard/hackathons', icon: Trophy, label: 'Hackathons' },
    { href: '/dashboard/mentors', icon: Users, label: 'Mentors' },
    { href: '/dashboard/portfolio', icon: Github, label: 'Portfolio' },
    { href: '/dashboard/resources', icon: BookOpen, label: 'Resources' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/upgrade', icon: Crown, label: 'Pro Upgrade' },
  ];

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card fixed h-screen">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">CampusOS</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <DashboardSidebarLink
              key={item.href}
              href={item.href}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
            />
          ))}
        </nav>

        {/* Readiness at bottom of sidebar */}
        <div className="p-4 border-t">
          <div className="rounded-lg bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Readiness
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold gradient-text">{readiness.overall}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {readiness.nextAction}
            </div>
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {user.college}
              </div>
            </div>
            <NotificationsBell />
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  );
}
