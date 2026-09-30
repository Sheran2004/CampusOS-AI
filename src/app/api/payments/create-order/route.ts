import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { sendPaymentReceiptEmail } from '@/lib/email';

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order. If Razorpay keys are not configured (no RAZORPAY_KEY_ID),
 * falls back to "instant demo" mode — marks the user as Pro immediately and sends a
 * confirmation. This lets the app work out-of-the-box without a real Razorpay account.
 *
 * Body: { plan: 'pro_monthly' }
 */

const PRO_PRICE_PAISE = 19900; // ₹199
const PRO_DURATION_MONTHS = 1;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const plan = body.plan || 'pro_monthly';

    // If user is already Pro and not expired, return early
    if (user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date()) {
      return NextResponse.json({ error: 'You are already a Pro user', alreadyPro: true }, { status: 400 });
    }

    const hasRazorpay = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    // ---- RAZORPAY PATH (real keys configured) ----
    if (hasRazorpay) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const rzp = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await rzp.orders.create({
          amount: PRO_PRICE_PAISE,
          currency: 'INR',
          receipt: `receipt_${user.id.slice(0, 10)}_${Date.now()}`,
          notes: {
            userId: user.id,
            email: user.email,
            plan,
          },
        });

        await storage.createPayment({
          userId: user.id,
          razorpayOrderId: order.id,
          amount: PRO_PRICE_PAISE,
          plan,
        });

        return NextResponse.json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          plan,
          mode: 'razorpay',
        });
      } catch (err: any) {
        console.error('Razorpay order creation failed:', err);
        return NextResponse.json({ error: `Payment gateway error: ${err.message}` }, { status: 500 });
      }
    }

    // ---- DEMO PATH (no Razorpay keys) ----
    // Instantly grants Pro so the app works without any setup.
    const fakeOrderId = `demo_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await storage.createPayment({
      userId: user.id,
      razorpayOrderId: fakeOrderId,
      amount: PRO_PRICE_PAISE,
      plan,
    });

    // Mark payment as paid immediately
    await storage.updatePaymentStatus(fakeOrderId, 'paid', `demo_pay_${Date.now()}`);
    await storage.grantProAccess(user.id, PRO_DURATION_MONTHS);

    // Create notification
    await storage.createNotification({
      userId: user.id,
      type: 'payment',
      title: '🎉 Welcome to CampusOS Pro!',
      body: 'You now have unlimited mock interviews, voice mode, and priority mentor bookings.',
      link: '/dashboard/settings',
    });

    // Send receipt email (works whether Resend is configured or not)
    sendPaymentReceiptEmail(user.email, user.name, PRO_PRICE_PAISE / 100, 'Pro Monthly').catch((e) =>
      console.error('Email send failed:', e),
    );

    return NextResponse.json({
      mode: 'demo',
      message: 'Demo payment successful. Pro features activated.',
      orderId: fakeOrderId,
      plan,
      alreadyPro: false,
    });
  } catch (err: any) {
    console.error('Payment create-order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}