import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { MENTOR_DATABASE } from '@/lib/ai';
import { sendPaymentReceiptEmail } from '@/lib/email';

/**
 * POST /api/payments/mentor
 *
 * Creates a Razorpay order for a paid mentor session (after the free demo).
 * Body: { mentorId: string, hours: number }
 *
 * Same demo-mode fallback as Pro upgrade — auto-activates the paid session
 * when no Razorpay keys are set, so the app works out-of-the-box.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mentorId, hours = 1 } = body;

    if (!mentorId) {
      return NextResponse.json({ error: 'mentorId required' }, { status: 400 });
    }

    const mentor = MENTOR_DATABASE.find((m) => m.id === mentorId);
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    const amountPaise = mentor.hourlyRate * hours * 100; // ₹/hr * hrs * 100 paise
    const planName = `Mentor: ${mentor.name} (${hours}h)`;

    const hasRazorpay = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    if (hasRazorpay) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await rzp.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: `mentor_${user.id.slice(0, 10)}_${Date.now()}`,
          notes: {
            userId: user.id,
            mentorId,
            mentorName: mentor.name,
            hours: String(hours),
          },
        });

        await storage.createPayment({
          userId: user.id,
          razorpayOrderId: order.id,
          amount: amountPaise,
          plan: planName,
        });

        return NextResponse.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          mentorName: mentor.name,
          planName,
          hours,
          mode: 'razorpay',
        });
      } catch (err: any) {
        console.error('Razorpay mentor order error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // ---- DEMO PATH ----
    const fakeOrderId = `demo_mentor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await storage.createPayment({
      userId: user.id,
      razorpayOrderId: fakeOrderId,
      amount: amountPaise,
      plan: planName,
    });

    await storage.updatePaymentStatus(fakeOrderId, 'paid', `demo_pay_${Date.now()}`);

    await storage.createNotification({
      userId: user.id,
      type: 'payment',
      title: `✅ Paid session with ${mentor.name}`,
      body: `₹${mentor.hourlyRate * hours} paid for ${hours}h session. Mentor will reach out to schedule.`,
      link: `/dashboard/mentors?chat=${mentorId}`,
    });

    sendPaymentReceiptEmail(
      user.email,
      user.name,
      mentor.hourlyRate * hours,
      planName,
    ).catch((e) => console.error('Email failed:', e));

    return NextResponse.json({
      mode: 'demo',
      message: `Demo payment of ₹${mentor.hourlyRate * hours} recorded. Paid session activated.`,
      orderId: fakeOrderId,
      mentorName: mentor.name,
      planName,
      hours,
      amount: mentor.hourlyRate * hours,
    });
  } catch (err: any) {
    console.error('Mentor payment error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}