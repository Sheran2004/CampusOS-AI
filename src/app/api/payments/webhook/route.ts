import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

/**
 * POST /api/payments/webhook
 *
 * Razorpay server-to-server webhook. Configure in Razorpay Dashboard:
 *   Dashboard → Settings → Webhooks → New Webhook
 *   URL: https://your-domain.com/api/payments/webhook
 *   Events: payment.captured, payment.failed
 *
 * Verifies webhook signature and updates Payment status / grants Pro.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const crypto = await import('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json({ ok: true, ignored: 'no payment entity' });
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      await storage.updatePaymentStatus(orderId, 'paid', paymentId);

      // Find user by order
      const payment = await storage.getPayment(orderId);
      if (payment?.userId) {
        await storage.grantProAccess(payment.userId, 1);
        await storage.createNotification({
          userId: payment.userId,
          type: 'payment',
          title: '✅ Payment confirmed',
          body: `Payment of ₹${paymentEntity.amount / 100} received. Pro active.`,
          link: '/dashboard/settings',
        });
      }
    } else if (eventType === 'payment.failed') {
      await storage.updatePaymentStatus(orderId, 'failed');
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}