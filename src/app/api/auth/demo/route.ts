import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { hashPassword, signSessionToken, setSessionCookie } from '@/lib/auth';

/**
 * Demo mode: auto-creates a demo student account if none exists,
 * then logs them in. Used for trying the app without signup.
 */
export async function POST() {
  try {
    const demoEmail = 'demo@campusos.ai';
    let user = await storage.getUserByEmail(demoEmail);

    if (!user) {
      const hashed = await hashPassword('demo-password-not-used');
      user = await storage.createUser({
        email: demoEmail,
        password: hashed,
        name: 'Demo Student',
        college: 'IIT Delhi',
        branch: 'CSE',
        year: '3rd Year',
        skills: ['javascript', 'react', 'node.js', 'sql', 'git', 'github'],
        targetRole: 'Full Stack Developer',
      });
    }

    const token = await signSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
