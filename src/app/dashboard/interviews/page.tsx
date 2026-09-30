import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { InterviewPractice } from './interview-practice';
import { VoicePractice } from './voice-practice';
import type { InterviewSession } from '@/lib/types';
import { Mic, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const history: InterviewSession[] = await storage.getInterviews(user.id);
  const voiceHistory = history.filter((h: any) => h.isVoice);
  const textHistory = history.filter((h: any) => !h.isVoice);
  const mode = searchParams.mode === 'voice' ? 'voice' : 'text';
  const avgScore = history.length
    ? Math.round(history.reduce((s: number, h: InterviewSession) => s + h.feedback.score, 0) / history.length)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Mock Interview</h1>
        <p className="text-muted-foreground mt-1">
          Practice HR, DSA, Frontend, Backend, or Behavioral interviews. Get instant AI feedback.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-2 border-b">
        <a
          href="?mode=text"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'text'
              ? 'border-violet-500 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="inline h-4 w-4 mr-1.5" />
          Text Interview
        </a>
        <a
          href="?mode=voice"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            mode === 'voice'
              ? 'border-violet-500 text-violet-700 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mic className="inline h-4 w-4 mr-1.5" />
          Voice Interview
          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold uppercase">
            Free
          </span>
        </a>
      </div>

      {mode === 'voice' ? (
        <VoicePractice history={voiceHistory} avgScore={avgScore} />
      ) : (
        <InterviewPractice history={textHistory} avgScore={avgScore} />
      )}
    </div>
  );
}