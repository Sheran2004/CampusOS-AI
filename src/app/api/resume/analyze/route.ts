import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { analyzeResume } from '@/lib/ai';
import { sendResumeAnalyzedEmail } from '@/lib/email';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Resume text is required (minimum 50 characters)' },
        { status: 400 }
      );
    }

    const truncated = text.substring(0, 15000);
    const analysis = await analyzeResume(truncated);

    await storage.saveResumeScore({
      userId: user.id,
      score: analysis.score,
      atsScore: analysis.atsScore,
      feedback: analysis,
    });

    // Fire-and-forget email + notification
    sendResumeAnalyzedEmail(user.email, user.name, analysis.score).catch((e) =>
      console.error('Resume email failed:', e),
    );
    storage.createNotification({
      userId: user.id,
      type: 'system',
      title: 'Resume analyzed',
      body: `Your resume scored ${analysis.score}/100. ${analysis.atsScore}/100 ATS compatibility.`,
      link: '/dashboard/resume',
    }).catch(() => {});

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error('Resume analysis error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
