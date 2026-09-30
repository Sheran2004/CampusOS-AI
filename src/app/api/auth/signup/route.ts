import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { storage } from '@/lib/storage';
import { hashPassword, signSessionToken, setSessionCookie } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

const SignupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72), // bcrypt limit
  college: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(40).optional(),
  year: z.string().trim().max(20).optional(),
  skills: z.array(z.string()).optional().default([]),
  targetRole: z.string().trim().max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await storage.getUserByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered. Try logging in.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await storage.createUser({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      college: data.college,
      branch: data.branch,
      year: data.year,
      skills: data.skills,
      targetRole: data.targetRole,
    });

    const token = await signSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    // Fire welcome email (logs to console if RESEND_API_KEY not set)
    sendWelcomeEmail(user.email, user.name).catch((e) => console.error('Welcome email failed:', e));

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
