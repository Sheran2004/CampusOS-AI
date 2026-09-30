/**
 * Email Service — Resend integration (conditional).
 *
 * If RESEND_API_KEY is set, sends real emails.
 * Otherwise, logs to console (so the app works without any setup).
 *
 * Sign up free: https://resend.com (100 emails/day free tier)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'CampusOS AI <noreply@campusos.ai>';

function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    console.log('\n📧 [Email Stub - No RESEND_API_KEY set]');
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body preview: ${(options.text || options.html).substring(0, 200)}...`);
    console.log('');
    return { success: true };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Email send exception:', err);
    return { success: false, error: err.message };
  }
}

/* ============================================================
 * PRE-BUILT EMAIL TEMPLATES (Beautiful HTML)
 * ============================================================ */

function emailWrapper(content: string, preheader = ''): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CampusOS AI</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #fafafa; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 32px 24px; color: #1f2937; line-height: 1.6; }
    .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; color: #6b7280; font-size: 13px; }
    .footer a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="header">
      <h1>🎓 CampusOS AI</h1>
    </div>
    ${content}
    <div class="footer">
      <p>You are receiving this email because you signed up for CampusOS AI.</p>
      <p><a href="https://campusos.ai/settings">Manage email preferences</a></p>
      <p>© 2026 CampusOS AI. Built for the next billion students.</p>
    </div>
  </div>
</body>
</html>`.trim();
}

export const EMAIL_TEMPLATES = {
  welcome: (name: string) =>
    emailWrapper(
      `
      <div class="content">
        <h2 style="margin-top: 0;">Welcome to CampusOS AI, ${name}! 🎉</h2>
        <p>You are now part of the AI-powered placement revolution.</p>
        <p>Get started with 3 quick actions:</p>
        <ol>
          <li><strong>Upload your resume</strong> - Get an instant ATS score + 7 actionable improvements</li>
          <li><strong>Run skill gap analysis</strong> - See your match % for any target role</li>
          <li><strong>Take a mock interview</strong> - Practice with AI feedback</li>
        </ol>
        <a href="https://campusos.ai/dashboard" class="button">Go to Dashboard →</a>
        <p style="margin-top: 32px;">Questions? Just reply to this email.</p>
        <p>Happy placement hunting,<br>The CampusOS AI Team</p>
      </div>
      `,
      `Welcome to CampusOS AI! Get started with 3 quick actions.`
    ),

  resumeAnalyzed: (name: string, score: number) =>
    emailWrapper(
      `
      <div class="content">
        <h2 style="margin-top: 0;">Resume Score: ${score}/100 📊</h2>
        <p>Hi ${name},</p>
        <p>We analyzed your latest resume submission. Your score is <strong>${score}/100</strong>.</p>
        <p>Open the dashboard to see 7 specific improvements you can make today.</p>
        <a href="https://campusos.ai/dashboard/resume" class="button">View Full Analysis →</a>
      </div>
      `,
      `Your resume scored ${score}/100. View 7 improvements.`
    ),

  mentorBooked: (name: string, mentorName: string, date: string) =>
    emailWrapper(
      `
      <div class="content">
        <h2 style="margin-top: 0;">Session Booked with ${mentorName} 📅</h2>
        <p>Hi ${name},</p>
        <p>Your mentor session is confirmed for <strong>${date}</strong>.</p>
        <p>You can chat with your mentor directly from the dashboard. They will reach out before the session.</p>
        <a href="https://campusos.ai/dashboard/mentors" class="button">View My Sessions →</a>
      </div>
      `,
      `Session with ${mentorName} on ${date}`
    ),

  paymentReceipt: (name: string, amount: number, plan: string) =>
    emailWrapper(
      `
      <div class="content">
        <h2 style="margin-top: 0;">Payment Received ✅</h2>
        <p>Hi ${name},</p>
        <p>Thank you! We received your payment of <strong>₹${amount}</strong> for the <strong>${plan}</strong> plan.</p>
        <p>Your Pro features are now active:</p>
        <ul>
          <li>Unlimited mock interviews</li>
          <li>Voice interviews (Pro)</li>
          <li>Priority mentor bookings</li>
          <li>Premium portfolio templates</li>
        </ul>
        <a href="https://campusos.ai/dashboard/settings" class="button">View Settings →</a>
      </div>
      `,
      `Payment of ₹${amount} received. Welcome to Pro!`
    ),
};

/* ============================================================
 * SEND-AND-LOG WRAPPERS
 * ============================================================ */

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to CampusOS AI 🎓',
    html: EMAIL_TEMPLATES.welcome(name),
  });
}

export async function sendResumeAnalyzedEmail(to: string, name: string, score: number) {
  return sendEmail({
    to,
    subject: `Your resume scored ${score}/100`,
    html: EMAIL_TEMPLATES.resumeAnalyzed(name, score),
  });
}

export async function sendMentorBookedEmail(to: string, name: string, mentorName: string, date: string) {
  return sendEmail({
    to,
    subject: `Session booked with ${mentorName}`,
    html: EMAIL_TEMPLATES.mentorBooked(name, mentorName, date),
  });
}

export async function sendPaymentReceiptEmail(to: string, name: string, amount: number, plan: string) {
  return sendEmail({
    to,
    subject: `Payment received — ₹${amount} for ${plan}`,
    html: EMAIL_TEMPLATES.paymentReceipt(name, amount, plan),
  });
}
