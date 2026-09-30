'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Monitor, Moon, Sun, Trash2, Briefcase, Bookmark, FileText, MessageSquare, X, Plus, Save, AlertTriangle, Crown, Check } from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  user: UserType & { isPro?: boolean; proExpiresAt?: string | null };
  metrics: { resumesAnalyzed: number; interviewsTaken: number; jobsApplied: number; eventsViewed: number };
  applicationsCount: number;
  savedJobsCount: number;
}

const ROLE_OPTIONS = [
  'Frontend Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Data Scientist',
  'ML Engineer',
  'Mobile Developer',
  'UI/UX Designer',
  'DevOps Engineer',
  'SDE Intern',
  'Software Engineer',
];

const SKILL_LIBRARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'Flask',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
  'Git', 'GitHub', 'CI/CD', 'Linux', 'System Design',
  'Figma', 'Tailwind', 'HTML', 'CSS',
];

export function SettingsForm({ user, metrics, applicationsCount, savedJobsCount }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    name: user.name,
    college: user.college || '',
    branch: user.branch || '',
    year: user.year || '2nd Year',
    targetRole: user.targetRole || 'Software Developer',
  });
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, skills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast.success('Profile saved!', { description: 'Your changes are live across the app.' });
      router.refresh();
    } catch (err: any) {
      toast.error('Save failed', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Delete your account permanently? This cannot be undone.')) {
      toast.error('Account deletion is disabled in demo mode');
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-violet-600" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information and target role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>College / University</Label>
              <Input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="">Select branch</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EE">EE</option>
                <option value="ME">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Passout</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Skills ({skills.length})
          </CardTitle>
          <CardDescription>Used for AI job matching and skill gap analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-secondary/30 min-h-[60px]">
              {skills.map((skill) => (
                <Badge key={skill} variant="default" className="px-3 py-1 text-sm">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
            />
            <Button onClick={() => addSkill(skillInput)} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              + Quick add from library ({SKILL_LIBRARY.filter((s) => !skills.includes(s)).length} available)
            </summary>
            <div className="flex flex-wrap gap-1.5 mt-3 max-h-48 overflow-auto p-2 border rounded-lg">
              {SKILL_LIBRARY.filter((s) => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="px-2 py-1 rounded-md border text-xs hover:bg-accent transition"
                >
                  + {s}
                </button>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how CampusOS looks to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`p-4 rounded-lg border text-center transition ${
                  theme === opt.value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-border hover:border-violet-300'
                }`}
              >
                <opt.icon className="h-5 w-5 mx-auto mb-2" />
                <div className="text-sm font-medium">{opt.label}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Activity</CardTitle>
          <CardDescription>Stats since you joined</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <FileText className="h-5 w-5 mx-auto mb-2 text-violet-600" />
              <div className="text-2xl font-bold">{metrics.resumesAnalyzed}</div>
              <div className="text-xs text-muted-foreground">Resumes</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <MessageSquare className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{metrics.interviewsTaken}</div>
              <div className="text-xs text-muted-foreground">Interviews</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <Briefcase className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
              <div className="text-2xl font-bold">{applicationsCount}</div>
              <div className="text-xs text-muted-foreground">Applied</div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <Bookmark className="h-5 w-5 mx-auto mb-2 text-amber-600" />
              <div className="text-2xl font-bold">{savedJobsCount}</div>
              <div className="text-xs text-muted-foreground">Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro plan */}
      <Card className={user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date() ? 'border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-violet-600" />
            CampusOS Pro
            {user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date() && (
              <Badge variant="success">Active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date()
              ? `Your Pro plan is active until ${new Date(user.proExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : 'Upgrade for unlimited mock interviews, voice mode, and priority mentor bookings.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            {['Unlimited mock interviews', 'Voice interviews', 'Priority mentor booking', 'Premium templates'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-violet-600" /> {f}
              </div>
            ))}
          </div>
          {user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date() ? (
            <div className="text-sm text-muted-foreground">
              🎉 Thanks for being Pro! Your benefits auto-renew each month.
            </div>
          ) : (
            <Button onClick={() => router.push('/dashboard/upgrade')} className="w-full">
              <Crown className="h-4 w-4" /> Upgrade to Pro — ₹199/mo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <Button onClick={save} loading={saving} size="lg">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="ghost" size="lg" onClick={handleDeleteAccount} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}
