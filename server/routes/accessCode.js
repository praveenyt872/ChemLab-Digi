import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chemlab_secret_jwt_key_2026';

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

    const { data: teacher } = await supabaseAdmin
      .from('teacher_whitelist')
      .select('email')
      .eq('email', decoded.email.trim().toLowerCase())
      .maybeSingle();

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
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const nowIso = new Date().toISOString();

    // Deactivate previous active codes in both active_code and access_code
    await supabaseAdmin
      .from('active_code')
      .update({ is_active: false, ended_at: nowIso })
      .eq('is_active', true);

    await supabaseAdmin
      .from('access_code')
      .update({ active: false, is_active: false, ended_at: nowIso })
      .eq('active', true);

    // Insert new active access code in active_code
    const { data: newCode, error: insertErr } = await supabaseAdmin
      .from('active_code')
      .insert({
        code: rawCode,
        code_hash: codeHash,
        created_by: req.teacherEmail,
        is_active: true
      })
      .select('id, created_at')
      .single();

    // Sync to access_code table for backward compatibility
    try {
      await supabaseAdmin
        .from('access_code')
        .insert({
          id: newCode.id,
          code: rawCode,
          code_hash: codeHash,
          generated_by: req.teacherEmail,
          active: true,
          is_active: true
        });
    } catch (e) {}

    if (insertErr) {
      console.error('Error inserting access code:', insertErr);
      return res.status(500).json({ success: false, error: 'Failed to generate access code.' });
    }

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
    const nowIso = new Date().toISOString();

    // Set is_active = false and ended_at = now() on active_code and access_code
    const { error: updateErr1 } = await supabaseAdmin
      .from('active_code')
      .update({ is_active: false, ended_at: nowIso })
      .eq('is_active', true);

    const { error: updateErr2 } = await supabaseAdmin
      .from('access_code')
      .update({ active: false, is_active: false, ended_at: nowIso })
      .eq('active', true);

    // Mark active student_sessions as is_active: false
    try {
      await supabaseAdmin
        .from('student_sessions')
        .update({ is_active: false })
        .eq('is_active', true);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Active classroom session access code deactivated successfully.'
    });
  } catch (err) {
    console.error('End code error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while ending code.' });
  }
});

// 3. Get active access code status
router.get('/active-status', async (req, res) => {
  try {
    const { data: activeCode } = await supabaseAdmin
      .from('active_code')
      .select('id, created_at, created_by')
      .eq('is_active', true)
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
