'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Github, Linkedin, Copy, Eye, Save, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { User, ResumeAnalysis } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  user: User;
  resumeFeedback: ResumeAnalysis | null;
  initialPortfolio: any;
}

interface PortfolioData {
  headline: string;
  about: string;
  skills: string[];
  projects: Array<{ name: string; description: string; tech: string[]; link?: string }>;
  experience: Array<{ title: string; org: string; duration: string; bullets: string[] }>;
  education: Array<{ degree: string; institution: string; year: string; cgpa?: string }>;
  links: { github?: string; linkedin?: string; portfolio?: string };
  theme: 'minimal' | 'gradient' | 'corporate';
}

const THEMES = {
  minimal: { bg: 'bg-white dark:bg-zinc-900', accent: 'text-zinc-900 dark:text-zinc-100' },
  gradient: { bg: 'bg-gradient-to-br from-violet-600 to-fuchsia-600', accent: 'text-white' },
  corporate: { bg: 'bg-slate-50 dark:bg-slate-900', accent: 'text-slate-900 dark:text-slate-100' },
};

export function PortfolioView({ user, resumeFeedback, initialPortfolio }: Props) {
  const [data, setData] = useState<PortfolioData>({
    headline: '',
    about: '',
    skills: user.skills || [],
    projects: [
      {
        name: 'Sample Project: E-commerce Platform',
        description: 'Built a full-stack MERN e-commerce app with 50+ products and Stripe checkout. Reduced page load by 40% via lazy loading.',
        tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        link: 'https://github.com/yourname/project',
      },
    ],
    experience: [],
    education: [
      {
        degree: user.branch ? `BTech ${user.branch}` : 'BTech',
        institution: user.college || 'Your College',
        year: user.year || '2025',
        cgpa: '8.4/10',
      },
    ],
    links: {},
    theme: 'minimal',
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load initial or auto-fill from resume
  useEffect(() => {
    if (initialPortfolio?.data) {
      setData(initialPortfolio.data);
      return;
    }
    if (user.targetRole && !data.headline) {
      setData((d) => ({
        ...d,
        headline: `${user.name} — ${user.targetRole} | ${user.college || 'IIT'} ${user.year || ''}`,
        about: `Hi! I'm ${user.name}, a ${user.year || ''} year ${user.branch || ''} student at ${user.college || 'my college'}. Passionate about ${user.targetRole || 'building great products'} and always learning.`,
      }));
    }
  }, [initialPortfolio]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      toast.success('Portfolio saved!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportGithubPages = () => {
    const markdown = `# ${data.headline}

${data.about}

## Skills
${data.skills.join(' · ')}

## Projects
${data.projects.map((p) => `### ${p.name}\n${p.description}\n*Tech:* ${p.tech.join(', ')}\n${p.link ? `[Link](${p.link})` : ''}`).join('\n\n')}

## Education
${data.education.map((e) => `- **${e.degree}** — ${e.institution} (${e.year})${e.cgpa ? ` · CGPA: ${e.cgpa}` : ''}`).join('\n')}
    `.trim();
    navigator.clipboard.writeText(markdown);
    toast.success('Markdown copied!', { description: 'Paste it as README.md in a GitHub repo, enable Pages, get a free portfolio site.' });
  };

  const exportLinkedIn = () => {
    const text = `${data.headline}\n\n${data.about}\n\nSkills: ${data.skills.join(', ')}`;
    navigator.clipboard.writeText(text);
    toast.success('LinkedIn summary copied!', { description: 'Paste into your LinkedIn About section.' });
  };

  const copyHTML = () => {
    const html = `<!DOCTYPE html>
<html><head><title>${data.headline}</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gray-50">
  <div class="max-w-3xl mx-auto p-12">
    <h1 class="text-4xl font-bold">${user.name}</h1>
    <p class="text-xl text-gray-600">${data.headline}</p>
    <p class="mt-4">${data.about}</p>
    <h2 class="mt-8 text-2xl font-bold">Skills</h2>
    <p>${data.skills.join(' · ')}</p>
    <h2 class="mt-8 text-2xl font-bold">Projects</h2>
    ${data.projects.map((p) => `<div class="mt-4"><h3 class="font-bold">${p.name}</h3><p>${p.description}</p><p class="text-sm">${p.tech.join(', ')}</p></div>`).join('')}
  </div>
</body></html>`;
    navigator.clipboard.writeText(html);
    toast.success('HTML copied!', { description: 'Save as index.html for a ready-to-host portfolio.' });
  };

  return (
    <div className="space-y-6">
      {!previewMode ? (
        <>
          {/* Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Edit Portfolio</CardTitle>
                  <CardDescription>Your data is auto-saved to the server</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                  <Button size="sm" onClick={save} loading={saving}>
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={data.headline}
                  onChange={(e) => setData({ ...data, headline: e.target.value })}
                  placeholder="Your Name — Role | College Year"
                />
              </div>
              <div className="space-y-2">
                <Label>About Me</Label>
                <Textarea
                  value={data.about}
                  onChange={(e) => setData({ ...data, about: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.projects.map((p, i) => (
                <div key={i} className="p-4 rounded-lg border space-y-2">
                  <Input
                    value={p.name}
                    onChange={(e) => {
                      const projects = [...data.projects];
                      projects[i] = { ...p, name: e.target.value };
                      setData({ ...data, projects });
                    }}
                    placeholder="Project name"
                  />
                  <Textarea
                    value={p.description}
                    onChange={(e) => {
                      const projects = [...data.projects];
                      projects[i] = { ...p, description: e.target.value };
                      setData({ ...data, projects });
                    }}
                    rows={2}
                  />
                  <Input
                    value={p.tech.join(', ')}
                    onChange={(e) => {
                      const projects = [...data.projects];
                      projects[i] = { ...p, tech: e.target.value.split(',').map((t) => t.trim()) };
                      setData({ ...data, projects });
                    }}
                    placeholder="React, Node, MongoDB"
                  />
                  <Input
                    value={p.link || ''}
                    onChange={(e) => {
                      const projects = [...data.projects];
                      projects[i] = { ...p, link: e.target.value };
                      setData({ ...data, projects });
                    }}
                    placeholder="https://github.com/..."
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" /> Export Portfolio
              </CardTitle>
              <CardDescription>One-click to put your portfolio online</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={exportGithubPages}>
                <Github className="h-4 w-4" /> GitHub Pages (MD)
              </Button>
              <Button variant="outline" onClick={exportLinkedIn}>
                <Linkedin className="h-4 w-4" /> LinkedIn (summary)
              </Button>
              <Button variant="outline" onClick={copyHTML}>
                <Copy className="h-4 w-4" /> Standalone HTML
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Preview</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}>
                  Back to Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-violet-600/5 via-fuchsia-600/5 to-pink-600/5 p-12 rounded-b-lg">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="text-center">
                    <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-4xl font-bold mb-4">
                      {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <h1 className="text-4xl font-bold">{user.name}</h1>
                    <p className="text-xl text-muted-foreground mt-2">{data.headline}</p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold border-b pb-2 mb-4">About</h2>
                    <p className="text-muted-foreground">{data.about}</p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold border-b pb-2 mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold border-b pb-2 mb-4">Projects</h2>
                    <div className="space-y-4">
                      {data.projects.map((p, i) => (
                        <div key={i} className="p-4 rounded-lg border bg-card">
                          <h3 className="font-bold text-lg">{p.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.tech.map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                          {p.link && (
                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> View project
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {data.education.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold border-b pb-2 mb-4">Education</h2>
                      <div className="space-y-2">
                        {data.education.map((e, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{e.degree} — {e.institution}</div>
                              <div className="text-sm text-muted-foreground">{e.year}</div>
                            </div>
                            {e.cgpa && <Badge variant="info">CGPA: {e.cgpa}</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* AI Suggestions */}
      {resumeFeedback?.suggestions && resumeFeedback.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-600">
              <Sparkles className="h-5 w-5" /> AI Resume Suggestions
            </CardTitle>
            <CardDescription>From your latest resume analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resumeFeedback.suggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
