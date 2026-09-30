import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';

/**
 * Chat API for mentor ↔ student messages
 *
 * GET /api/chat?mentorId=xxx              → all messages with that mentor
 * GET /api/chat?mentorId=xxx&since=ISO     → only new messages since timestamp (polling)
 * POST /api/chat { mentorId, message }    → send a message as the student
 *
 * Mentor auto-reply is simulated via storage.addMentorReply (deterministic AI-style responses
 * using simple templates so the experience feels real without needing WebSockets).
 */

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    if (!mentorId) return NextResponse.json({ error: 'mentorId required' }, { status: 400 });

    const since = searchParams.get('since');
    const messages = await storage.getChatMessages(
      user.id,
      mentorId,
      since ? new Date(since) : undefined,
    );

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Chat GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mentorId, message } = body;
    if (!mentorId || !message?.trim()) {
      return NextResponse.json({ error: 'mentorId and message required' }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });
    }

    // Persist student's message
    const studentMsg = await storage.sendChatMessage(user.id, mentorId, 'student', message.trim());

    // Simulate a mentor auto-reply after a short delay (handled client-side via the polling loop
    // to keep this route fast). We queue a deterministic reply based on the message content.
    scheduleMentorReply(user.id, mentorId, message.trim());

    // Create notification for the user (so the bell shows new activity)
    await storage.createNotification({
      userId: user.id,
      type: 'mentor_message',
      title: 'New message from your mentor',
      body: message.slice(0, 80),
      link: `/dashboard/mentors?chat=${mentorId}`,
    });

    return NextResponse.json({ message: studentMsg });
  } catch (err: any) {
    console.error('Chat POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Lightweight mentor auto-reply generator.
 * For a real product, this would route through the mentor or a notification system.
 * Here we produce a friendly, on-topic response based on keywords in the student message.
 */
function generateMentorReply(studentMessage: string): string {
  const msg = studentMessage.toLowerCase();

  if (msg.includes('resume') || msg.includes('cv')) {
    return "Got it - I'll review your resume and share specific feedback. Make sure it quantifies impact with numbers (%, ₹, time saved). Drop your latest version or paste a snippet here and I'll annotate it.";
  }
  if (msg.includes('interview')) {
    return "Solid. For interview prep, focus on STAR-format answers and 3-4 deep projects you can talk for 10+ minutes each. Which company/role are you targeting?";
  }
  if (msg.includes('job') || msg.includes('placement') || msg.includes('offer')) {
    return "Placement strategy: target 30-50 applications across startups, mid-size, and FAANG-tier. Quality > quantity. What's your target CTC range and role?";
  }
  if (msg.includes('project') || msg.includes('github')) {
    return "For projects, prioritize 2-3 production-grade ones over 5 tutorial clones. Add a great README, live demo, and tech decisions section. Want me to review your GitHub?";
  }
  if (msg.includes('dsa') || msg.includes('algorithm')) {
    return "DSA: 80/20 rule - master arrays, strings, linked lists, trees, graphs, DP, and recursion. 150 quality problems > 500 random ones. Use NeetCode roadmap.";
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hey! 👋 Welcome to Mentor Connect. What are you working on right now - placements, projects, or interview prep?";
  }
  if (msg.includes('thank')) {
    return "Anytime! Keep me posted on your progress. Happy to do another session when you're closer to the interview.";
  }

  // Generic helpful reply
  return "Thanks for sharing. Could you give me a bit more context - what's your current year, target role, and where you are in the prep process? That helps me give you a sharper answer.";
}

function scheduleMentorReply(studentId: string, mentorId: string, studentMessage: string) {
  // Simulate the mentor typing/responding with a delay so polling feels natural.
  // Uses setTimeout; in serverless prod you'd use a job queue, but for dev this is fine.
  const reply = generateMentorReply(studentMessage);
  const delay = 1500 + Math.floor(Math.random() * 2500); // 1.5-4s
  setTimeout(() => {
    storage
      .addMentorReply(studentId, mentorId, reply)
      .then(() => {
        // Also create a notification for the student
        return storage.createNotification({
          userId: studentId,
          type: 'mentor_message',
          title: '💬 Mentor replied',
          body: reply.slice(0, 80),
          link: `/dashboard/mentors?chat=${mentorId}`,
        });
      })
      .catch((e) => console.error('Failed to send mentor reply:', e));
  }, delay);
}