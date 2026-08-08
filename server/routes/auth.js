import express from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Resolves current user role & identity
router.get('/whoami', async (req, res) => {
  try {
    const token = req.cookies.chemlab_session || 
                  req.cookies.chemlab_student_session ||
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.json({ authenticated: false, role: null, email: null });
    }

    // Try decoding custom JWT session token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.email) {
        // Double check if email is in teacher whitelist if role is teacher
        if (decoded.role === 'teacher') {
          const { data: teacher } = await supabaseAdmin
            .from('teacher_whitelist')
            .select('email')
            .eq('email', decoded.email.trim().toLowerCase())
            .single();

          if (teacher) {
            return res.json({
              authenticated: true,
              role: 'teacher',
              email: teacher.email
            });
          }
        } else if (decoded.role === 'student') {
          return res.json({
            authenticated: true,
            role: 'student',
            email: decoded.email,
            verified: !!decoded.verified
          });
        }
      }
    } catch (jwtErr) {
      // Token expired or invalid
    }

    // Fallback: Check Supabase Auth session for student Google OAuth
    const { data: { user }, error: sbErr } = await supabaseAdmin.auth.getUser(token);
    if (user && user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      // Check if this student email is actually a teacher
      const { data: teacher } = await supabaseAdmin
        .from('teacher_whitelist')
        .select('email')
        .eq('email', cleanEmail)
        .single();

      if (teacher) {
        return res.json({ authenticated: true, role: 'teacher', email: teacher.email });
      }

      return res.json({ authenticated: true, role: 'student', email: user.email });
    }

    return res.json({ authenticated: false, role: null, email: null });
  } catch (err) {
    console.error('Whoami error:', err);
    return res.json({ authenticated: false, role: null, email: null });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('chemlab_session');
  res.clearCookie('chemlab_student_session');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
