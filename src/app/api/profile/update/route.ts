import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates = await req.json();
    // Whitelist allowed fields
    const allowed: any = {};
    ['name', 'college', 'branch', 'year', 'skills', 'targetRole'].forEach((k) => {
      if (k in updates) allowed[k] = updates[k];
    });

    const updated = await storage.updateUser(user.id, allowed);
    return NextResponse.json({ user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
