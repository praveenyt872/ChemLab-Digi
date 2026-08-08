import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

const normEmail = (email) => (email || '').trim().toLowerCase();

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null, // 'teacher' | 'student' | null
  activeRoleTab: 'student',
  isVerifiedStudent: false,
  generatedCode: null,
  generatedCodeTime: null,
  isOffline: !navigator.onLine,
  authLoading: true,
  authError: null,

  setOfflineStatus: (offline) => set({ isOffline: offline }),
  setRoleTab: (tab) => set({ activeRoleTab: tab, authError: null }),
  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null }),

  initAuth: async () => {
    set({ authLoading: true });

    const handleOnline = () => set({ isOffline: false });
    const handleOffline = () => set({ isOffline: true });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 1. Check saved teacher session in localStorage
    try {
      const savedTeacher = localStorage.getItem('chemlab_teacher_session');
      if (savedTeacher) {
        const teacherObj = JSON.parse(savedTeacher);
        if (teacherObj && teacherObj.email) {
          set({
            user: { email: teacherObj.email, role: 'teacher' },
            role: 'teacher',
            isVerifiedStudent: true,
            authLoading: false
          });
          get().checkActiveCodeStatus();
          return;
        }
      }
    } catch (e) {}

    // 2. Check Express backend /api/whoami if running
    try {
      const res = await fetch('/api/whoami', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.role) {
          set({
            user: { email: data.email, role: data.role },
            role: data.role,
            isVerifiedStudent: data.role === 'teacher' || !!data.verified,
            authLoading: false
          });
          if (data.role === 'teacher') get().checkActiveCodeStatus();
          return;
        }
      }
    } catch (e) {}

    // 3. Check Supabase Auth session for Google OAuth (Student)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const studentEmail = session.user.email;
        const savedVerified = localStorage.getItem(`chemlab_student_verified_${studentEmail}`);

        set({
          user: { email: studentEmail, role: 'student' },
          role: 'student',
          isVerifiedStudent: !!savedVerified,
          authLoading: false
        });
        return;
      }
    } catch (e) {}

    set({ user: null, role: null, isVerifiedStudent: false, authLoading: false });
  },

  checkActiveCodeStatus: async () => {
    try {
      const { data: activeCode } = await supabase
        .from('access_code')
        .select('id, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!activeCode) {
        set({ generatedCode: null, generatedCodeTime: null });
      }
    } catch (e) {}
  },

  // Teacher First-Time Setup
  teacherSetup: async ({ email, password, securityQuestion, securityAnswer }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password || !securityQuestion || !securityAnswer) {
      const err = 'All fields are required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    if (password.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    // Try Express backend first if available
    try {
      const res = await fetch('/api/teacher/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, securityQuestion, securityAnswer })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          set({ authLoading: false });
          return { success: true, message: data.message };
        } else if (data.error) {
          set({ authError: data.error, authLoading: false });
          return { success: false, error: data.error };
        }
      }
    } catch (e) {}

    // Direct Supabase Client fallback for static hosting (GitHub Pages)
    try {
      const { data: teacher, error: fetchErr } = await supabase
        .from('teacher_whitelist')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchErr || !teacher) {
        const err = 'Email is not whitelisted for faculty access. Please contact administrator.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      if (teacher.password_hash) {
        const err = 'Account setup already completed. Please log in instead.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const answerHash = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);

      const { error: updateErr } = await supabase
        .from('teacher_whitelist')
        .update({
          password_hash: passwordHash,
          security_question: securityQuestion,
          security_answer_hash: answerHash
        })
        .eq('email', cleanEmail);

      if (updateErr) {
        console.error('Update teacher error:', updateErr);
        const err = 'Failed to save credentials. ' + updateErr.message;
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      set({ authLoading: false });
      return { success: true, message: 'Account setup complete! You can now log in with your password.' };
    } catch (err) {
      console.error('Setup error:', err);
      const msg = !navigator.onLine ? 'You need an active internet connection to set up your account.' : (err.message || 'Setup error.');
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // Teacher Login
  teacherLogin: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password) {
      const err = 'Email and password are required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    // Try Express backend first if available
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('chemlab_teacher_session', JSON.stringify(data.user));
          set({ user: data.user, role: 'teacher', isVerifiedStudent: true, authLoading: false });
          get().checkActiveCodeStatus();
          return { success: true };
        } else if (data.error) {
          set({ authError: data.error, authLoading: false });
          return { success: false, error: data.error };
        }
      }
    } catch (e) {}

    // Direct Supabase Client fallback for static hosting (GitHub Pages)
    try {
      const { data: teacher, error: fetchErr } = await supabase
        .from('teacher_whitelist')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchErr || !teacher) {
        const err = 'Invalid credentials or email not whitelisted.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      if (!teacher.password_hash) {
        const err = 'First-time setup required. Please click "First-time setup? Set password" below.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      const isMatch = await bcrypt.compare(password, teacher.password_hash);
      if (!isMatch) {
        const err = 'Invalid password. Please try again.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      const teacherUser = { email: teacher.email, role: 'teacher' };
      localStorage.setItem('chemlab_teacher_session', JSON.stringify(teacherUser));

      set({
        user: teacherUser,
        role: 'teacher',
        isVerifiedStudent: true,
        authLoading: false,
        authError: null
      });

      get().checkActiveCodeStatus();
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const msg = !navigator.onLine ? 'You need an active internet connection to log in.' : (err.message || 'Error logging in.');
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // Forgot Password: Get Question
  fetchSecurityQuestion: async (email) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    try {
      const { data: teacher } = await supabase
        .from('teacher_whitelist')
        .select('security_question')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!teacher || !teacher.security_question) {
        const err = 'Unable to process password recovery for this email.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      set({ authLoading: false });
      return { success: true, question: teacher.security_question };
    } catch (err) {
      const errStr = 'Unable to fetch security question.';
      set({ authError: errStr, authLoading: false });
      return { success: false, error: errStr };
    }
  },

  // Forgot Password: Reset
  resetTeacherPassword: async ({ email, answer, newPassword }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    try {
      const { data: teacher } = await supabase
        .from('teacher_whitelist')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!teacher || !teacher.security_answer_hash) {
        const err = 'Incorrect answer or request could not be processed.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      const cleanAnswer = answer.trim().toLowerCase();
      const isAnswerCorrect = await bcrypt.compare(cleanAnswer, teacher.security_answer_hash);
      if (!isAnswerCorrect) {
        const err = 'Incorrect security answer.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      const { error: updateErr } = await supabase
        .from('teacher_whitelist')
        .update({ password_hash: newPasswordHash })
        .eq('email', cleanEmail);

      if (updateErr) {
        set({ authError: 'Failed to update password.', authLoading: false });
        return { success: false, error: 'Failed to update password.' };
      }

      set({ authLoading: false });
      return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
    } catch (err) {
      const errStr = 'Error resetting password.';
      set({ authError: errStr, authLoading: false });
      return { success: false, error: errStr };
    }
  },

  // Generate 6-digit access code
  generateAccessCode: async () => {
    set({ authLoading: true, authError: null });
    const teacherEmail = get().user?.email || 'teacher@rajalakshmi.edu.in';

    try {
      const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(rawCode, 10);

      // Deactivate previous codes
      await supabase
        .from('access_code')
        .update({ active: false })
        .eq('active', true);

      // Insert new code
      const { data: newCode, error: insertErr } = await supabase
        .from('access_code')
        .insert({
          code_hash: codeHash,
          generated_by: teacherEmail,
          active: true
        })
        .select()
        .single();

      set({
        generatedCode: rawCode,
        generatedCodeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        authLoading: false
      });
      return { success: true, code: rawCode };
    } catch (err) {
      console.error('Generate code error:', err);
      set({ authError: 'Failed to generate code.', authLoading: false });
      return { success: false, error: 'Failed to generate code.' };
    }
  },

  // End Access Code
  endAccessCode: async () => {
    set({ authLoading: true, authError: null });
    try {
      await supabase
        .from('access_code')
        .update({ active: false })
        .eq('active', true);

      set({ generatedCode: null, generatedCodeTime: null, authLoading: false });
      return { success: true };
    } catch (err) {
      set({ authError: 'Failed to end code.', authLoading: false });
      return { success: false, error: 'Failed to end code.' };
    }
  },

  // Student verify code
  verifyStudentCode: async (code) => {
    set({ authLoading: true, authError: null });
    const cleanCode = (code || '').toString().trim();
    const studentEmail = get().user?.email || 'student@guest.com';

    try {
      const { data: activeCodes, error: fetchErr } = await supabase
        .from('access_code')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchErr || !activeCodes || activeCodes.length === 0) {
        const err = 'No active class session right now. Ask your teacher to generate a code.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      let matchedCode = null;
      for (const ac of activeCodes) {
        const isMatch = await bcrypt.compare(cleanCode, ac.code_hash);
        if (isMatch) {
          matchedCode = ac;
          break;
        }
      }

      if (!matchedCode) {
        const err = 'Incorrect 6-digit access code. Please check with your teacher.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      // Record student session
      try {
        await supabase
          .from('student_sessions')
          .insert({
            student_email: studentEmail,
            code_id: matchedCode.id
          });
      } catch (e) {}

      localStorage.setItem(`chemlab_student_verified_${studentEmail}`, 'true');

      set({
        isVerifiedStudent: true,
        authLoading: false,
        authError: null
      });

      return { success: true };
    } catch (err) {
      console.error('Verify error:', err);
      const msg = !navigator.onLine ? 'You need an active internet connection to verify access code.' : 'Error verifying code.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // Student Google Login
  studentGoogleLogin: async () => {
    set({ authLoading: true, authError: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });
      if (error) {
        set({ authError: error.message, authLoading: false });
        return { success: false, error: error.message };
      }
    } catch (err) {
      const msg = !navigator.onLine ? 'You need an active internet connection to sign in with Google.' : 'Google sign in error.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // Logout
  logout: async () => {
    localStorage.removeItem('chemlab_teacher_session');
    const currentEmail = get().user?.email;
    if (currentEmail) {
      localStorage.removeItem(`chemlab_student_verified_${currentEmail}`);
    }
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      await supabase.auth.signOut();
    } catch (e) {}

    set({
      user: null,
      role: null,
      isVerifiedStudent: false,
      generatedCode: null,
      generatedCodeTime: null,
      authError: null
    });
  }
}));
