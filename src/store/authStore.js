import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import bcrypt from 'bcryptjs';

const TEACHER_WHITELIST = [
  'hod.chem@rajalakshmi.edu.in',
  'jeffithmanohar.e.2024.chem@rajalakshmi.edu.in',
  'praveenyt872@gmail.com',
  'praveen.r.2024.chem@rajalakshmi.edu.in',
  'shrivarshini.n.2024.chem@rajalakshmi.edu.in',
  'samyuktha.g.2024.chem@rajalakshmi.edu.in',
  'rahealcatherine.v.2024.chem@rajalakshmi.edu.in',
  'mangaleswari.s@rajalakshmi.edu.in',
  'sundararaman.tr@rajalakshmi.edu.in',
  'narasimhareddy.s@rajalakshmi.edu.in',
  'seelamnarasimhareddy@rajalakshmi.edu.in',
  'rameschandrapanda@rajalakshmi.edu.in',
  'vijayaraghavan.g@rajalakshmi.edu.in',
  'maryrosana.nt@rajalakshmi.edu.in',
  'vincentjoseph.kl@rajalakshmi.edu.in',
  'ambigadevi.j@rajalakshmi.edu.in',
  'sivamani.s@rajalakshmi.edu.in'
];

const normEmail = (email) => (email || '').trim().toLowerCase();

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://lab-flow-ai-nine.vercel.app').replace(/\/$/, '');
const getApiUrl = (path) => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return path;
  }
  return `${API_BASE}${path}`;
};

const getLocalTeacherPasswords = () => {
  try {
    return JSON.parse(localStorage.getItem('chemlab_teacher_passwords') || '{}');
  } catch (e) {
    return {};
  }
};

const saveLocalTeacherPassword = (email, data) => {
  try {
    const store = getLocalTeacherPasswords();
    store[email] = { ...store[email], ...data };
    localStorage.setItem('chemlab_teacher_passwords', JSON.stringify(store));
  } catch (e) {}
};

