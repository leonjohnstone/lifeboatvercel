import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Save to Supabase (ignore duplicate emails gracefully)
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email: normalizedEmail })
      .select();

    if (dbError && dbError.code !== '23505') {
      // 23505 = unique constraint violation (already signed up) — that's fine
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    // 2. Send confirmation email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Lifeboat <hello@lifeboatplanner.com>',
      to: normalizedEmail,
      subject: "You're on the Lifeboat waitlist",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: monospace; background: #FDFAF6; color: #1A1208; padding: 48px 32px; max-width: 480px; margin: 0 auto;">
            <img src="https://lifeboatplanner.com/assets/lifeboat-logo.png" width="56" height="56" style="border-radius: 12px; margin-bottom: 32px;" />
            <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 700; margin: 0 0 16px;">You're on the list.</h2>
            <p style="font-size: 13px; line-height: 1.7; color: #8C7B6B; margin: 0 0 24px;">
              Thanks for signing up for Lifeboat — CrossFit lesson planning done uncommonly well.
              We'll reach out as soon as we're ready to let people in.
            </p>
            <div style="width: 36px; height: 2px; background: #FF5A0A; margin-bottom: 24px;"></div>
            <p style="font-size: 11px; color: #8C7B6B; letter-spacing: 0.06em;">
              — The Lifeboat team
            </p>
          </body>
        </html>
      `,
    });

    if (emailError) {
      // Don't fail the whole request if email fails — they're still on the list
      console.error('Resend error:', emailError);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
