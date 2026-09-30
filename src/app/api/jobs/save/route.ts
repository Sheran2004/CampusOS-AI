import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { jobId, action } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    if (action === 'unsave') {
      const result = await storage.unsaveJob(user.id, jobId);
      return NextResponse.json(result);
    }
    const result = await storage.saveJob(user.id, jobId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const saved = await storage.getSavedJobs(user.id);
    return NextResponse.json({ saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
