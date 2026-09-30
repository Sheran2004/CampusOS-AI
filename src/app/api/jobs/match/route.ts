import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { matchJobs } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const skills = body.skills && body.skills.length > 0 ? body.skills : user.skills;
    const targetRole = body.targetRole || user.targetRole;

    if (!skills || skills.length === 0) {
      return NextResponse.json({ error: 'Please add skills first via Skill Gap Analyzer' }, { status: 400 });
    }

    const matches = await matchJobs({
      candidateSkills: skills,
      targetRole,
      branch: user.branch,
      year: user.year,
    });

    return NextResponse.json({ matches });
  } catch (err: any) {
    console.error('Job match error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const matches = await matchJobs({
      candidateSkills: user.skills,
      targetRole: user.targetRole,
      branch: user.branch,
      year: user.year,
    });

    return NextResponse.json({ matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
