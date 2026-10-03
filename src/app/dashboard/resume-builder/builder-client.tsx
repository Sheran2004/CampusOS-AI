'use client';

/**
 * Resume Builder — create an ATS-optimized resume from scratch.
 *
 * Features:
 * - Multi-section form: Personal → Summary → Skills → Experience → Education → Projects → Extras
 * - Live preview pane (right side, ATS-friendly layout)
 * - "Tailor to Company" — paste a job description, get:
 *     • match score (0-100%)
 *     • keywords to add
 *     • skills missing
 *     • specific suggestions
 * - Save to localStorage (auto) + Prisma (manual)
 * - Export options: print-to-PDF (browser), download Markdown
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Save,
  Briefcase,
  GraduationCap,
  Code2,
  Wrench,
  User,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertCircle,
  Printer,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  branch: string;
  startYear: string;
  endYear: string;
  cgpa: string;
}

interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string;
  link: string;
  bullets: string[];
}

interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;
  skills: {
    languages: string;
    frontend: string;
    backend: string;
    database: string;
    devops: string;
    ml: string;
    tools: string;
  };
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  achievements: string;
  languages: string;
  certifications: string;
  extracurriculars: string;
}

const STORAGE_KEY = 'campusos_resume_draft';

const blankExperience = (): ExperienceEntry => ({
  id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [''],
});

const blankEducation = (): EducationEntry => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  institution: '',
  degree: '',
  branch: '',
  startYear: '',
  endYear: '',
  cgpa: '',
});

const blankProject = (): ProjectEntry => ({
  id: `prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  title: '',
  description: '',
  techStack: '',
  link: '',
  bullets: [''],
});

interface Props {
  userName: string;
  userEmail: string;
}

export function ResumeBuilderClient({ userName, userEmail }: Props) {
  const [data, setData] = useState<ResumeData>(() => ({
    personal: {
      name: userName,
      email: userEmail,
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
    },
    summary: '',
    skills: {
      languages: '',
      frontend: '',
      backend: '',
      database: '',
      devops: '',
      ml: '',
      tools: '',
    },
    experience: [],
    education: [
      {
        id: 'edu_init_1',
        institution: '',
        degree: 'B.Tech',
        branch: 'Computer Science',
        startYear: '2022',
        endYear: '2026',
        cgpa: '',
      },
    ],
    projects: [],
    achievements: '',
    languages: '',
    certifications: '',
    extracurriculars: '',
  }));

  const [activeTab, setActiveTab] = useState<'personal' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'extras'>('personal');
  const [tailorOpen, setTailorOpen] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorResult, setTailorResult] = useState<any>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure new fields exist
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  // Calculate live score
  const liveScore = useMemo(() => {
    let score = 0;
    if (data.personal.name && data.personal.email) score += 4;
    if (data.personal.linkedin || data.personal.github || data.personal.portfolio) score += 4;
    if (data.summary.length >= 100) score += 6;
    else if (data.summary.length >= 30) score += 3;
    const totalSkills = Object.values(data.skills).filter((s) => s.trim()).join(', ').length;
    if (totalSkills >= 80) score += 9;
    else if (totalSkills >= 40) score += 5;
    else if (totalSkills > 0) score += 2;
    if (data.experience.length >= 2) score += 12;
    else if (data.experience.length === 1) score += 8;
    const expBullets = data.experience.flatMap((e) => e.bullets).filter((b) => b.trim());
    if (expBullets.length >= 4) score += 6;
    else if (expBullets.length >= 2) score += 3;
    const quantifiedCount = expBullets.filter((b) => /\d+%|\d+\s*(x|times|users|clients|MB|GB)/.test(b)).length;
    if (quantifiedCount >= 4) score += 8;
    else if (quantifiedCount >= 1) score += 4;
    const actionVerbCount = expBullets.filter((b) =>
      /^(built|designed|developed|architected|optimized|implemented|led|shipped|launched|created|engineered|automated|reduced|increased|improved|scaled|delivered|migrated|deployed)/i.test(b.trim())
    ).length;
    if (actionVerbCount >= 4) score += 4;
    else if (actionVerbCount >= 1) score += 2;
    if (data.projects.length >= 3) score += 10;
    else if (data.projects.length >= 1) score += 5;
    if (data.education.length >= 1 && data.education[0].institution) score += 8;
    if (data.achievements) score += 4;
    if (data.certifications) score += 3;
    if (data.extracurriculars) score += 2;
    return Math.min(95, score);
  }, [data]);

  const update = (path: string, value: any) => {
    setData((prev) => {
      const parts = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const tailor = async () => {
    const jd = (document.getElementById('jobDescription') as HTMLTextAreaElement)?.value;
    if (!jd || jd.length < 50) {
      toast.error('Please paste a job description (at least 50 characters)');
      return;
    }
    setTailorLoading(true);
    try {
      const res = await fetch('/api/resume-builder/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, currentSkills: getAllSkills() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setTailorResult(result);
      toast.success(`Match score: ${result.matchScore}/100`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTailorLoading(false);
    }
  };

  const getAllSkills = () => {
    return [
      data.skills.languages,
      data.skills.frontend,
      data.skills.backend,
      data.skills.database,
      data.skills.devops,
      data.skills.ml,
      data.skills.tools,
    ]
      .filter(Boolean)
      .flatMap((s) => s.split(',').map((x) => x.trim()).filter(Boolean));
  };

  const exportMarkdown = () => {
    const md = generateMarkdown(data);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.name.replace(/\s+/g, '_')}_Resume.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded as Markdown');
  };

  const copyAsText = () => {
    const text = generateMarkdown(data);
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
  };

  const saveToDb = async () => {
    try {
      const res = await fetch('/api/resume-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, title: `${data.personal.name}'s Resume` }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success('Saved to your account!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-violet-600" /> Resume Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Build an ATS-optimized resume from scratch. Live preview, company tailoring, export to PDF.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className={`text-2xl font-bold ${scoreColor(liveScore)}`}>{liveScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Score</div>
          </div>
          <Button variant="outline" size="sm" onClick={copyAsText}>
            <Copy className="h-3 w-3" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={exportMarkdown}>
            <Download className="h-3 w-3" /> Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3 w-3" /> PDF
          </Button>
          <Button size="sm" onClick={saveToDb}>
            <Save className="h-3 w-3" /> Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="space-y-4">
          {/* Tabs */}
          <Card>
            <div className="flex overflow-x-auto border-b">
                {[
                  { key: 'personal', icon: User, label: 'Personal' },
                  { key: 'summary', icon: Sparkles, label: 'Summary' },
                  { key: 'skills', icon: Wrench, label: 'Skills' },
                  { key: 'experience', icon: Briefcase, label: 'Experience' },
                  { key: 'education', icon: GraduationCap, label: 'Education' },
                  { key: 'projects', icon: Code2, label: 'Projects' },
                  { key: 'extras', icon: Target, label: 'Extras' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key as any)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === t.key
                        ? 'border-violet-500 text-violet-700 dark:text-violet-400'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {activeTab === 'personal' && (
                <PersonalForm data={data.personal} update={update} />
              )}
              {activeTab === 'summary' && (
                <SummaryForm summary={data.summary} update={update} />
              )}
              {activeTab === 'skills' && (
                <SkillsForm skills={data.skills} update={update} />
              )}
              {activeTab === 'experience' && (
                <ExperienceForm
                  experiences={data.experience}
                  setExperiences={(v) => update('experience', v)}
                />
              )}
              {activeTab === 'education' && (
                <EducationForm
                  educations={data.education}
                  setEducations={(v) => update('education', v)}
                />
              )}
              {activeTab === 'projects' && (
                <ProjectsForm
                  projects={data.projects}
                  setProjects={(v) => update('projects', v)}
                />
              )}
              {activeTab === 'extras' && (
                <ExtrasForm data={data} update={update} />
              )}
            </CardContent>
          </Card>

          {/* Tailor to Company */}
          <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-600" /> Tailor to a Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                id="jobDescription"
                placeholder="Paste the job description here... (e.g. Razorpay SDE Intern JD, Google SWE Intern, etc.)"
                rows={5}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Button onClick={tailor} disabled={tailorLoading} className="w-full">
                {tailorLoading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Analyze Match
                  </>
                )}
              </Button>

              {tailorResult && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreColor(tailorResult.matchScore)}`}>
                      {tailorResult.matchScore}/100
                    </div>
                    <div className="text-xs text-muted-foreground">Match with target role</div>
                  </div>
                  {tailorResult.missingSkills?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-600 mb-1">Missing skills to add:</div>
                      <div className="flex flex-wrap gap-1">
                        {tailorResult.missingSkills.map((s: string) => (
                          <Badge key={s} variant="default" className="bg-red-500/10 text-red-700">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {tailorResult.matchedSkills?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-emerald-600 mb-1">Already have:</div>
                      <div className="flex flex-wrap gap-1">
                        {tailorResult.matchedSkills.slice(0, 12).map((s: string) => (
                          <Badge key={s} variant="default" className="bg-emerald-500/10 text-emerald-700">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {tailorResult.suggestions?.map((s: string, i: number) => (
                    <div key={i} className="text-xs flex items-start gap-2">
                      <Lightbulb className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <Card className="print:shadow-none">
            <div className="p-6 text-sm bg-white text-black" id="resume-preview">
              {/* Header */}
              <div className="border-b border-gray-300 pb-3 mb-3">
                <h1 className="text-2xl font-bold tracking-tight">{data.personal.name || 'Your Name'}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-700">
                  {data.personal.email && (
                    <span>
                      <Mail className="inline h-3 w-3 mr-0.5" /> {data.personal.email}
                    </span>
                  )}
                  {data.personal.phone && (
                    <span>
                      <Phone className="inline h-3 w-3 mr-0.5" /> {data.personal.phone}
                    </span>
                  )}
                  {data.personal.location && (
                    <span>
                      <Globe className="inline h-3 w-3 mr-0.5" /> {data.personal.location}
                    </span>
                  )}
                  {data.personal.linkedin && (
                    <span>
                      <Linkedin className="inline h-3 w-3 mr-0.5" /> {data.personal.linkedin}
                    </span>
                  )}
                  {data.personal.github && (
                    <span>
                      <Github className="inline h-3 w-3 mr-0.5" /> {data.personal.github}
                    </span>
                  )}
                  {data.personal.portfolio && (
                    <span>
                      <Globe className="inline h-3 w-3 mr-0.5" /> {data.personal.portfolio}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {data.summary && (
                <PreviewSection title="Summary">
                  <p className="text-xs leading-relaxed">{data.summary}</p>
                </PreviewSection>
              )}

              {/* Skills */}
              {(Object.values(data.skills).some((s) => s.trim())) && (
                <PreviewSection title="Skills">
                  <div className="text-xs space-y-0.5">
                    {data.skills.languages && (
                      <div>
                        <strong>Languages:</strong> {data.skills.languages}
                      </div>
                    )}
                    {data.skills.frontend && (
                      <div>
                        <strong>Frontend:</strong> {data.skills.frontend}
                      </div>
                    )}
                    {data.skills.backend && (
                      <div>
                        <strong>Backend:</strong> {data.skills.backend}
                      </div>
                    )}
                    {data.skills.database && (
                      <div>
                        <strong>Database:</strong> {data.skills.database}
                      </div>
                    )}
                    {data.skills.devops && (
                      <div>
                        <strong>DevOps:</strong> {data.skills.devops}
                      </div>
                    )}
                    {data.skills.ml && (
                      <div>
                        <strong>ML/Data:</strong> {data.skills.ml}
                      </div>
                    )}
                    {data.skills.tools && (
                      <div>
                        <strong>Tools:</strong> {data.skills.tools}
                      </div>
                    )}
                  </div>
                </PreviewSection>
              )}

              {/* Experience */}
              {data.experience.filter((e) => e.company).length > 0 && (
                <PreviewSection title="Experience">
                  {data.experience.filter((e) => e.company).map((e) => (
                    <div key={e.id} className="mb-2">
                      <div className="flex justify-between">
                        <div>
                          <strong>{e.role || 'Role'}</strong> · {e.company}
                          {e.location && ` · ${e.location}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {e.startDate} – {e.current ? 'Present' : e.endDate}
                        </div>
                      </div>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                        {e.bullets.filter((b) => b.trim()).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </PreviewSection>
              )}

              {/* Education */}
              {data.education.filter((e) => e.institution).length > 0 && (
                <PreviewSection title="Education">
                  {data.education.filter((e) => e.institution).map((e) => (
                    <div key={e.id} className="mb-1.5">
                      <div className="flex justify-between">
                        <div>
                          <strong>{e.degree}</strong> {e.branch && `· ${e.branch}`} · {e.institution}
                        </div>
                        <div className="text-xs text-gray-600">
                          {e.startYear} – {e.endYear}
                        </div>
                      </div>
                      {e.cgpa && <div className="text-xs">CGPA: {e.cgpa}</div>}
                    </div>
                  ))}
                </PreviewSection>
              )}

              {/* Projects */}
              {data.projects.filter((p) => p.title).length > 0 && (
                <PreviewSection title="Projects">
                  {data.projects.filter((p) => p.title).map((p) => (
                    <div key={p.id} className="mb-2">
                      <div className="flex justify-between">
                        <strong>{p.title}</strong>
                        {p.link && <span className="text-xs text-blue-600">{p.link}</span>}
                      </div>
                      {p.techStack && <div className="text-xs italic">{p.techStack}</div>}
                      {p.description && <p className="text-xs mt-0.5">{p.description}</p>}
                      <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                        {p.bullets.filter((b) => b.trim()).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </PreviewSection>
              )}

              {/* Achievements */}
              {data.achievements && (
                <PreviewSection title="Achievements">
                  <div className="text-xs whitespace-pre-wrap">{data.achievements}</div>
                </PreviewSection>
              )}

              {/* Certifications */}
              {data.certifications && (
                <PreviewSection title="Certifications">
                  <div className="text-xs whitespace-pre-wrap">{data.certifications}</div>
                </PreviewSection>
              )}

              {/* Extracurriculars */}
              {data.extracurriculars && (
                <PreviewSection title="Extracurriculars">
                  <div className="text-xs whitespace-pre-wrap">{data.extracurriculars}</div>
                </PreviewSection>
              )}

              {/* Languages */}
              {data.languages && (
                <PreviewSection title="Languages">
                  <div className="text-xs">{data.languages}</div>
                </PreviewSection>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-200 pb-1 mb-1.5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function PersonalForm({
  data,
  update,
}: {
  data: ResumeData['personal'];
  update: (path: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <User className="h-4 w-4" /> Personal Information
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Name *" value={data.name} onChange={(v) => update('personal.name', v)} />
        <InputField label="Email *" value={data.email} onChange={(v) => update('personal.email', v)} type="email" />
        <InputField label="Phone" value={data.phone} onChange={(v) => update('personal.phone', v)} placeholder="+91 98765 43210" />
        <InputField label="Location" value={data.location} onChange={(v) => update('personal.location', v)} placeholder="Bangalore, India" />
        <InputField label="LinkedIn URL" value={data.linkedin} onChange={(v) => update('personal.linkedin', v)} placeholder="linkedin.com/in/yourname" />
        <InputField label="GitHub URL" value={data.github} onChange={(v) => update('personal.github', v)} placeholder="github.com/yourname" />
      </div>
      <InputField label="Portfolio URL (optional)" value={data.portfolio} onChange={(v) => update('personal.portfolio', v)} placeholder="yourname.dev" />
    </div>
  );
}

function SummaryForm({ summary, update }: { summary: string; update: (p: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Sparkles className="h-4 w-4" /> Professional Summary
      </h3>
      <p className="text-xs text-muted-foreground">
        2-3 lines. Format: "[Role] with [X strength] who [achievement]. Seeking [target]."
      </p>
      <textarea
        value={summary}
        onChange={(e) => update('summary', e.target.value)}
        rows={5}
        placeholder="e.g. Final year CSE student at IIT Delhi with strong full-stack experience (React, Node.js, PostgreSQL). Built Razorpay-style payment integration serving 50K transactions/day. Seeking SDE Intern roles for Summer 2026."
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
      <div className="text-xs text-muted-foreground text-right">{summary.length} chars (target: 200-400)</div>
    </div>
  );
}

function SkillsForm({
  skills,
  update,
}: {
  skills: ResumeData['skills'];
  update: (path: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Wrench className="h-4 w-4" /> Skills (categorized)
      </h3>
      <p className="text-xs text-muted-foreground">
        Comma-separated. Lead with the skills most relevant to your target role.
      </p>
      <InputField
        label="Languages"
        value={skills.languages}
        onChange={(v) => update('skills.languages', v)}
        placeholder="JavaScript, TypeScript, Python, Go"
      />
      <InputField
        label="Frontend"
        value={skills.frontend}
        onChange={(v) => update('skills.frontend', v)}
        placeholder="React, Next.js, Tailwind, Redux"
      />
      <InputField
        label="Backend"
        value={skills.backend}
        onChange={(v) => update('skills.backend', v)}
        placeholder="Node.js, Express, FastAPI, Django"
      />
      <InputField
        label="Database"
        value={skills.database}
        onChange={(v) => update('skills.database', v)}
        placeholder="PostgreSQL, MongoDB, Redis, Firebase"
      />
      <InputField
        label="DevOps / Cloud"
        value={skills.devops}
        onChange={(v) => update('skills.devops', v)}
        placeholder="AWS, Docker, Kubernetes, CI/CD"
      />
      <InputField
        label="ML / Data (optional)"
        value={skills.ml}
        onChange={(v) => update('skills.ml', v)}
        placeholder="PyTorch, TensorFlow, Pandas"
      />
      <InputField
        label="Tools"
        value={skills.tools}
        onChange={(v) => update('skills.tools', v)}
        placeholder="Git, Figma, Postman, Jira"
      />
    </div>
  );
}

function ExperienceForm({
  experiences,
  setExperiences,
}: {
  experiences: ExperienceEntry[];
  setExperiences: (v: ExperienceEntry[]) => void;
}) {
  const addExp = () => setExperiences([...experiences, blankExperience()]);
  const removeExp = (id: string) => setExperiences(experiences.filter((e) => e.id !== id));
  const updateExp = (id: string, field: string, value: any) => {
    setExperiences(experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Work Experience
        </h3>
        <Button size="sm" variant="outline" onClick={addExp}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {experiences.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-6 border-2 border-dashed rounded-lg">
          No experience added yet. Internships count — add them here.
        </div>
      )}
      {experiences.map((e) => (
        <Card key={e.id} className="bg-secondary/30">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{e.role || 'New Experience'}</div>
              <button
                type="button"
                onClick={() => removeExp(e.id)}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Role *" value={e.role} onChange={(v) => updateExp(e.id, 'role', v)} placeholder="SDE Intern" />
              <InputField label="Company *" value={e.company} onChange={(v) => updateExp(e.id, 'company', v)} placeholder="Razorpay" />
              <InputField label="Location" value={e.location} onChange={(v) => updateExp(e.id, 'location', v)} placeholder="Bangalore" />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Start" value={e.startDate} onChange={(v) => updateExp(e.id, 'startDate', v)} placeholder="May 2025" />
                <InputField label="End" value={e.endDate} onChange={(v) => updateExp(e.id, 'endDate', v)} placeholder="Jul 2025" disabled={e.current} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={e.current}
                onChange={(ev) => updateExp(e.id, 'current', ev.target.checked)}
                className="rounded"
              />
              Currently working here
            </label>
            <div>
              <label className="text-xs font-medium block mb-1">Bullet Points (use action verbs + impact)</label>
              {e.bullets.map((b, i) => (
                <textarea
                  key={i}
                  value={b}
                  onChange={(ev) => {
                    const newBullets = [...e.bullets];
                    newBullets[i] = ev.target.value;
                    updateExp(e.id, 'bullets', newBullets);
                  }}
                  placeholder={`Built ... that ... by ... (quantify: 50K users, 40% faster)`}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs mb-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateExp(e.id, 'bullets', [...e.bullets, ''])}
              >
                <Plus className="h-3 w-3" /> Add Bullet
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EducationForm({
  educations,
  setEducations,
}: {
  educations: EducationEntry[];
  setEducations: (v: EducationEntry[]) => void;
}) {
  const addEdu = () => setEducations([...educations, blankEducation()]);
  const removeEdu = (id: string) => setEducations(educations.filter((e) => e.id !== id));
  const updateEdu = (id: string, field: string, value: any) => {
    setEducations(educations.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Education
        </h3>
        <Button size="sm" variant="outline" onClick={addEdu}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {educations.map((e) => (
        <Card key={e.id} className="bg-secondary/30">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{e.degree} {e.branch && `· ${e.branch}`}</div>
              {educations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEdu(e.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <InputField label="School / College *" value={e.institution} onChange={(v) => updateEdu(e.id, 'institution', v)} placeholder="IIT Delhi" />
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Degree *" value={e.degree} onChange={(v) => updateEdu(e.id, 'degree', v)} placeholder="B.Tech" />
              <InputField label="Branch" value={e.branch} onChange={(v) => updateEdu(e.id, 'branch', v)} placeholder="Computer Science" />
              <InputField label="Start Year" value={e.startYear} onChange={(v) => updateEdu(e.id, 'startYear', v)} placeholder="2022" />
              <InputField label="End Year" value={e.endYear} onChange={(v) => updateEdu(e.id, 'endYear', v)} placeholder="2026" />
            </div>
            <InputField label="CGPA / Percentage (optional)" value={e.cgpa} onChange={(v) => updateEdu(e.id, 'cgpa', v)} placeholder="8.7/10 or 92%" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProjectsForm({
  projects,
  setProjects,
}: {
  projects: ProjectEntry[];
  setProjects: (v: ProjectEntry[]) => void;
}) {
  const addPrj = () => setProjects([...projects, blankProject()]);
  const removePrj = (id: string) => setProjects(projects.filter((p) => p.id !== id));
  const updatePrj = (id: string, field: string, value: any) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Code2 className="h-4 w-4" /> Projects
        </h3>
        <Button size="sm" variant="outline" onClick={addPrj}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {projects.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-6 border-2 border-dashed rounded-lg">
          No projects yet. Add 3-4 best projects with tech stack + live links.
        </div>
      )}
      {projects.map((p) => (
        <Card key={p.id} className="bg-secondary/30">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{p.title || 'New Project'}</div>
              <button
                type="button"
                onClick={() => removePrj(p.id)}
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <InputField label="Project Title *" value={p.title} onChange={(v) => updatePrj(p.id, 'title', v)} placeholder="PayFlow - Payment Gateway" />
            <InputField label="Tech Stack" value={p.techStack} onChange={(v) => updatePrj(p.id, 'techStack', v)} placeholder="Next.js, Node.js, PostgreSQL, Razorpay SDK" />
            <InputField label="Live Link / GitHub" value={p.link} onChange={(v) => updatePrj(p.id, 'link', v)} placeholder="github.com/you/payflow" />
            <div>
              <label className="text-xs font-medium block mb-1">Description</label>
              <textarea
                value={p.description}
                onChange={(e) => updatePrj(p.id, 'description', e.target.value)}
                rows={2}
                placeholder="1-line summary: PayFlow is a payment gateway for small businesses..."
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs mb-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Bullet Points (2-3 per project)</label>
              {p.bullets.map((b, i) => (
                <textarea
                  key={i}
                  value={b}
                  onChange={(e) => {
                    const newBullets = [...p.bullets];
                    newBullets[i] = e.target.value;
                    updatePrj(p.id, 'bullets', newBullets);
                  }}
                  placeholder="Built X that Y, resulting in Z (with numbers)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs mb-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updatePrj(p.id, 'bullets', [...p.bullets, ''])}
              >
                <Plus className="h-3 w-3" /> Add Bullet
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExtrasForm({
  data,
  update,
}: {
  data: ResumeData;
  update: (path: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Target className="h-4 w-4" /> Extras
      </h3>
      <TextareaField
        label="Achievements / Awards"
        value={data.achievements}
        onChange={(v) => update('achievements', v)}
        placeholder="• Won Smart India Hackathon 2024 (top 1% of 50K teams)&#10;• AWS Certified Solutions Architect&#10;• Dean's List 2023-24"
      />
      <TextareaField
        label="Certifications"
        value={data.certifications}
        onChange={(v) => update('certifications', v)}
        placeholder="AWS Cloud Practitioner, Google Analytics, MongoDB Basics"
      />
      <TextareaField
        label="Extracurriculars / Leadership"
        value={data.extracurriculars}
        onChange={(v) => update('extracurriculars', v)}
        placeholder="President, Coding Club (led team of 20); organized 5 hackathons with 500+ participants"
      />
      <InputField
        label="Languages Known"
        value={data.languages}
        onChange={(v) => update('languages', v)}
        placeholder="English (Fluent), Hindi (Native), Tamil (Conversational)"
      />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </div>
  );
}

function generateMarkdown(d: ResumeData): string {
  let md = `# ${d.personal.name}\n\n`;
  const contact = [
    d.personal.email,
    d.personal.phone,
    d.personal.location,
    d.personal.linkedin,
    d.personal.github,
    d.personal.portfolio,
  ].filter(Boolean);
  md += contact.join(' · ') + '\n\n';

  if (d.summary) md += `## Summary\n${d.summary}\n\n`;

  const skillsEntries = Object.entries(d.skills).filter(([_, v]) => v.trim());
  if (skillsEntries.length > 0) {
    md += `## Skills\n`;
    for (const [k, v] of skillsEntries) {
      md += `- **${k.charAt(0).toUpperCase() + k.slice(1)}:** ${v}\n`;
    }
    md += '\n';
  }

  const validExp = d.experience.filter((e) => e.company);
  if (validExp.length > 0) {
    md += `## Experience\n`;
    for (const e of validExp) {
      md += `### ${e.role} · ${e.company}`;
      if (e.location) md += ` · ${e.location}`;
      md += `\n*${e.startDate} – ${e.current ? 'Present' : e.endDate}*\n`;
      e.bullets.filter((b) => b.trim()).forEach((b) => (md += `- ${b}\n`));
      md += '\n';
    }
  }

  const validEdu = d.education.filter((e) => e.institution);
  if (validEdu.length > 0) {
    md += `## Education\n`;
    for (const e of validEdu) {
      md += `### ${e.degree}${e.branch ? ` · ${e.branch}` : ''} · ${e.institution}\n`;
      md += `*${e.startYear} – ${e.endYear}*`;
      if (e.cgpa) md += ` · CGPA: ${e.cgpa}`;
      md += '\n\n';
    }
  }

  const validPrj = d.projects.filter((p) => p.title);
  if (validPrj.length > 0) {
    md += `## Projects\n`;
    for (const p of validPrj) {
      md += `### ${p.title}`;
      if (p.link) md += ` · [link](${p.link})`;
      md += '\n';
      if (p.techStack) md += `*${p.techStack}*\n`;
      if (p.description) md += `${p.description}\n`;
      p.bullets.filter((b) => b.trim()).forEach((b) => (md += `- ${b}\n`));
      md += '\n';
    }
  }

  if (d.achievements) md += `## Achievements\n${d.achievements}\n\n`;
  if (d.certifications) md += `## Certifications\n${d.certifications}\n\n`;
  if (d.extracurriculars) md += `## Extracurriculars\n${d.extracurriculars}\n\n`;
  if (d.languages) md += `## Languages\n${d.languages}\n`;

  return md;
}