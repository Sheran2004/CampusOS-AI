import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';

/**
 * Notifications API
 *
 * GET  /api/notifications         → list user's notifications
 * POST /api/notifications         → { action: 'markRead' } marks all as read
 */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [notifications, unread] = await Promise.all([
      storage.getUserNotifications(user.id, 30),
      storage.getUnreadCount(user.id),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (err: any) {
    console.error('Notifications GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'markRead') {
      await storage.markNotificationsRead(user.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Notifications POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}