import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify teacher authorization
const requireTeacher = async (req, res, next) => {
  try {
    const token = req.cookies.chemlab_session || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ success: false, error: 'Teacher authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'teacher' || !decoded.email) {
      return res.status(403).json({ success: false, error: 'Forbidden: Teacher access required.' });
    }

    // Double check email is in whitelist
    const { data: teacher } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('email')
      .eq('email', decoded.email.trim().toLowerCase())
      .single();

    if (!teacher) {
      return res.status(403).json({ success: false, error: 'Teacher email is not whitelisted.' });
    }

    req.teacherEmail = teacher.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired teacher session.' });
  }
};

// 1. Generate 6-digit access code (Teacher-only)
router.post('/generate-code', requireTeacher, async (req, res) => {
  try {
    // Generate 6-digit random code
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);

    // Deactivate previous active codes
    await supabaseAdmin
      .from('access_code')
      .update({ active: false })
      .eq('active', true);

    // Insert new active access code
    const { data: newCode, error: insertErr } = await supabaseAdmin
      .from('access_code')
      .insert({
        code_hash: codeHash,
        generated_by: req.teacherEmail,
        active: true
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('Error inserting access code:', insertErr);
      return res.status(500).json({ success: false, error: 'Failed to generate access code.' });
    }

    // Return plaintext code to frontend for display on teacher dashboard
    return res.json({
      success: true,
      code: rawCode,
      codeId: newCode.id,
      generatedBy: req.teacherEmail,
      createdAt: newCode.created_at
    });
  } catch (err) {
    console.error('Generate code error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while generating code.' });
  }
});

// 2. End active code (Teacher-only)
router.post('/end-code', requireTeacher, async (req, res) => {
  try {
    const { error: updateErr } = await supabaseAdmin
      .from('access_code')
      .update({ active: false })
      .eq('active', true);

    if (updateErr) {
      console.error('Error deactivating access code:', updateErr);
      return res.status(500).json({ success: false, error: 'Failed to deactivate access code.' });
    }

    return res.json({
      success: true,
      message: 'Active classroom session access code deactivated successfully.'
    });
  } catch (err) {
    console.error('End code error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while ending code.' });
  }
});

// 3. Get active access code status (Returns active status boolean and created_at without exposing plaintext/hash)
router.get('/active-status', async (req, res) => {
  try {
    const { data: activeCode } = await supabaseAdmin
      .from('access_code')
      .select('id, created_at, generated_by')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return res.json({
      success: true,
      hasActiveCode: !!activeCode,
      createdAt: activeCode ? activeCode.created_at : null
    });
  } catch (err) {
    return res.json({ success: true, hasActiveCode: false });
  }
});

export default router;
