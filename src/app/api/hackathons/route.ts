import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { HACKATHON_DATABASE, generateHackathonIdeas, type Hackathon } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('id');

    if (hackathonId) {
      const hackathon = HACKATHON_DATABASE.find((h) => h.id === hackathonId);
      if (!hackathon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const teams = await storage.getTeamsForHackathon(hackathonId);
      return NextResponse.json({ hackathon, teams });
    }

    return NextResponse.json({ hackathons: HACKATHON_DATABASE });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'create_team') {
      const { hackathonId, hackathonName, description, leaderSkills, lookingFor, maxSize } = body;
      if (!hackathonId || !description) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }
      const team = await storage.createHackathonTeam({
        hackathonId,
        hackathonName: hackathonName || HACKATHON_DATABASE.find((h) => h.id === hackathonId)?.name || 'Hackathon',
        leaderId: user.id,
        leaderName: user.name,
        leaderSkills: leaderSkills || user.skills || [],
        description,
        lookingFor: lookingFor || [],
        maxSize: maxSize || 4,
      });
      return NextResponse.json({ team });
    }

    if (action === 'generate_ideas') {
      const { theme, skills, count } = body;
      const ideas = await generateHackathonIdeas({
        theme,
        skills: skills || user.skills,
        count: count || 5,
      });
      return NextResponse.json({ ideas });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
