import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { MENTOR_DATABASE } from '@/lib/ai';
import { sendMentorBookedEmail } from '@/lib/email';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookings = await storage.getUserMentorBookings(user.id);
    return NextResponse.json({ mentors: MENTOR_DATABASE, bookings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mentorId, scheduledAt, topic, notes } = await req.json();
    if (!mentorId || !scheduledAt || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await storage.createMentorBooking({
      userId: user.id,
      mentorId,
      scheduledAt: new Date(scheduledAt),
      topic,
      notes,
    });

    // Send confirmation email + notification
    const mentor = MENTOR_DATABASE.find((m) => m.id === mentorId);
    if (mentor) {
      const dateStr = new Date(scheduledAt).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      sendMentorBookedEmail(user.email, user.name, mentor.name, dateStr).catch((e) =>
        console.error('Booking email failed:', e),
      );
      storage.createNotification({
        userId: user.id,
        type: 'system',
        title: `Session booked with ${mentor.name}`,
        body: `${topic} on ${dateStr}. Chat is open!`,
        link: `/dashboard/mentors?chat=${mentorId}`,
      }).catch(() => {});
    }

    return NextResponse.json({ booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
