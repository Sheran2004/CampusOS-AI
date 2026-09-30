import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { ResumeAnalyzer } from './resume-analyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface ResumeEntry {
  userId: string;
  score: number;
  atsScore: number;
  analyzedAt: string;
  feedback: any;
}

export default async function ResumePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [latest, historyData] = await Promise.all([
    storage.getLatestResume(user.id),
    storage.getResumeHistory(user.id),
  ]);
  const history: ResumeEntry[] = historyData;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          ATS-grade scoring + 7 specific improvements you can make in 30 minutes
        </p>
      </div>

      <ResumeAnalyzer initialAnalysis={latest?.feedback || null} initialScore={latest?.score || null} />

      {history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Resume Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(-5).reverse().map((entry: ResumeEntry, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {idx === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                      Analysis from {formatDate(entry.analyzedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx > 0 && history[history.length - idx - 1] && (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="font-bold text-lg">{entry.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
