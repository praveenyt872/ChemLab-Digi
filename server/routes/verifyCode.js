import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chemlab_secret_jwt_key_2026';

// Rate limiter for access code verification
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many code verification attempts. Please wait 1 minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Verify 6-digit access code submitted by student
router.post('/verify-code', verifyLimiter, async (req, res) => {
  try {
    const { code, email, userId } = req.body;
    const cleanCode = (code || '').toString().trim();
    const studentEmail = (email || '').toString().trim().toLowerCase() || 'student@guest.com';
    const studentUserId = userId || studentEmail;

    if (!cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit access code.'
      });
    }

    // 1. Fetch current active access code from DB (querying active_code first, fallback to access_code)
    let activeCode = null;

    const { data: acData } = await supabaseAdmin
      .from('active_code')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (acData) {
      activeCode = acData;
    } else {
      const { data: legacyCode } = await supabaseAdmin
        .from('access_code')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (legacyCode) activeCode = legacyCode;
    }

    if (!activeCode) {
      return res.status(403).json({
        success: false,
        error: 'No active class session right now. Ask your teacher to generate a code.'
      });
    }

    // 2. Validate submitted code (either exact plaintext match or bcrypt hash)
    let isMatch = false;
    if (activeCode.code && activeCode.code === cleanCode) {
      isMatch = true;
    } else if (activeCode.code_hash) {
      isMatch = await bcrypt.compare(cleanCode, activeCode.code_hash);
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect access code. Please check with your teacher and try again.'
      });
    }

    // 3. Deactivate previous student sessions for this user
    try {
      await supabaseAdmin
        .from('student_sessions')
        .update({ is_active: false })
        .eq('user_id', studentUserId);
    } catch (e) {}

    // 4. Insert new student session row
    try {
      await supabaseAdmin
        .from('student_sessions')
        .insert({
          user_id: studentUserId,
          student_email: studentEmail,
          authorized_code: cleanCode,
          code_row_id: activeCode.id,
          authorized_at: new Date().toISOString(),
          is_active: true
        });
    } catch (dbErr) {
      console.error('Error recording student session:', dbErr);
    }

    // 5. Issue student verified JWT token
    const studentToken = jwt.sign(
      { email: studentEmail, userId: studentUserId, role: 'student', verified: true, codeId: activeCode.id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('chemlab_student_session', studentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 3600 * 1000
    });

    return res.json({
      success: true,
      verified: true,
      role: 'student',
      email: studentEmail,
      token: studentToken
    });
  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error verifying code.' });
  }
});

// Validate student session endpoint
router.post('/validate-access', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json({ success: true, valid: false });

    // Fetch latest active student session
    const { data: session } = await supabaseAdmin
      .from('student_sessions')
      .select('authorized_code, code_row_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('authorized_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch current active code
    let activeCode = null;
    const { data: acData } = await supabaseAdmin
      .from('active_code')
      .select('id, code, is_active')
      .eq('is_active', true)
      .maybeSingle();

    if (acData) {
      activeCode = acData;
    } else {
      const { data: legacyCode } = await supabaseAdmin
        .from('access_code')
        .select('id, code, active')
        .eq('active', true)
        .maybeSingle();
      if (legacyCode) activeCode = { id: legacyCode.id, code: legacyCode.code, is_active: legacyCode.active };
    }

    if (!session || !activeCode) {
      return res.json({ success: true, valid: false });
    }

    if (session.code_row_id !== activeCode.id) {
      return res.json({ success: true, valid: false });
    }

    return res.json({ success: true, valid: true });
  } catch (err) {
    return res.json({ success: true, valid: false });
  }
});

export default router;
