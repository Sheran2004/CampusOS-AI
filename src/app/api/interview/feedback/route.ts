import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { generateInterviewFeedback, getInterviewQuestions } from '@/lib/ai';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    if (action === 'questions') {
      const role = body.role || 'Full Stack Developer';
      const questions = getInterviewQuestions(role);
      return NextResponse.json({ questions });
    }

    if (action === 'feedback') {
      const { question, answer, role, isVoice } = body;
      if (!question || !answer) {
        return NextResponse.json({ error: 'Question and answer required' }, { status: 400 });
      }
      const feedback = await generateInterviewFeedback({ question, answer, role: role || 'General' });

      const session = await storage.saveInterview({
        userId: user.id,
        role: role || 'General',
        question,
        answer,
        score: feedback.score,
        feedback,
        isVoice: !!isVoice,
      });

      return NextResponse.json({ feedback, sessionId: session.id });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Interview API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
