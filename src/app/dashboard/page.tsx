import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { calculatePlacementReadiness } from '@/lib/ai';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Target, MessageSquare, Briefcase, TrendingUp, ArrowRight, Sparkles, CheckCircle2, Trophy, Users, Github, BookOpen, Crown, Pen } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { InterviewSession } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [resume, interviewsData, metrics] = await Promise.all([
    storage.getLatestResume(user.id),
    storage.getInterviews(user.id),
    storage.getMetrics(user.id),
  ]);

  const interviews: InterviewSession[] = interviewsData;
  const interviewAvg = interviews.length
    ? Math.round(interviews.reduce((s: number, i: InterviewSession) => s + i.feedback.score, 0) / interviews.length)
    : 0;

  const readiness = calculatePlacementReadiness({
    resumeScore: resume?.score || 0,
    skillMatchAvg: 62,
    mockInterviewAvg: interviewAvg,
    projectsCount: 2,
    internshipsCount: 0,
    githubActivity: 24,
    appliedThisMonth: metrics.jobsApplied,
  });

  const todayActions = [
    {
      href: '/dashboard/resume',
      icon: FileText,
      title: resume ? 'Re-analyze updated resume' : 'Upload your resume',
      desc: resume
        ? `Last analyzed ${formatDate(resume.analyzedAt)} — score ${resume.score}/100`
        : 'Get ATS score + 7 specific improvements',
      cta: resume ? 'Re-analyze' : 'Upload now',
      color: 'from-violet-500 to-purple-600',
    },
    {
      href: '/dashboard/skills',
      icon: Target,
      title: 'Run Skill Gap Analysis',
      desc: 'See your match % for any target role',
      cta: 'Analyze',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      href: '/dashboard/interviews',
      icon: MessageSquare,
      title: interviews.length === 0 ? 'Take your first mock interview' : `Practice interview #${interviews.length + 1}`,
      desc: 'HR, DSA, or role-specific. Get AI feedback.',
      cta: 'Start',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {user.year} · {user.branch} · {user.college}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <Badge variant="default">Live</Badge>
            </div>
            <div className="text-3xl font-bold">{readiness.overall}</div>
            <div className="text-xs text-muted-foreground">Placement Readiness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <FileText className="h-5 w-5 text-fuchsia-600" />
              {resume && <Badge variant="success">Analyzed</Badge>}
            </div>
            <div className="text-3xl font-bold">{resume?.score || '—'}</div>
            <div className="text-xs text-muted-foreground">Resume Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{interviews.length}</div>
            <div className="text-xs text-muted-foreground">Mock Interviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold">{user.skills.length}</div>
            <div className="text-xs text-muted-foreground">Skills Listed</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Explore the platform</h2>
          <Badge variant="info">
            <Sparkles className="h-3 w-3 mr-1" /> All features
          </Badge>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {todayActions.map((action) => (
            <Card key={action.title} className="group hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{action.desc}</p>
                <Link href={action.href}>
                  <Button variant="ghost" size="sm" className="gap-1 -ml-2">
                    {action.cta} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick links to other features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
          <Link href="/dashboard/resume-builder">
            <Card className="hover:border-violet-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Pen className="h-5 w-5 text-violet-500" />
                <div>
                  <div className="font-semibold text-sm">Resume Builder</div>
                  <div className="text-xs text-muted-foreground">Build + tailor to company</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/hackathons">
            <Card className="hover:border-yellow-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-semibold text-sm">Hackathon Hub</div>
                  <div className="text-xs text-muted-foreground">8 live · AI ideas</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/mentors">
            <Card className="hover:border-blue-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold text-sm">Mentor Connect</div>
                  <div className="text-xs text-muted-foreground">12 mentors</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/portfolio">
            <Card className="hover:border-emerald-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Github className="h-5 w-5 text-emerald-500" />
                <div>
                  <div className="font-semibold text-sm">Portfolio Builder</div>
                  <div className="text-xs text-muted-foreground">Auto-generate</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/internships">
            <Card className="hover:border-blue-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold text-sm">Internship Hub</div>
                  <div className="text-xs text-muted-foreground">21 internships · match scoring</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/resources">
            <Card className="hover:border-violet-500 transition cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-violet-500" />
                <div>
                  <div className="font-semibold text-sm">Resources Hub</div>
                  <div className="text-xs text-muted-foreground">DSA · Courses · Aptitude</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/upgrade">
            <Card className="hover:border-amber-500 transition cursor-pointer bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
              <CardContent className="pt-6 flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <div>
                  <div className="font-semibold text-sm">Upgrade to Pro</div>
                  <div className="text-xs text-muted-foreground">₹199/mo · voice + unlimited</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Readiness breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Placement Readiness Breakdown</CardTitle>
            <CardDescription>{readiness.nextAction}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readiness.breakdown.slice(0, 5).map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.score}/100
                    <span className="ml-1 text-xs">({Math.round(item.weight)}% weight)</span>
                  </span>
                </div>
                <Progress
                  value={item.score}
                  color={
                    item.status === 'good'
                      ? '#10b981'
                      : item.status === 'warn'
                        ? '#f59e0b'
                        : '#ef4444'
                  }
                  showValue={false}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your last 5 actions</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 && !resume ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Start by uploading your resume or taking a mock interview.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {resume && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Resume analyzed</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(resume.analyzedAt)} · Score {resume.score}/100
                      </div>
                    </div>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  </div>
                )}
                {interviews.slice(-3).reverse().map((interview) => (
                  <div key={interview.id} className="flex items-center gap-3 py-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{interview.role} Interview</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(interview.createdAt)} · Score {interview.feedback.score}/100
                      </div>
                    </div>
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>
                {user.skills.length} skills on file · target: {user.targetRole || 'Software Developer'}
              </CardDescription>
            </div>
            <Link href="/dashboard/skills">
              <Button variant="outline" size="sm">Analyze gaps <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {user.skills.length === 0 ? (
            <Link href="/dashboard/skills">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Add your skills to get started</p>
              </div>
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="default" className="px-3 py-1 text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
