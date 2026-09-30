import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { analyzeSkillGap } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentSkills, targetRole, branch, year } = await req.json();

    if (!currentSkills || !Array.isArray(currentSkills) || currentSkills.length === 0) {
      return NextResponse.json({ error: 'Please list your current skills' }, { status: 400 });
    }
    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    // Save skills to user profile
    await storage.updateUser(user.id, { skills: currentSkills, targetRole });

    const analysis = await analyzeSkillGap({
      currentSkills,
      targetRole,
      branch: branch || user.branch,
      year: year || user.year,
    });

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error('Skill gap error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
