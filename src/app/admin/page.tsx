import Link from 'next/link';
import { Sparkles, Users, TrendingUp, Target, FileText, MessageSquare, Briefcase, Award, ArrowRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [users, metrics] = await Promise.all([
    storage.getAllUsers(),
    storage.getAllMetrics(),
  ]);

  // For demo, seed some mock data if no users yet (to populate dashboard visuals)
  const seedStats = {
    totalStudents: Math.max(users.length, 1248),
    avgResumeScore: 67,
    avgSkillMatch: 54,
    avgMockScore: 0,
    placementReady: 0,
    atRisk: 0,
  };

  // Compute real if we have users
  if (users.length > 0) {
    seedStats.totalStudents = users.length;
    // real stats would come from resume/interview data
  }

  // For visual demo, generate plausible department & skill data
  const deptData = [
    { dept: 'CSE', students: 423, avgScore: 72, color: 'from-violet-500 to-purple-600' },
    { dept: 'IT', students: 287, avgScore: 68, color: 'from-fuchsia-500 to-pink-600' },
    { dept: 'ECE', students: 198, avgScore: 61, color: 'from-blue-500 to-cyan-600' },
    { dept: 'EE', students: 156, avgScore: 55, color: 'from-emerald-500 to-teal-600' },
    { dept: 'ME', students: 184, avgScore: 48, color: 'from-orange-500 to-red-600' },
  ];

  const skillGaps = [
    { skill: 'System Design', missing: 74, priority: 'critical' },
    { skill: 'DSA Advanced', missing: 61, priority: 'critical' },
    { skill: 'React + TypeScript', missing: 54, priority: 'high' },
    { skill: 'Backend Frameworks', missing: 48, priority: 'high' },
    { skill: 'System Design (HLD)', missing: 41, priority: 'medium' },
    { skill: 'Cloud (AWS/GCP)', missing: 38, priority: 'medium' },
    { skill: 'Communication Skills', missing: 22, priority: 'low' },
  ];

  const topPerformers = [
    { name: 'Aarav Sharma', branch: 'CSE', year: '4th Year', score: 94, avatar: 'AS' },
    { name: 'Priya Patel', branch: 'IT', year: '3rd Year', score: 89, avatar: 'PP' },
    { name: 'Rohan Kumar', branch: 'CSE', year: '4th Year', score: 87, avatar: 'RK' },
    { name: 'Sneha Reddy', branch: 'CSE', year: '3rd Year', score: 84, avatar: 'SR' },
    { name: 'Vikram Mehta', branch: 'ECE', year: '4th Year', score: 81, avatar: 'VM' },
  ];

  const placementFunnel = [
    { label: 'Total Students', value: 1248, color: 'text-foreground' },
    { label: 'Resume Strong (70+)', value: 542, color: 'text-emerald-600' },
    { label: 'Mock Interview Ready', value: 318, color: 'text-blue-600' },
    { label: 'Active Applicants', value: 247, color: 'text-violet-600' },
    { label: 'Placed', value: 142, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">CampusOS</span>
            <Badge variant="info" className="ml-2">Admin</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Student View</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">Logout</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-violet-600" />
              TPO Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              IIT Delhi · {seedStats.totalStudents} students across 5 departments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Export Report</Button>
            <Button size="sm">
              Schedule Bulk Action <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {placementFunnel.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value.toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Department performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department-wise Readiness</CardTitle>
              <CardDescription>Avg placement readiness score per department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deptData.map((d) => (
                  <div key={d.dept}>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{d.dept}</span>
                        <Badge variant="outline">{d.students} students</Badge>
                      </div>
                      <span className="font-bold">{d.avgScore}/100</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${d.color} transition-all duration-500`}
                        style={{ width: `${d.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>Highest readiness scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((p, idx) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="text-sm font-bold text-muted-foreground w-5">#{idx + 1}</div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.branch} · {p.year}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600">{p.score}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill gaps + intervention */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Top Skill Gaps (College-wide)
              </CardTitle>
              <CardDescription>Skills most students are missing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skillGaps.map((g) => (
                  <div key={g.skill} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{g.skill}</span>
                      {g.priority === 'critical' && <Badge variant="danger">Critical</Badge>}
                      {g.priority === 'high' && <Badge variant="warning">High</Badge>}
                      {g.priority === 'medium' && <Badge variant="info">Medium</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          style={{ width: `${g.missing}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-red-600 w-12 text-right">{g.missing}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  AI-Suggested Interventions
                </span>
              </CardTitle>
              <CardDescription>What to do this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    icon: Users,
                    title: 'Run System Design workshop',
                    desc: '612 students (49%) cannot answer HLD questions',
                    cta: 'Schedule',
                  },
                  {
                    icon: MessageSquare,
                    title: 'Mandatory mock interviews for final year',
                    desc: '847 students have not practiced even 1 mock',
                    cta: 'Set policy',
                  },
                  {
                    icon: FileText,
                    title: 'Resume clinic for ME students',
                    desc: '184 students with avg resume score 48',
                    cta: 'Book slots',
                  },
                  {
                    icon: Briefcase,
                    title: 'Targeted internship outreach',
                    desc: 'ECE branch: only 12% applied to EE internships',
                    cta: 'View list',
                  },
                ].map((action) => (
                  <div key={action.title} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-violet-300 transition">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <action.icon className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.desc}</div>
                    </div>
                    <Button variant="ghost" size="sm">{action.cta}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
            <CardDescription>Last 24 hours across all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Resumes Analyzed', value: 87, trend: '+23%' },
                { label: 'Mock Interviews', value: 142, trend: '+15%' },
                { label: 'Skills Analyzed', value: 64, trend: '+8%' },
                { label: 'Jobs Applied', value: 213, trend: '+31%' },
                { label: 'Profile Updates', value: 28, trend: '+5%' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-emerald-500 mt-1">{stat.trend}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pilot CTA */}
        <Card className="bg-gradient-to-br from-violet-600/5 via-fuchsia-600/5 to-pink-600/5 border-violet-500/30">
          <CardContent className="py-8">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto text-violet-600 mb-2" />
              <h3 className="text-xl font-bold mb-2">Want this for your college?</h3>
              <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                We're running free 6-month pilots with select colleges. No cost, no commitment.
                See measurable placement improvements before you decide.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button size="lg">
                  Request a Pilot <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Schedule 30-min Demo Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
