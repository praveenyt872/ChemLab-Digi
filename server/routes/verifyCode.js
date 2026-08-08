import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiter for access code verification (5 attempts per IP per minute)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
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
    const { code, email } = req.body;
    const cleanCode = (code || '').toString().trim();
    const studentEmail = (email || '').toString().trim().toLowerCase() || 'student@guest.com';

    if (!cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit access code.'
      });
    }

    // 1. Fetch current active access code from DB
    const { data: activeCode, error: fetchErr } = await supabaseAdmin
      .from('access_code')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching active access code:', fetchErr);
    }

    if (!activeCode) {
      return res.status(403).json({
        success: false,
        error: 'No active class session right now. Ask your teacher to generate a code.'
      });
    }

    // 2. Bcrypt compare submitted code against stored hash
    const isMatch = await bcrypt.compare(cleanCode, activeCode.code_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect access code. Please check with your teacher and try again.'
      });
    }

    // 3. Record student session in DB
    try {
      await supabaseAdmin
        .from('student_sessions')
        .insert({
          student_email: studentEmail,
          code_id: activeCode.id
        });
    } catch (dbErr) {
      console.error('Error recording student session:', dbErr);
    }

    // 4. Issue student verified JWT session token cookie
    const studentToken = jwt.sign(
      { email: studentEmail, role: 'student', verified: true, codeId: activeCode.id },
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

export default router;
