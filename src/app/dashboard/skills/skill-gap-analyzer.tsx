'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, X, Plus, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import type { SkillGapAnalysis } from '@/lib/types';
import { scoreColor, scoreBg } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  initialSkills: string[];
  initialRole: string;
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

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
  'SQL', 'MongoDB', 'PostgreSQL', 'Git', 'GitHub', 'Docker', 'AWS',
  'System Design', 'Data Structures', 'Machine Learning', 'Figma', 'Tailwind',
  'Next.js', 'REST API', 'GraphQL', 'Redis', 'Kubernetes',
];

export function SkillGapAnalyzer({ initialSkills, initialRole }: Props) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [skillInput, setSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState(initialRole);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [error, setError] = useState('');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAnalyze = async () => {
    if (skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please select a target role');
      return;
    }

    setError('');
    setAnalyzing(true);
    const t = toast.loading('Analyzing skill gap...');
    try {
      const res = await fetch('/api/skills/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills: skills, targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      toast.success(`${data.analysis.matchPercentage}% match for ${targetRole}`, {
        id: t,
        description: data.analysis.summary,
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Analysis failed', { id: t, description: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            Tell us about you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Your Current Skills ({skills.length})</Label>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-secondary/30 min-h-[60px]">
                {skills.map((skill) => (
                  <Badge key={skill} variant="default" className="px-3 py-1 text-sm">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Type a skill (e.g. React, Python)"
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
            <div>
              <div className="text-xs text-muted-foreground mb-2">Quick add:</div>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 12).map((s) => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="px-2 py-1 rounded-md border text-xs hover:bg-accent transition"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Select
              id="role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="">Select a role...</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button onClick={handleAnalyze} loading={analyzing} size="lg" className="w-full">
            <Sparkles className="h-4 w-4" />
            Analyze Skill Gap
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {analysis && (
        <>
          {/* Match score */}
          <Card className="overflow-hidden">
            <div className={`bg-gradient-to-r p-6 border-b ${
              analysis.matchPercentage >= 80
                ? 'from-emerald-500/10 to-teal-500/10'
                : analysis.matchPercentage >= 50
                  ? 'from-yellow-500/10 to-orange-500/10'
                  : 'from-red-500/10 to-pink-500/10'
            }`}>
              <div className="text-center">
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Match Score for {targetRole}
                </div>
                <div className={`text-7xl font-bold ${scoreColor(analysis.matchPercentage)}`}>
                  {analysis.matchPercentage}%
                </div>
                <div className="mt-4 max-w-2xl mx-auto text-balance">
                  <p className="text-lg">{analysis.summary}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" /> Skills You Have ({analysis.strengths.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((skill) => (
                    <Badge key={skill} variant="success" className="px-3 py-1">
                      ✓ {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing required */}
          {analysis.missingRequired.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <X className="h-5 w-5" /> Required — You Need These
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingRequired.map((skill) => (
                    <Badge key={skill} variant="danger" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing preferred */}
          {analysis.missingPreferred.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  Plus — Nice to Have
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingPreferred.slice(0, 8).map((skill) => (
                    <Badge key={skill} variant="warning" className="px-3 py-1">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Roadmap */}
          {analysis.roadmap.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                  Personalized {analysis.roadmap.length}-Week Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.roadmap.map((item, idx) => (
                    <div key={item.skill} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.skill}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" /> {item.weeks} week{item.weeks > 1 ? 's' : ''}
                        </div>
                        <div className="mt-2 space-y-1">
                          {item.resources.map((res, i) => (
                            <a
                              key={i}
                              href={res}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-primary hover:underline truncate"
                            >
                              📚 {res}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Try another */}
          <div className="text-center">
            <Button variant="outline" onClick={() => setAnalysis(null)}>
              Analyze a Different Role
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
