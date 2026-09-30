'use client';

/**
 * Pro Upgrade — Razorpay checkout (or instant demo if no Razorpay keys).
 * Loads Razorpay script from CDN when keys are present.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Trophy, Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  isPro?: boolean;
  proExpiresAt?: string | null;
}

interface Props {
  user: User;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function UpgradeClient({ user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasRazorpayKeys, setHasRazorpayKeys] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro_monthly' }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        setHasRazorpayKeys(!!d.keyId);
      })
      .catch(() => setHasRazorpayKeys(false));
  }, []);

  const isProActive = user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();

  const startCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro_monthly' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start payment');

      if (data.mode === 'demo') {
        toast.success('🎉 Welcome to Pro!', {
          description: data.message || 'All Pro features are now active.',
        });
        setTimeout(() => router.push('/dashboard/settings'), 800);
        return;
      }

      if (!window.Razorpay) {
        await loadRazorpayScript();
      }
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CampusOS AI',
        description: 'Pro Monthly — ₹199',
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);
            toast.success('🎉 Payment successful!', {
              description: 'Welcome to CampusOS Pro.',
            });
            setTimeout(() => router.push('/dashboard/settings'), 800);
          } catch (err: any) {
            toast.error('Verification failed', { description: err.message });
          }
        },
        prefill: { email: user.email, name: user.name },
        theme: { color: '#8b5cf6' },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled');
            setLoading(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error('Payment failed', { description: response.error.description });
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="text-center space-y-3">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
          <Crown className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">CampusOS Pro</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Unlock unlimited mock interviews, voice mode, priority mentor bookings, and premium portfolio templates.
        </p>
      </div>

      {isProActive && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6 text-center">
            <Badge variant="success" className="mb-2">Active</Badge>
            <div className="text-lg font-semibold">You're a Pro member 🎉</div>
            <div className="text-sm text-muted-foreground mt-1">
              Pro active until{' '}
              {new Date(user.proExpiresAt!).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <CardDescription>Get started with the essentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              ₹0<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                'Resume analyzer (3 / month)',
                'Skill gap analysis',
                'Text mock interviews',
                'Jobs board access',
                'Hackathon listings',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" disabled className="w-full">
              {isProActive ? 'Included' : 'Current plan'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-violet-500/40 ring-2 ring-violet-500/20 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              <Sparkles className="h-3 w-3 mr-1" /> Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-violet-600" /> Pro Monthly
            </CardTitle>
            <CardDescription>Everything you need to land your dream job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              ₹199<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                'Unlimited resume analyses',
                'Unlimited mock interviews',
                'Voice interviews (Web Speech)',
                'Priority mentor bookings',
                'Job match scoring',
                'Premium portfolio templates',
                'Email notifications',
                'Pro badge on profile',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-violet-600" />
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={startCheckout}
              loading={loading}
              disabled={!!isProActive}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : isProActive ? (
                'Already Pro'
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Upgrade to Pro — ₹199
                </>
              )}
            </Button>
            <div className="text-[10px] text-center text-muted-foreground">
              🔒 Secure payment · Cancel anytime
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-lg">Lifetime</CardTitle>
            <CardDescription>One-time payment (coming soon)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              ₹2,999<span className="text-sm font-normal text-muted-foreground"> once</span>
            </div>
            <ul className="space-y-2 text-sm">
              {['Everything in Pro', 'Lifetime access', 'All future features', 'Priority support'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" disabled className="w-full">
              <Trophy className="h-4 w-4" /> Coming soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        {hasRazorpayKeys === false && (
          <div className="inline-block text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
            ℹ️ Demo mode: no Razorpay keys configured. Clicking upgrade will instantly activate Pro.
            Add <code>RAZORPAY_KEY_ID</code> + <code>RAZORPAY_KEY_SECRET</code> to <code>.env.local</code> for real payments.
          </div>
        )}
        {hasRazorpayKeys === true && (
          <div className="inline-block text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
            ✅ Razorpay is configured. You will be redirected to a secure checkout.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 pt-4">
        <FaqCard
          q="Is payment secure?"
          a="Payments are processed by Razorpay, India's #1 payment gateway. We never store your card details."
        />
        <FaqCard
          q="Can I cancel?"
          a="Yes, anytime. Your Pro features stay active until the end of your billing cycle."
        />
        <FaqCard
          q="What if I need a refund?"
          a="Email us within 7 days of payment for a full refund. No questions asked."
        />
      </div>
    </div>
  );
}

function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="font-semibold text-sm mb-1">{q}</div>
        <div className="text-sm text-muted-foreground">{a}</div>
      </CardContent>
    </Card>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}