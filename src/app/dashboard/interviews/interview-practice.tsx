'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { Sparkles, MessageSquare, ChevronRight, Check, Trophy, Clock } from 'lucide-react';
import type { InterviewSession } from '@/lib/types';
import { scoreColor, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  history: InterviewSession[];
  avgScore: number;
}

const INTERVIEW_TYPES = [
  { value: 'Frontend Developer', label: 'Frontend Developer', emoji: '🎨' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer', emoji: '🔗' },
  { value: 'Backend Developer', label: 'Backend Developer', emoji: '⚙️' },
  { value: 'DSA', label: 'DSA / Coding', emoji: '🧠' },
  { value: 'HR', label: 'HR / Behavioral', emoji: '💬' },
];

export function InterviewPractice({ history, avgScore }: Props) {
  const [step, setStep] = useState<'setup' | 'questions' | 'feedback'>('setup');
  const [interviewType, setInterviewType] = useState('Full Stack Developer');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startInterview = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'questions', role: interviewType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setStep('questions');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (answer.trim().length < 20) {
      setError('Please write at least 20 characters for meaningful feedback.');
      return;
    }
    setError('');
    setLoading(true);
    const t = toast.loading('Generating AI feedback...');
    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          question: questions[currentIdx],
          answer,
          role: interviewType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback(data.feedback);
      setStep('feedback');
      toast.success(`Score: ${data.feedback.score}/100`, {
        id: t,
        description: data.feedback.feedback,
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed', { id: t, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswer('');
      setFeedback(null);
      setStep('questions');
    } else {
      // End of interview
      setStep('setup');
      setCurrentIdx(0);
      setAnswer('');
      setFeedback(null);
      setQuestions([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{history.length}</div>
              <div className="text-xs text-muted-foreground">Interviews taken</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${scoreColor(avgScore)}`}>{avgScore}</div>
              <div className="text-xs text-muted-foreground">Average score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{history[history.length - 1]?.feedback.score || 0}</div>
              <div className="text-xs text-muted-foreground">Last interview</div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Start a new interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Choose interview type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setInterviewType(t.value)}
                    className={`p-3 rounded-lg border text-center text-sm transition ${
                      interviewType === t.value
                        ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'border-border hover:border-violet-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="bg-secondary/30 rounded-lg p-4 text-sm">
              <h4 className="font-semibold mb-2">How it works</h4>
              <ol className="space-y-1 text-muted-foreground">
                <li>1. You'll get {questions.length > 0 ? questions.length : '6-8'} questions tailored to your chosen role</li>
                <li>2. Type your answer like you would in a real interview (60-90 seconds)</li>
                <li>3. Get instant AI feedback: score, strengths, improvements, and a sample answer</li>
                <li>4. Move to the next question to keep practicing</li>
              </ol>
            </div>

            <Button onClick={startInterview} loading={loading} size="lg" className="w-full">
              <MessageSquare className="h-4 w-4" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'questions' && questions[currentIdx] && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Question {currentIdx + 1} of {questions.length}
              </CardTitle>
              <Badge variant="info">{interviewType}</Badge>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <p className="text-lg font-medium">{questions[currentIdx]}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Your answer ({answer.length} characters)
              </label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Take your time. A typical answer is 100-200 words. Use the STAR framework (Situation, Task, Action, Result) for behavioral questions."
                rows={8}
                className="text-base"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Tip: Use specific examples and numbers</span>
                <span>{answer.split(' ').filter(Boolean).length} words</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={submitAnswer} loading={loading} className="flex-1">
                Get AI Feedback <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setStep('setup')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'feedback' && feedback && (
        <Card className="overflow-hidden">
          <div className={`p-6 border-b bg-gradient-to-r ${
            feedback.score >= 75
              ? 'from-emerald-500/10 to-teal-500/10'
              : feedback.score >= 50
                ? 'from-yellow-500/10 to-orange-500/10'
                : 'from-red-500/10 to-pink-500/10'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <Badge variant={feedback.score >= 75 ? 'success' : feedback.score >= 50 ? 'warning' : 'danger'}>
                {feedback.score >= 75 ? '🎉 Excellent' : feedback.score >= 50 ? '👍 Good' : '🎯 Practice more'}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Question {currentIdx + 1} of {questions.length}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${scoreColor(feedback.score)}`}>
                {feedback.score}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Overall /100</div>
              <p className="text-base mt-4 max-w-2xl mx-auto">{feedback.feedback}</p>
            </div>
          </div>

          <CardContent className="pt-6 space-y-6">
            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <ScoreBar label="Content" score={feedback.contentScore} />
              <ScoreBar label="Clarity" score={feedback.clarityScore} />
              <ScoreBar label="Confidence" score={feedback.confidenceScore} />
            </div>

            {/* Improvements */}
            {feedback.improvements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">🎯 How to improve</h4>
                <ul className="space-y-2">
                  {feedback.improvements.map((imp: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Covered vs missed */}
            {(feedback.keyPointsCovered.length > 0 || feedback.keyPointsMissed.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                {feedback.keyPointsCovered.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-emerald-600 text-sm">✓ You covered</h4>
                    <ul className="space-y-1">
                      {feedback.keyPointsCovered.map((p: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="h-3 w-3 text-emerald-500 mt-1 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.keyPointsMissed.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600 text-sm">✗ You missed</h4>
                    <ul className="space-y-1">
                      {feedback.keyPointsMissed.map((p: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {currentIdx < questions.length - 1 ? (
                <Button onClick={nextQuestion} className="flex-1">
                  Next Question <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={nextQuestion} variant="default" className="flex-1">
                  <Trophy className="h-4 w-4" /> Finish Interview
                </Button>
              )}
              <Button variant="outline" onClick={() => setStep('setup')}>
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && step === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice(-5).reverse().map((interview) => (
                <div key={interview.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{interview.question}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{interview.role}</span>
                      <Clock className="h-3 w-3" />
                      {formatDate(interview.createdAt)}
                    </div>
                  </div>
                  <Badge variant={interview.feedback.score >= 75 ? 'success' : interview.feedback.score >= 50 ? 'warning' : 'danger'}>
                    {interview.feedback.score}/100
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-secondary/30">
      <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
