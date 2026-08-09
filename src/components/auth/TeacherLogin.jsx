import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, KeyRound, HelpCircle, ArrowLeft, CheckCircle2, AlertCircle, WifiOff, ArrowRight } from 'lucide-react';

const PRESET_QUESTIONS = [
  'What was your first childhood pet name?',
  'What is the name of your elementary school?',
  'What city were you born in?',
  'What is your favorite book title?',
  'What was the model of your first car?'
];

export function TeacherLogin() {
  // Steps: 'email' | 'login' | 'setup' | 'forgot-question' | 'forgot-answer'
  const [step, setStep] = useState('email');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(PRESET_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Reset flow fields
  const [recoveredQuestion, setRecoveredQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lockoutMsg, setLockoutMsg] = useState('');

  const {
    checkTeacherStatus,
    teacherLogin,
    teacherSetup,
    fetchSecurityQuestion,
    resetTeacherPassword,
    authLoading,
    authError,
    clearAuthError,
    isOffline
  } = useAuthStore();

  const handleStepChange = (newStep) => {
    setStep(newStep);
    setSuccessMsg('');
    setLockoutMsg('');
    clearAuthError();
  };

  // STEP 1: Submit Email Check
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const res = await checkTeacherStatus(email);
    if (!res) return;

    if (res.exists === false) {
      // Error message is set in store: "This email is not registered by your department. Contact admin."
      return;
    }

    if (res.isLocked) {
      const remMin = Math.ceil(res.lockRemainingSeconds / 60);
      setLockoutMsg(`Account locked due to too many failed attempts. Try again in ${remMin} minute(s).`);
      return;
    }

    if (res.needsSetup) {
      handleStepChange('setup');
    } else {
      handleStepChange('login');
    }
  };

  // STEP 2A: Submit First-Time Setup
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      useAuthStore.setState({ authError: 'Passwords do not match.' });
      return;
    }

    const finalQuestion = securityQuestion === 'custom' ? customQuestion : securityQuestion;
    if (!email || !password || !finalQuestion || !securityAnswer) return;

    const res = await teacherSetup({
      email,
      password,
      securityQuestion: finalQuestion,
      securityAnswer
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => handleStepChange('login'), 2000);
    } else if (res.needsSetup === false) {
      setTimeout(() => handleStepChange('login'), 2000);
    }
  };

  // STEP 2B: Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const res = await teacherLogin({ email, password });
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
    }
  };

  // FORGOT 1: Submit Email Check for Security Question
  const handleForgotQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const res = await fetchSecurityQuestion(email);
    if (res.success && res.question) {
      setRecoveredQuestion(res.question);
      handleStepChange('forgot-answer');
    }
  };

  // FORGOT 2: Submit Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!email || !resetAnswer || !newPassword) return;

    const res = await resetTeacherPassword({
      email,
      answer: resetAnswer,
      newPassword
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => handleStepChange('login'), 2500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 max-w-md w-full mx-auto space-y-6">
      
      {/* Header Icon & Title */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto mb-3 border border-violet-100 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          {step === 'email' && 'Faculty Access Check'}
          {step === 'login' && 'Faculty Portal Sign In'}
          {step === 'setup' && 'First-Time Account Setup'}
          {step === 'forgot-question' && 'Password Recovery'}
          {step === 'forgot-answer' && 'Reset Your Password'}
        </h3>
        <p className="text-sm text-slate-500">
          {step === 'email' && 'Enter your department-registered faculty email'}
          {step === 'login' && 'Enter your password to access the faculty dashboard'}
          {step === 'setup' && 'Set up your account password & security recovery question'}
          {step === 'forgot-question' && 'Enter your faculty email to fetch your security question'}
          {step === 'forgot-answer' && 'Answer your security question to set a new password'}
        </p>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>You need an active internet connection to authenticate.</span>
        </div>
      )}

      {/* Lockout Warning */}
      {lockoutMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{lockoutMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {authError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: EMAIL FIRST INPUT */}
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Faculty Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. praveenyt872@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline || !email}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? 'Verifying Email...' : 'Continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* STEP 2A: FIRST-TIME ACCOUNT SETUP */}
      {step === 'setup' && (
        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-xs text-violet-900 flex items-center justify-between">
            <span className="font-semibold truncate">{email}</span>
            <button
              type="button"
              onClick={() => handleStepChange('email')}
              className="text-violet-700 hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Create Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all mb-2"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Security Recovery Question
            </label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white mb-2"
            >
              {PRESET_QUESTIONS.map((q, i) => (
                <option key={i} value={q}>{q}</option>
              ))}
              <option value="custom">Write custom question...</option>
            </select>

            {securityQuestion === 'custom' && (
              <input
                type="text"
                required
                placeholder="Enter your custom security question"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all mb-2"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Security Question Answer
            </label>
            <input
              type="text"
              required
              placeholder="Answer (stored securely as a hash)"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? 'Completing Setup...' : 'Complete Account Setup'}
          </button>
        </form>
      )}

      {/* STEP 2B: LOGIN FORM */}
      {step === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span className="font-semibold text-slate-900 truncate">{email}</span>
            <button
              type="button"
              onClick={() => handleStepChange('email')}
              className="text-violet-600 hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
            >
              Change Email
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? 'Signing in...' : 'Sign In as Faculty'}
          </button>

          <div className="text-right text-xs pt-1">
            <button
              type="button"
              onClick={() => handleStepChange('forgot-question')}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD - STEP 1 EMAIL */}
      {step === 'forgot-question' && (
        <form onSubmit={handleForgotQuestionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Registered Faculty Email
            </label>
            <input
              type="email"
              required
              placeholder="e.g. praveenyt872@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? 'Fetching Question...' : 'Get Security Question'}
          </button>

          <button
            type="button"
            onClick={() => handleStepChange('email')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Email Check
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD - STEP 2 ANSWER & NEW PASSWORD */}
      {step === 'forgot-answer' && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">Security Question:</span>
            <p className="font-medium text-slate-900 text-sm">{recoveredQuestion}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Security Answer
            </label>
            <input
              type="text"
              required
              placeholder="Enter your security answer"
              value={resetAnswer}
              onChange={(e) => setResetAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? 'Resetting Password...' : 'Reset Password & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => handleStepChange('login')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </form>
      )}

    </div>
  );
}
