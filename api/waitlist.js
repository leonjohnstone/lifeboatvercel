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

    // 2. Send Leon's personal confirmation email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Leon at Lifeboat <leon@lifeboatplanner.com>',
      to: normalizedEmail,
      subject: "You're on the list",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Georgia, serif; background: #FDFAF6; color: #1A1208; padding: 48px 32px; max-width: 520px; margin: 0 auto; line-height: 1.8; font-size: 15px;">

            <p>Hey,</p>

            <p>My name is Leon — I'm a CrossFit coach and the developer of Lifeboat.</p>

            <p>I started building Lifeboat because I wanted an efficient way of creating elegant lesson plans.</p>

            <p>Lifeboat is coming soon — I'm finishing it up and testing it out for my classes. It will be available on iOS only.</p>

            <p>P.S. What for you is the most annoying part of creating your lesson plans? Hit reply and let me know.</p>

            <p>Cheers,<br />Leon</p>

            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #E8DDD0;">
              <img src="https://lifeboatplanner.com/assets/lifeboat-logo.png" width="36" height="36" style="border-radius: 8px; vertical-align: middle; margin-right: 10px;" />
              <span style="font-family: monospace; font-size: 11px; color: #8C7B6B; letter-spacing: 0.06em; vertical-align: middle;">LIFEBOATPLANNER.COM</span>
            </div>

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
