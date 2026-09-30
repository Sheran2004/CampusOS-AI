import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { sendPaymentReceiptEmail } from '@/lib/email';

/**
 * POST /api/payments/verify
 *
 * Verifies Razorpay payment signature after checkout success (client-side) and
 * grants Pro access on success.
 *
 * Body: {
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature
 * }
 */

const PRO_DURATION_MONTHS = 1;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const hasRazorpay = !!(process.env.RAZORPAY_KEY_SECRET);
    if (!hasRazorpay) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    // Verify signature using HMAC SHA256
    const crypto = await import('crypto');
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      await storage.updatePaymentStatus(razorpay_order_id, 'failed');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Mark paid + grant Pro
    await storage.updatePaymentStatus(razorpay_order_id, 'paid', razorpay_payment_id);
    await storage.grantProAccess(user.id, PRO_DURATION_MONTHS);

    // Create notification
    await storage.createNotification({
      userId: user.id,
      type: 'payment',
      title: '🎉 Welcome to CampusOS Pro!',
      body: 'Your payment was successful. Pro features are now active.',
      link: '/dashboard/settings',
    });

    // Email receipt
    const payment = await storage.getPayment(razorpay_order_id);
    sendPaymentReceiptEmail(
      user.email,
      user.name,
      (payment?.amount || 19900) / 100,
      payment?.plan || 'Pro Monthly',
    ).catch((e) => console.error('Email send failed:', e));

    return NextResponse.json({
      success: true,
      message: 'Payment verified. Pro features activated!',
      proExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}