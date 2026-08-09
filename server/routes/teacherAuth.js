import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chemlab_secret_jwt_key_2026';

// Helper: Normalize email
const normEmail = (email) => (email || '').trim().toLowerCase();

// 1. Check Teacher Status: Returns whether email exists and needs setup / is locked
router.post('/check-status', async (req, res) => {
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

    // Check Lockout Status
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
    console.error('Check status error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error checking teacher status.' });
  }
});

// 2. First-Time Setup: Set password + security question
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

    // Re-check server-side that password_hash is still NULL (race condition protection)
    const { data: teacher, error: fetchErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('email, password_hash')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchErr || !teacher) {
      return res.status(403).json({
        success: false,
        error: 'Email is not registered by your department. Contact admin.'
      });
    }

    if (teacher.password_hash) {
      return res.status(400).json({
        success: false,
        needsSetup: false,
        error: 'Password already set up. Please log in instead.'
      });
    }

    // Hash password & security answer
    const passwordHash = await bcrypt.hash(password, 10);
    const cleanAnswer = securityAnswer.trim().toLowerCase();
    const answerHash = await bcrypt.hash(cleanAnswer, 10);

    const { error: updateErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .update({
        password_hash: passwordHash,
        security_question: securityQuestion,
        security_answer_hash: answerHash,
        password_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

// 3. Teacher Login (with 5-attempt / 15-min Lockout logic)
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
      .maybeSingle();

    if (fetchErr || !teacher) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!teacher.password_hash) {
      return res.status(400).json({
        success: false,
        needsSetup: true,
        error: 'First-time setup required. Please set up your password.'
      });
    }

    // Check Lockout
    const now = new Date();
    if (teacher.locked_until && new Date(teacher.locked_until) > now) {
      const remSec = Math.ceil((new Date(teacher.locked_until) - now) / 1000);
      const remMin = Math.ceil(remSec / 60);
      return res.status(423).json({
        success: false,
        error: `Account locked due to too many failed attempts. Try again in ${remMin} minute(s).`
      });
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, teacher.password_hash);

    if (!isMatch) {
      const currentAttempts = (teacher.failed_attempt_count || 0) + 1;
      let updatePayload = { failed_attempt_count: currentAttempts };

      if (currentAttempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        updatePayload.locked_until = lockoutTime;
      }

      await supabaseAdmin
        .from('teacher_whitelist')
        .update(updatePayload)
        .eq('email', cleanEmail);

      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // On Success: Reset failed attempts & lockouts
    await supabaseAdmin
      .from('teacher_whitelist')
      .update({ failed_attempt_count: 0, locked_until: null })
      .eq('email', cleanEmail);

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

// 4. Forgot Password: Fetch Security Question
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
      .maybeSingle();

    if (!teacher || !teacher.security_question) {
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

// 5. Forgot Password: Reset Password using Security Answer
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
      .maybeSingle();

    if (!teacher || !teacher.security_answer_hash) {
      return res.status(400).json({ success: false, error: 'Incorrect answer or request could not be processed.' });
    }

    const cleanAnswer = answer.trim().toLowerCase();
    const isAnswerCorrect = await bcrypt.compare(cleanAnswer, teacher.security_answer_hash);

    if (!isAnswerCorrect) {
      return res.status(400).json({ success: false, error: 'Incorrect answer or request could not be processed.' });
    }

    // Reset password & clear lockouts
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabaseAdmin
      .from('teacher_whitelist')
      .update({
        password_hash: newPasswordHash,
        failed_attempt_count: 0,
        locked_until: null,
        password_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
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
