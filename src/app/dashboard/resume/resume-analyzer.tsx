'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/input';
import { Sparkles, FileText, Upload, Check, X, AlertCircle, Trophy, Loader2 } from 'lucide-react';
import type { ResumeAnalysis } from '@/lib/types';
import { scoreColor, scoreLabel } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  initialAnalysis: ResumeAnalysis | null;
  initialScore: number | null;
}

export function ResumeAnalyzer({ initialAnalysis, initialScore }: Props) {
  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(initialAnalysis);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setAnalysis(data.analysis);
      toast.success(`Resume analyzed! Score: ${data.analysis.score}/100`, {
        description: `Extracted ${data.extractedLength} characters from your file.`,
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Upload failed', { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleAnalyze = async () => {
    if (resumeText.trim().length < 50) {
      setError('Please paste at least 50 characters of your resume text.');
      toast.error('Resume too short', { description: 'Minimum 50 characters required.' });
      return;
    }

    setError('');
    setAnalyzing(true);
    const toastId = toast.loading('Analyzing your resume...');
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      toast.success(`Score: ${data.analysis.score}/100 — ${scoreLabel(data.analysis.score)}`, {
        id: toastId,
        description: 'Scroll down for 7 specific improvements you can make.',
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Analysis failed', { id: toastId, description: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = () => {
    setResumeText(`Priya Sharma
BTech Computer Science, IIT Delhi | 2024 | CGPA: 8.4
Email: priya.sharma@iitd.ac.in | LinkedIn: linkedin.com/in/priyasharma | GitHub: github.com/priyasharma

EDUCATION
Indian Institute of Technology, Delhi
BTech in Computer Science & Engineering, 2020-2024
CGPA: 8.4/10

PROJECTS
Meesho Clone | React, Node.js, MongoDB, Stripe
Built a full-stack e-commerce platform with 50+ products, user authentication, payment integration
Reduced page load time by 40% through lazy loading and image optimization

Real-time Chat App | Socket.io, Express, PostgreSQL
Developed a Slack-like chat with 1k+ messages/day capacity
Implemented end-to-end encryption using Web Crypto API

EXPERIENCE
Software Development Intern | Razorpay | Summer 2023
Worked on payment gateway optimization using React and Node.js
Improved API response time by 30% for 10M+ daily transactions

SKILLS
Languages: JavaScript, TypeScript, Python, C++
Frontend: React, Next.js, Tailwind, Redux
Backend: Node.js, Express, PostgreSQL, MongoDB
Tools: Git, GitHub, Docker, AWS, Linux

ACHIEVEMENTS
- 1st place, HackOn with Amazon 2023 (out of 5000 teams)
- Google Cloud Certified Associate Cloud Engineer
- Open source contributor: 200+ stars on GitHub`);
    setError('');
    toast.info('Sample resume loaded — click "Analyze with AI" to see real scoring');
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      {!analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Upload your resume or paste text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-violet-500 bg-violet-500/5'
                    : 'border-border hover:border-violet-400 hover:bg-violet-500/5'
                } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={onFileInput}
                  className="hidden"
                />
                {uploading ? (
                  <>
                    <Loader2 className="h-10 w-10 mx-auto text-violet-600 animate-spin mb-3" />
                    <p className="font-medium">Parsing your resume...</p>
                    <p className="text-sm text-muted-foreground mt-1">Extracting text with PDF parser</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Drop resume here or click to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, TXT, or Markdown · Max 5MB
                    </p>
                  </>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">OR PASTE TEXT</span>
                </div>
              </div>

              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                rows={10}
                className="font-mono text-sm"
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAnalyze} loading={analyzing} disabled={uploading} className="flex-1">
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </Button>
                <Button variant="outline" onClick={loadSample} disabled={uploading}>
                  Load Sample
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                🔒 Your resume is processed securely and never shared with third parties
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && (
        <>
          {/* Score overview */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-pink-600/10 p-6 border-b">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreCircle score={analysis.score} label="Overall" />
                <ScoreCircle score={analysis.atsScore} label="ATS Parseability" />
                <div className="flex-1 min-w-0">
                  <Badge variant="success" className="mb-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    {scoreLabel(analysis.score)}
                  </Badge>
                  <h2 className="text-2xl font-bold mb-1">Resume Score: {analysis.score}/100</h2>
                  <p className="text-sm text-muted-foreground">
                    {analysis.score >= 80
                      ? '🎉 Your resume is placement-ready. Keep it updated.'
                      : analysis.score >= 60
                        ? '👍 Good foundation. A few targeted fixes will get you to interview-ready.'
                        : analysis.score >= 40
                          ? '⚠️ Your resume needs work before sending to recruiters.'
                          : '🚨 Critical gaps. Follow the suggestions below.'}
                  </p>
                  <Button
                    onClick={() => {
                      setAnalysis(null);
                      setResumeText('');
                    }}
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                  >
                    Analyze another resume
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Strengths + Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.strengths.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific strengths detected yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <X className="h-5 w-5" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.weaknesses.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Looking great!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                7 Specific Improvements (actionable today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm">{s}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Missing sections */}
          {analysis.missingSections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" /> Missing Sections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSections.map((section) => (
                    <Badge key={section} variant="warning">
                      {section}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted data */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.extractedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.extractedSkills.map((skill) => (
                      <Badge key={skill} variant="default" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills detected</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Education</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="info" className="text-base">
                  {analysis.educationLevel}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.recommendedRoles.map((role) => (
                    <Badge key={role} variant="success" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <svg className="w-32 h-32 -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-xs font-medium text-muted-foreground mt-2">{label}</div>
    </div>
  );
}
