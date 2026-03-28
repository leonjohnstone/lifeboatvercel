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
 
    // 2. Send plain text confirmation email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Leon at Lifeboat <leon@lifeboatplanner.com>',
      to: normalizedEmail,
      subject: "You're on the list",
      text: `Hey,
 
My name is Leon — I'm a CrossFit coach and the developer of Lifeboat.
 
I started building Lifeboat because I wanted an efficient way of creating elegant lesson plans.
 
Lifeboat should be ready soon and will be available on iOS. I'm testing it out for my classes.

P.S. What’s the most annoying part of creating your lesson plans? Hit reply and let me know.
 
Cheers,
Leon`,
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
