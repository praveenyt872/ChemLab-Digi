import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Helper: Normalize email
const normEmail = (email) => (email || '').trim().toLowerCase();

// 1. First-Time Setup: Set password + security question
router.post('/set-password', async (req, res) => {
  try {
    const { email, password, securityQuestion, securityAnswer } = req.body;
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    // Check whitelist
    const { data: teacher, error: fetchErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (fetchErr || !teacher) {
      return res.status(403).json({
        success: false,
        error: 'Email is not whitelisted for faculty access. Please contact administrator.'
      });
    }

    if (teacher.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Account setup has already been completed for this email. Please log in instead.'
      });
    }

    // Hash password & security answer (normalized trim + lowercase)
    const passwordHash = await bcrypt.hash(password, 10);
    const cleanAnswer = securityAnswer.trim().toLowerCase();
    const answerHash = await bcrypt.hash(cleanAnswer, 10);

    const { error: updateErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .update({
        password_hash: passwordHash,
        security_question: securityQuestion,
        security_answer_hash: answerHash
      })
      .eq('email', cleanEmail);

    if (updateErr) {
      console.error('Error saving teacher credentials:', updateErr);
      return res.status(500).json({ success: false, error: 'Failed to complete first-time account setup.' });
    }

    return res.json({
      success: true,
      message: 'Account setup complete! You can now log in with your password.'
    });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during account setup.' });
  }
});

// 2. Teacher Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const { data: teacher, error: fetchErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (fetchErr || !teacher) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or email not whitelisted.' });
    }

    if (!teacher.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'First-time setup required. Please complete account setup first.'
      });
    }

    const isMatch = await bcrypt.compare(password, teacher.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please try again.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: teacher.email, role: 'teacher' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set HTTP-only cookie
    res.cookie('chemlab_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 3600 * 1000
    });

    return res.json({
      success: true,
      user: { email: teacher.email, role: 'teacher' },
      token
    });
  } catch (err) {
    console.error('Teacher login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// 3. Forgot Password: Fetch Security Question
router.post('/forgot-password/question', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = normEmail(email);

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const { data: teacher } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('security_question')
      .eq('email', cleanEmail)
      .single();

    if (!teacher || !teacher.security_question) {
      // Generic error response to prevent email enumeration
      return res.status(400).json({
        success: false,
        error: 'Unable to process password recovery for this email.'
      });
    }

    return res.json({
      success: true,
      question: teacher.security_question
    });
  } catch (err) {
    console.error('Forgot password question error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// 4. Forgot Password: Reset Password using Security Answer
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !answer || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    const { data: teacher } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (!teacher || !teacher.security_answer_hash) {
      return res.status(400).json({ success: false, error: 'Incorrect answer or request could not be processed.' });
    }

    const cleanAnswer = answer.trim().toLowerCase();
    const isAnswerCorrect = await bcrypt.compare(cleanAnswer, teacher.security_answer_hash);

    if (!isAnswerCorrect) {
      return res.status(400).json({ success: false, error: 'Incorrect answer or request could not be processed.' });
    }

    // Update to new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .update({ password_hash: newPasswordHash })
      .eq('email', cleanEmail);

    if (updateErr) {
      return res.status(500).json({ success: false, error: 'Failed to update password.' });
    }

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