let realtimeChannel = null;
let pollingInterval = null;

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
  ejectionToastMessage: null,

  setOfflineStatus: (offline) => set({ isOffline: offline }),
  setRoleTab: (tab) => set({ activeRoleTab: tab, authError: null }),
  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null }),
  clearEjectionToast: () => set({ ejectionToastMessage: null }),

  initAuth: async () => {
    set({ authLoading: true, authError: null });

    const handleOnline = () => set({ isOffline: false });
    const handleOffline = () => set({ isOffline: true });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 1. Check saved teacher session
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

    // 2. Check Express / Vercel backend session if available
    try {
      const res = await fetch('/api/whoami', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.role === 'teacher') {
          set({
            user: { email: data.email, role: 'teacher' },
            role: 'teacher',
            isVerifiedStudent: true,
            authLoading: false
          });
          get().checkActiveCodeStatus();
          return;
        }
      }
    } catch (e) {}

    // 3. Check Supabase Auth session for Google OAuth (Student)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const studentEmail = session.user.email;
        const userId = session.user.id || studentEmail;

        // Clean OAuth hash from address bar if returning from OAuth redirect
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Validate Student Access against active_code & student_sessions (FLAW 3)
        const isAccessValid = await get().validateStudentAccess(userId, studentEmail);

        set({
          user: { email: studentEmail, id: userId, role: 'student' },
          role: 'student',
          isVerifiedStudent: isAccessValid,
          authLoading: false
        });

        if (isAccessValid) {
          get().subscribeToActiveCodeWatch();
        }
        return;
      }
    } catch (e) {}

    set({ user: null, role: null, isVerifiedStudent: false, authLoading: false });
  },

  // FLAW 3: Validate student access against current active_code
  validateStudentAccess: async (userId, studentEmail) => {
    try {
      const targetUser = userId || studentEmail;

      // Query latest active student session
      const { data: studentSession, error: sErr } = await supabase
        .from('student_sessions')
        .select('authorized_code, code_row_id, is_active')
        .eq('user_id', targetUser)
        .eq('is_active', true)
        .order('authorized_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Query current active code
      let activeCode = null;

      const { data: acData } = await supabase
        .from('active_code')
        .select('id, code, is_active')
        .eq('is_active', true)
        .maybeSingle();

      if (acData) {
        activeCode = acData;
      } else {
        const { data: legacyCode } = await supabase
          .from('access_code')
          .select('id, code, active')
          .eq('active', true)
          .maybeSingle();
        if (legacyCode) {
          activeCode = { id: legacyCode.id, code: legacyCode.code, is_active: legacyCode.active };
        }
      }

      if (!studentSession || !activeCode) return false;
      if (studentSession.code_row_id && studentSession.code_row_id !== activeCode.id) return false;

      return true;
    } catch (err) {
      console.error('validateStudentAccess error:', err);
      return false;
    }
  },

  // FLAW 2: Subscribe to Realtime Updates + Fallback Polling on active_code
  subscribeToActiveCodeWatch: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    // 1. Supabase Realtime Listener
    try {
      realtimeChannel = supabase
        .channel('active-code-watch')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'active_code' },
          (payload) => {
            if (payload.new && payload.new.is_active === false) {
              get().handleForcedLogout('Your session ended because the teacher closed access.');
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'access_code' },
          (payload) => {
            if (payload.new && (payload.new.active === false || payload.new.is_active === false)) {
              get().handleForcedLogout('Your session ended because the teacher closed access.');
            }
          }
        )
        .subscribe();
    } catch (e) {}

    // 2. Fallback Polling every 25 seconds
    pollingInterval = setInterval(async () => {
      if (get().role === 'student' && get().isVerifiedStudent) {
        const { user } = get();
        const isValid = await get().validateStudentAccess(user?.id || user?.email, user?.email);
        if (!isValid) {
          get().handleForcedLogout('Your session ended because the teacher closed access.');
        }
      }
    }, 25000);
  },

  // FLAW 2: Handle Forced Student Logout
  handleForcedLogout: async (message) => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    set({
      isVerifiedStudent: false,
      ejectionToastMessage: message || 'Your session ended because the teacher closed access.'
    });

    // Auto-clear toast message after 4 seconds
    setTimeout(() => {
      set({ ejectionToastMessage: null });
    }, 4000);
  },

  // FLAW 1: Check Teacher Email Status (Step 1)
  checkTeacherStatus: async (email) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail) {
      const err = 'Email is required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    // Call API endpoint first
    try {
      const res = await fetch('/api/teacher/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (res.ok) {
        const data = await res.json();
        set({ authLoading: false });
        if (data.exists === false) {
          const msg = 'This email is not registered by your department. Contact admin.';
          set({ authError: msg });
          return { success: true, exists: false, error: msg };
        }
        return data;
      }
    } catch (e) {}

    // Supabase RPC fallback
    try {
      const { data: rpcRes, error: rpcErr } = await supabase
        .rpc('check_teacher_status', { p_email: cleanEmail });

      if (!rpcErr && rpcRes) {
        set({ authLoading: false });
        if (rpcRes.exists === false) {
          const msg = 'This email is not registered by your department. Contact admin.';
          set({ authError: msg });
          return { success: true, exists: false, error: msg };
        }
        return {
          success: true,
          exists: rpcRes.exists,
          needsSetup: rpcRes.needs_setup,
          isLocked: rpcRes.is_locked,
          lockRemainingSeconds: rpcRes.lock_remaining_seconds
        };
      }
    } catch (e) {}

    // Whitelist array check fallback
    const isWhitelisted = TEACHER_WHITELIST.includes(cleanEmail);

    // Query Supabase table for password_hash
    try {
      const { data: teacher, error: tableErr } = await supabase
        .from('teacher_whitelist')
        .select('email, password_hash')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (tableErr) {
        console.error('teacher_whitelist table query error:', tableErr);
      }

      if (!isWhitelisted && !teacher) {
        const msg = 'This email is not registered by your department. Contact admin.';
        set({ authError: msg, authLoading: false });
        return { success: true, exists: false, error: msg };
      }

      let isLocked = false;
      let lockRemainingSeconds = 0;

      // Safely check locked_until if column exists
      try {
        const { data: lockData } = await supabase
          .from('teacher_whitelist')
          .select('locked_until')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (lockData && lockData.locked_until && new Date(lockData.locked_until) > new Date()) {
          isLocked = true;
          lockRemainingSeconds = Math.ceil((new Date(lockData.locked_until) - new Date()) / 1000);
        }
      } catch (lErr) {}

      const hasPassword = !!(teacher && teacher.password_hash);

      set({ authLoading: false });
      return {
        success: true,
        exists: true,
        needsSetup: !hasPassword,
        isLocked,
        lockRemainingSeconds
      };
    } catch (e) {
      console.error('checkTeacherStatus fallback error:', e);
      set({ authLoading: false });
      return {
        success: true,
        exists: isWhitelisted,
        needsSetup: true
      };
    }
  },

  // FLAW 1: Teacher First-Time Setup
  teacherSetup: async ({ email, password, securityQuestion, securityAnswer }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password || !securityQuestion || !securityAnswer) {
      const err = 'All fields are required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    if (!TEACHER_WHITELIST.includes(cleanEmail)) {
      const err = 'This email is not registered by your department. Contact administrator.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    if (password.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const answerHash = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);

    // Save to local browser storage fallback immediately
    saveLocalTeacherPassword(cleanEmail, {
      passwordHash,
      securityQuestion,
      answerHash
    });

    // Call API endpoint first
    try {
      const res = await fetch(getApiUrl('/api/teacher/set-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, securityQuestion, securityAnswer })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          set({ authLoading: false });
          return { success: true, message: data.message || 'Account setup complete! You can now log in with your password.' };
        }
      }
    } catch (e) {}

    // Direct Supabase setup fallback
    try {
      await supabase
        .from('teacher_whitelist')
        .update({
          password_hash: passwordHash
        })
        .eq('email', cleanEmail);
    } catch (err) {}

    set({ authLoading: false });
    return { success: true, message: 'Account setup complete! You can now log in with your password.' };
  },

  // FLAW 1: Teacher Login
  teacherLogin: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !password) {
      const err = 'Email and password are required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    if (!TEACHER_WHITELIST.includes(cleanEmail)) {
      const err = 'This email is not registered by your department. Contact administrator.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    // Call API endpoint first
    try {
      const res = await fetch(getApiUrl('/api/teacher/login'), {
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
        } else if (data.error && !data.error.includes('Invalid')) {
          set({ authError: data.error, authLoading: false });
          return { success: false, error: data.error };
        }
      }
    } catch (e) {}

    // 1. Check LocalStorage fallback first
    const localStore = getLocalTeacherPasswords();
    const localRecord = localStore[cleanEmail];

    if (localRecord && localRecord.passwordHash) {
      const isMatch = await bcrypt.compare(password, localRecord.passwordHash);
      if (isMatch) {
        const teacherUser = { email: cleanEmail, role: 'teacher' };
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
      } else {
        const err = 'Invalid email or password.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }
    }

    // 2. Direct Supabase login fallback
    try {
      const { data: teacher, error: fetchErr } = await supabase
        .from('teacher_whitelist')
        .select('email, password_hash')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!fetchErr && teacher && teacher.password_hash) {
        const isMatch = await bcrypt.compare(password, teacher.password_hash);
        if (isMatch) {
          const teacherUser = { email: cleanEmail, role: 'teacher' };
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
        } else {
          const err = 'Invalid email or password.';
          set({ authError: err, authLoading: false });
          return { success: false, error: err };
        }
      }
    } catch (err) {}

    // If no password is found in local storage or Supabase table
    const err = "No password has been set up for this email yet. Click 'First-time setup? Set password' below to set your password.";
    set({ authError: err, authLoading: false });
    return { success: false, error: err };
  },

  // Forgot Password: Get Question
  fetchSecurityQuestion: async (email) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!TEACHER_WHITELIST.includes(cleanEmail)) {
      const err = 'This email is not registered by your department. Contact administrator.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    // Check LocalStorage fallback first
    const localStore = getLocalTeacherPasswords();
    if (localStore[cleanEmail] && localStore[cleanEmail].securityQuestion) {
      set({ authLoading: false });
      return { success: true, question: localStore[cleanEmail].securityQuestion };
    }

    try {
      const res = await fetch(getApiUrl('/api/teacher/forgot-password/question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question) {
          set({ authLoading: false });
          return { success: true, question: data.question };
        }
      }
    } catch (e) {}

    const defaultQuestion = 'What is your registered faculty security question?';
    set({ authLoading: false });
    return { success: true, question: defaultQuestion };
  },

  // Forgot Password: Reset
  resetTeacherPassword: async ({ email, answer, newPassword }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    if (!cleanEmail || !answer || !newPassword) {
      const err = 'All fields are required.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    if (newPassword.length < 6) {
      const err = 'New password must be at least 6 characters long.';
      set({ authError: err, authLoading: false });
      return { success: false, error: err };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // Update LocalStorage fallback
    const localStore = getLocalTeacherPasswords();
    if (localStore[cleanEmail]) {
      const savedHash = localStore[cleanEmail].answerHash;
      if (savedHash) {
        const isMatch = await bcrypt.compare(answer.trim().toLowerCase(), savedHash);
        if (!isMatch) {
          const err = 'Incorrect security answer.';
          set({ authError: err, authLoading: false });
          return { success: false, error: err };
        }
      }
    }

    saveLocalTeacherPassword(cleanEmail, { passwordHash: newHash });

    // Call API endpoint first
    try {
      const res = await fetch(getApiUrl('/api/teacher/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, answer, newPassword })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          set({ authLoading: false });
          return { success: true, message: data.message || 'Password reset successfully! You can now log in.' };
        }
      }
    } catch (e) {}

    set({ authLoading: false });
    return { success: true, message: 'Password reset successfully! You can now log in.' };
  },

  // Forgot Password: Reset
  resetTeacherPassword: async ({ email, answer, newPassword }) => {
    set({ authLoading: true, authError: null });
    const cleanEmail = normEmail(email);

    try {
      const res = await fetch('/api/teacher/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, answer, newPassword })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          set({ authLoading: false });
          return { success: true, message: data.message };
        }
      }
    } catch (e) {}

    try {
      const { data: teacher } = await supabase
        .from('teacher_whitelist')
        .select('security_answer_hash')
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
      await supabase
        .from('teacher_whitelist')
        .update({
          password_hash: newPasswordHash,
          failed_attempt_count: 0,
          locked_until: null,
          password_set_at: new Date().toISOString()
        })
        .eq('email', cleanEmail);

      set({ authLoading: false });
      return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
    } catch (err) {
      const errStr = 'Error resetting password.';
      set({ authError: errStr, authLoading: false });
      return { success: false, error: errStr };
    }
  },

  // Check Active Code Status (Teacher Dashboard)
  checkActiveCodeStatus: async () => {
    try {
      const { data: activeCode } = await supabase
        .from('active_code')
        .select('id, code, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeCode) {
        const timeStr = new Date(activeCode.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        set({ generatedCode: activeCode.code, generatedCodeTime: timeStr });
      } else {
        const { data: legacyCode } = await supabase
          .from('access_code')
          .select('id, code, created_at')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (legacyCode) {
          const timeStr = new Date(legacyCode.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          set({ generatedCode: legacyCode.code, generatedCodeTime: timeStr });
        } else {
          set({ generatedCode: null, generatedCodeTime: null });
        }
      }
    } catch (e) {}
  },

  // Generate 6-digit access code (Teacher)
  generateAccessCode: async () => {
    set({ authLoading: true, authError: null });
    const teacherEmail = get().user?.email || 'teacher@rajalakshmi.edu.in';

    try {
      const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(rawCode, 10);
      const codeTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowIso = new Date().toISOString();

      // Deactivate previous codes
      try {
        await supabase
          .from('active_code')
          .update({ is_active: false, ended_at: nowIso })
          .eq('is_active', true);

        await supabase
          .from('access_code')
          .update({ active: false, is_active: false, ended_at: nowIso })
          .eq('active', true);
      } catch (e) {}

      // Insert new active code
      const { data: newCode } = await supabase
        .from('active_code')
        .insert({
          code: rawCode,
          code_hash: codeHash,
          created_by: teacherEmail,
          is_active: true
        })
        .select()
        .single();

      try {
        await supabase
          .from('access_code')
          .insert({
            id: newCode ? newCode.id : undefined,
            code: rawCode,
            code_hash: codeHash,
            generated_by: teacherEmail,
            active: true,
            is_active: true
          });
      } catch (e) {}

      set({
        generatedCode: rawCode,
        generatedCodeTime: codeTime,
        authLoading: false
      });
      return { success: true, code: rawCode };
    } catch (err) {
      console.error('Generate code error:', err);
      set({ authError: 'Failed to generate code.', authLoading: false });
      return { success: false, error: 'Failed to generate code.' };
    }
  },

  // FLAW 2: End Access Code (Teacher)
  endAccessCode: async () => {
    set({ authLoading: true, authError: null });
    const nowIso = new Date().toISOString();

    try {
      await supabase
        .from('active_code')
        .update({ is_active: false, ended_at: nowIso })
        .eq('is_active', true);

      await supabase
        .from('access_code')
        .update({ active: false, is_active: false, ended_at: nowIso })
        .eq('active', true);

      await supabase
        .from('student_sessions')
        .update({ is_active: false })
        .eq('is_active', true);
    } catch (e) {}

    set({ generatedCode: null, generatedCodeTime: null, authLoading: false });
    return { success: true };
  },

  // FLAW 3: Student verify 6-digit code
  verifyStudentCode: async (code) => {
    set({ authLoading: true, authError: null });
    const cleanCode = (code || '').toString().trim();
    const studentEmail = get().user?.email || 'student@guest.com';
    const userId = get().user?.id || studentEmail;

    try {
      // 1. Fetch active code from DB
      let activeCode = null;

      const { data: acData } = await supabase
        .from('active_code')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (acData) {
        activeCode = acData;
      } else {
        const { data: legacyCode } = await supabase
          .from('access_code')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (legacyCode) activeCode = legacyCode;
      }

      if (!activeCode) {
        const err = 'No active class session right now. Ask your teacher to generate a code.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      // 2. Validate Code (plaintext or bcrypt hash)
      let isMatch = false;
      if (activeCode.code && activeCode.code === cleanCode) {
        isMatch = true;
      } else if (activeCode.code_hash) {
        isMatch = await bcrypt.compare(cleanCode, activeCode.code_hash);
      }

      if (!isMatch) {
        const err = 'Incorrect 6-digit access code. Please check with your teacher.';
        set({ authError: err, authLoading: false });
        return { success: false, error: err };
      }

      // 3. Mark previous student sessions as is_active: false
      try {
        await supabase
          .from('student_sessions')
          .update({ is_active: false })
          .eq('user_id', userId);
      } catch (e) {}

      // 4. Insert new student session row (FLAW 3)
      try {
        await supabase
          .from('student_sessions')
          .insert({
            user_id: userId,
            student_email: studentEmail,
            authorized_code: cleanCode,
            code_row_id: activeCode.id,
            authorized_at: new Date().toISOString(),
            is_active: true
          });
      } catch (e) {}

      set({
        isVerifiedStudent: true,
        authLoading: false,
        authError: null
      });

      // Start Realtime ejection listener (FLAW 2)
      get().subscribeToActiveCodeWatch();

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
      const targetUrl = window.location.origin + window.location.pathname;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl
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
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }

    localStorage.removeItem('chemlab_teacher_session');
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
