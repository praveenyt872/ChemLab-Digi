import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kpzqhtoegvqscvppavqa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder');

const normEmail = (email) => (email || '').trim().toLowerCase();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { email } = req.body;
    const cleanEmail = normEmail(email);

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const { data: teacher, error: fetchErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('email, password_hash, failed_attempt_count, locked_until')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchErr || !teacher) {
      return res.json({
        success: true,
        exists: false,
        message: 'This email is not registered by your department. Contact admin.'
      });
    }

    const now = new Date();
    let isLocked = false;
    let lockRemainingSeconds = 0;

    if (teacher.locked_until && new Date(teacher.locked_until) > now) {
      isLocked = true;
      lockRemainingSeconds = Math.ceil((new Date(teacher.locked_until) - now) / 1000);
    }

    const needsSetup = !teacher.password_hash;

    return res.json({
      success: true,
      exists: true,
      needsSetup,
      isLocked,
      lockRemainingSeconds,
      email: teacher.email
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
