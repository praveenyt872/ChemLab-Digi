import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  role: null, // 'teacher' | 'student' | null
  activeRoleTab: 'student', // Initial default role selection view
  isVerifiedStudent: false,
  generatedCode: null,
  generatedCodeTime: null,
  isOffline: !navigator.onLine,
  authLoading: true,
  authError: null,

  // Listeners setup
  setOfflineStatus: (offline) => set({ isOffline: offline }),

  setRoleTab: (tab) => set({ activeRoleTab: tab, authError: null }),

  setAuthError: (error) => set({ authError: error }),

  clearAuthError: () => set({ authError: null }),

  // Initialize Auth
  initAuth: async () => {
    set({ authLoading: true });
    
    // Setup online/offline window listeners
    const handleOnline = () => set({ isOffline: false });
    const handleOffline = () => set({ isOffline: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      // 1. Try checking backend API /api/whoami
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

          // Check for active code if teacher
          if (data.role === 'teacher') {
            get().checkActiveCodeStatus();
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Backend API whoami check unavailable, checking Supabase session...');
    }

    // 2. Check Supabase OAuth session directly for students
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const studentEmail = session.user.email;
        // Check local storage for verified student session
        const savedCodeSession = localStorage.getItem(`chemlab_student_verified_${studentEmail}`);
        const isVerified = !!savedCodeSession;

        set({
          user: { email: studentEmail, role: 'student' },
          role: 'student',
          isVerifiedStudent: isVerified,
          authLoading: false
        });
        return;
      }
    } catch (sbErr) {
      console.error('Supabase session check error:', sbErr);
    }

    set({ user: null, role: null, isVerifiedStudent: false, authLoading: false });
  },

  // Check active access code status for teacher dashboard
  checkActiveCodeStatus: async () => {
    try {
      const res = await fetch('/api/access-code/active-status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (!data.hasActiveCode) {
          set({ generatedCode: null, generatedCodeTime: null });
        }
      }
    } catch (e) {
      // Ignore
    }
  },

  // 1. Teacher Setup (First-Time Password & Security Question)
  teacherSetup: async ({ email, password, securityQuestion, securityAnswer }) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/teacher/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, securityQuestion, securityAnswer })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Failed to set password.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({ authLoading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an active internet connection to complete account setup.' 
        : 'Network error. Please try again.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 2. Teacher Login
  teacherLogin: async ({ email, password }) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Invalid login credentials.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({
        user: data.user,
        role: 'teacher',
        isVerifiedStudent: true,
        authLoading: false,
        authError: null
      });

      get().checkActiveCodeStatus();
      return { success: true };
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an active internet connection to log in.' 
        : 'Network error during login. Please try again.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 3. Forgot Password: Get Question
  fetchSecurityQuestion: async (email) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/teacher/forgot-password/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Unable to process request.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({ authLoading: false });
      return { success: true, question: data.question };
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an internet connection to recover your password.' 
        : 'Network error. Please try again.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 4. Forgot Password: Reset
  resetTeacherPassword: async ({ email, answer, newPassword }) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/teacher/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Incorrect security answer.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({ authLoading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an internet connection to reset your password.' 
        : 'Network error. Please try again.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 5. Teacher Action: Generate 6-digit Access Code
  generateAccessCode: async () => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Failed to generate code.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({
        generatedCode: data.code,
        generatedCodeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        authLoading: false
      });
      return { success: true, code: data.code };
    } catch (err) {
      set({ authError: 'Network error generating code.', authLoading: false });
      return { success: false, error: 'Network error generating code.' };
    }
  },

  // 6. Teacher Action: End Code
  endAccessCode: async () => {
    set({ authLoading: true, authError: null });
    try {
      const res = await fetch('/api/end-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Failed to deactivate code.', authLoading: false });
        return { success: false, error: data.error };
      }

      set({
        generatedCode: null,
        generatedCodeTime: null,
        authLoading: false
      });
      return { success: true };
    } catch (err) {
      set({ authError: 'Network error deactivating code.', authLoading: false });
      return { success: false, error: 'Network error.' };
    }
  },

  // 7. Student Action: Verify 6-digit Access Code
  verifyStudentCode: async (code) => {
    set({ authLoading: true, authError: null });
    const currentEmail = get().user?.email || 'student@guest.com';

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, email: currentEmail })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ authError: data.error || 'Incorrect access code.', authLoading: false });
        return { success: false, error: data.error };
      }

      localStorage.setItem(`chemlab_student_verified_${currentEmail}`, 'true');

      set({
        isVerifiedStudent: true,
        authLoading: false,
        authError: null
      });

      return { success: true };
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an internet connection to verify access code.' 
        : 'Network error verifying code. Please try again.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 8. Student Google Login
  studentGoogleLogin: async () => {
    set({ authLoading: true, authError: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        set({ authError: error.message, authLoading: false });
        return { success: false, error: error.message };
      }
    } catch (err) {
      const msg = !navigator.onLine 
        ? 'You need an internet connection to log in with Google.' 
        : 'Error launching Google sign-in.';
      set({ authError: msg, authLoading: false });
      return { success: false, error: msg };
    }
  },

  // 9. Logout
  logout: async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    const currentEmail = get().user?.email;
    if (currentEmail) {
      localStorage.removeItem(`chemlab_student_verified_${currentEmail}`);
    }
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
