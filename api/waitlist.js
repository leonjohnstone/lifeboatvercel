import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  if (!isValidEmail) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email: normalizedEmail })
      .select();

    if (dbError && dbError.code !== '23505') {
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Leon at Lifeboat <leon@lifeboatplanner.com>',
      to: normalizedEmail,
      subject: "You're on the list",
      text: `Hey,

My name is Leon. I'm a CrossFit coach and the developer of Lifeboat - a lesson planning app for iOS.

I started building Lifeboat because I wanted an efficient way of creating elegant lesson plans. I'm currently testing it out for my classes and I'll let you know when it's ready.

Cheers,
Leon

P.S. What’s the most annoying part of creating your lesson plans? Hit reply and let me know.`,
    });

    if (emailError) console.error('Resend error:', emailError);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
