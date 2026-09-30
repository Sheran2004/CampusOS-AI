import Link from 'next/link';
import { ArrowRight, Sparkles, FileText, Briefcase, MessageSquare, Target, TrendingUp, Users, Zap, Check, Star, GraduationCap, Building2, BadgeDollarSign, Brain, BarChart3, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">CampusOS AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition">How it works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</a>
            <a href="#colleges" className="text-muted-foreground hover:text-foreground transition">For Colleges</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="default" className="mb-6">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Career OS for Indian Colleges
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              Your <span className="gradient-text">Placement Journey</span>,<br />
              Powered by AI
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              One platform for resume analysis, skill gap detection, AI mock interviews,
              and personalized internship matching. Built for Indian college students.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See Live Demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Free for students
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Works in 60 seconds
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Students', value: '12K+' },
              { label: 'Resumes Analyzed', value: '8.4K' },
              { label: 'Mock Interviews', value: '23K' },
              { label: 'Avg Score Lift', value: '+34%' },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Everything you need to <span className="gradient-text">land your dream role</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From resume to placement, AI coaches you every step of the way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Resume Analyzer',
                description: 'ATS-grade scoring with actionable suggestions. Know exactly what recruiters see.',
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: Target,
                title: 'Skill Gap Analysis',
                description: 'See your exact match % for any role and get a personalized roadmap to close gaps.',
                color: 'from-fuchsia-500 to-pink-600',
              },
              {
                icon: MessageSquare,
                title: 'AI Mock Interview',
                description: 'Practice HR, DSA, and role-specific interviews with instant AI feedback.',
                color: 'from-blue-500 to-cyan-600',
              },
              {
                icon: Briefcase,
                title: 'Smart Job Matching',
                description: 'Get match scores for internships and full-time roles based on your real skills.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                icon: TrendingUp,
                title: 'Placement Readiness',
                description: 'Multi-factor score showing exactly how placement-ready you are — and what to fix.',
                color: 'from-orange-500 to-red-600',
              },
              {
                icon: Users,
                title: 'Mentor Connect',
                description: 'Book 1-on-1 sessions with seniors and industry mentors for career guidance.',
                color: 'from-indigo-500 to-violet-600',
              },
            ].map((feature) => (
              <Card key={feature.title} className="group hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-4">How it works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              From signup to <span className="gradient-text">first offer</span> in weeks
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Sign up & Diagnostic', desc: '60-second AI Career Diagnostic based on your branch, year, and skills.' },
              { step: '02', title: 'Upload Resume', desc: 'Get instant ATS score + 7 specific improvements you can make today.' },
              { step: '03', title: 'Practice Interviews', desc: 'Daily 1 mock interview. Build confidence and pattern recognition.' },
              { step: '04', title: 'Apply Smart', desc: 'See match % before applying. Apply where you actually have a shot.' },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                <div className="text-7xl font-bold gradient-text opacity-20">{item.step}</div>
                <h3 className="text-xl font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {idx < 3 && (
                  <ArrowRight className="hidden md:block h-6 w-6 text-muted-foreground absolute top-12 -right-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Colleges */}
      <section id="colleges" className="py-20 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="info" className="mb-4"><Building2 className="h-3 w-3 mr-1" />For Colleges</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                One dashboard to <span className="gradient-text">transform placement outcomes</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                See every student's readiness, skill gaps, and applications in real time.
                Run targeted interventions before placement season — not after.
              </p>

              <div className="space-y-4">
                {[
                  'Real-time placement readiness across all students',
                  'Department-wise skill distribution analytics',
                  'Top skill gaps that prevent placements',
                  'DPDP Act compliant, per-college data isolation',
                  'Integrates with your existing placement portal',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/admin">
                  <Button size="lg">Request College Pilot <ArrowRight className="h-4 w-4" /></Button>
                </Link>
                <Button size="lg" variant="outline">Download Brochure</Button>
              </div>
            </div>

            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground">Placement Readiness · 2,143 students</div>
                  <div className="mt-2 text-4xl font-bold gradient-text">73%</div>
                  <div className="text-sm text-emerald-500 mt-1">↑ +12% this semester</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                    <div className="text-2xl font-bold text-emerald-600">847</div>
                    <div className="text-xs text-muted-foreground mt-1">Placed</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                    <div className="text-2xl font-bold text-yellow-600">612</div>
                    <div className="text-xs text-muted-foreground mt-1">In Process</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <div className="text-2xl font-bold text-red-600">684</div>
                    <div className="text-xs text-muted-foreground mt-1">Needs Help</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-3">Top Skill Gaps</div>
                  {['System Design (74% missing)', 'DSA Advanced (61%)', 'React + TypeScript (54%)'].map((gap) => (
                    <div key={gap} className="text-sm py-2 border-b last:border-0 flex justify-between">
                      <span>{gap}</span>
                      <Badge variant="danger">Action needed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-4">Loved by students</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Real <span className="gradient-text">impact</span>, real students
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                role: 'BTech CSE, IIT Delhi',
                quote: 'CampusOS AI showed me my resume was missing quantified impact. After fixing 3 bullets, I got 4 callback interviews in 2 weeks.',
                stars: 5,
                initial: 'PS',
              },
              {
                name: 'Arjun Reddy',
                role: 'BTech IT, NIT Warangal',
                quote: 'Mock interview caught my filler words. Practiced 10 times, cleared Microsoft interview in second attempt.',
                stars: 5,
                initial: 'AR',
              },
              {
                name: 'Sneha Patel',
                role: 'MCA, VJTI Mumbai',
                quote: 'Skill gap analysis told me exactly what to learn. From 32% Frontend match to 87% in 4 months. Placed at Razorpay.',
                stars: 5,
                initial: 'SP',
              },
            ].map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Plans for <span className="gradient-text">every budget</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Free for students. Affordable for recruiters. Custom for colleges.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Badge variant="outline" className="mb-4">Students</Badge>
                <div className="text-4xl font-bold mb-1">₹0</div>
                <div className="text-sm text-muted-foreground mb-6">Free forever</div>
                <ul className="space-y-3 text-sm">
                  {['Resume analysis', '5 jobs/day', '1 mock interview/month', 'Skill gap analysis', 'Career dashboard'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-violet-500 border-2 relative shadow-2xl shadow-violet-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default">Most Popular</Badge>
              </div>
              <CardContent className="pt-6">
                <Badge variant="default" className="mb-4"><Sparkles className="h-3 w-3 mr-1" />Pro Student</Badge>
                <div className="text-4xl font-bold mb-1">₹199<span className="text-lg text-muted-foreground">/mo</span></div>
                <div className="text-sm text-muted-foreground mb-6">Billed monthly</div>
                <ul className="space-y-3 text-sm">
                  {['Everything in Free', 'Unlimited mock interviews', 'Voice-based practice', 'AI portfolio builder', 'Priority job referrals', 'Certificate verification'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=pro" className="block mt-6">
                  <Button className="w-full">Upgrade to Pro</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Badge variant="info" className="mb-4"><Building2 className="h-3 w-3 mr-1" />Colleges</Badge>
                <div className="text-4xl font-bold mb-1">₹4L<span className="text-lg text-muted-foreground">/yr</span></div>
                <div className="text-sm text-muted-foreground mb-6">For 1k-3k students</div>
                <ul className="space-y-3 text-sm">
                  {['All student features free', 'TPO analytics dashboard', 'Department-wise insights', 'Custom branding', 'Dedicated success manager', 'DPDP Act compliant'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/admin" className="block mt-6">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 border-0">
            <CardContent className="py-16 px-8 text-center text-white">
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to land your dream role?
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                Join 12,000+ students using AI to crack placements. Free to start, no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10">
                    For Colleges <Building2 className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold">CampusOS AI</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered career OS for Indian colleges.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">DPDP Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CampusOS AI. Built for the next billion students.
          </div>
        </div>
      </footer>
    </div>
  );
}
