import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, KeyRound, HelpCircle, ArrowLeft, CheckCircle2, AlertCircle, WifiOff } from 'lucide-react';

const PRESET_QUESTIONS = [
  'What was your first childhood pet name?',
  'What is the name of your elementary school?',
  'What city were you born in?',
  'What is your favorite book title?',
  'What was the model of your first car?'
];

export function TeacherLogin() {
  const [mode, setMode] = useState('login'); // 'login' | 'setup' | 'forgot-question' | 'forgot-answer'
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(PRESET_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Reset flow fields
  const [recoveredQuestion, setRecoveredQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    teacherLogin,
    teacherSetup,
    fetchSecurityQuestion,
    resetTeacherPassword,
    authLoading,
    authError,
    clearAuthError,
    isOffline
  } = useAuthStore();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSuccessMsg('');
    clearAuthError();
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const res = await teacherLogin({ email, password });
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
    }
  };

  // 2. Submit First-Time Setup
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
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
      setTimeout(() => handleModeChange('login'), 2000);
    }
  };

  // 3. Submit Forgot Password Email Check
  const handleForgotQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    const res = await fetchSecurityQuestion(email);
    if (res.success && res.question) {
      setRecoveredQuestion(res.question);
      handleModeChange('forgot-answer');
    }
  };

  // 4. Submit Reset Password
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
      setTimeout(() => handleModeChange('login'), 2500);
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
          {mode === 'login' && 'Faculty Portal Login'}
          {mode === 'setup' && 'First-Time Account Setup'}
          {mode === 'forgot-question' && 'Password Recovery'}
          {mode === 'forgot-answer' && 'Reset Your Password'}
        </h3>
        <p className="text-sm text-slate-500">
          {mode === 'login' && 'Log in with your whitelisted faculty credentials'}
          {mode === 'setup' && 'Set up your password & security recovery question'}
          {mode === 'forgot-question' && 'Enter your faculty email to fetch your security question'}
          {mode === 'forgot-answer' && 'Answer your security question to set a new password'}
        </p>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>You need an active internet connection to authenticate.</span>
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

      {/* MODE 1: LOGIN */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Faculty Email
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

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => handleModeChange('setup')}
              className="text-violet-600 hover:underline font-semibold cursor-pointer"
            >
              First-time setup? Set password
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('forgot-question')}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* MODE 2: FIRST-TIME SETUP */}
      {mode === 'setup' && (
        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Whitelisted Faculty Email
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
            <p className="text-[11px] text-slate-400 mt-1">
              For extra safety, choose an answer only you'd know, not something guessable from your public profile.
            </p>
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline}
            className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {authLoading ? 'Completing Setup...' : 'Complete Account Setup'}
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </form>
      )}

      {/* MODE 3: FORGOT PASSWORD - STEP 1 EMAIL */}
      {mode === 'forgot-question' && (
        <form onSubmit={handleForgotQuestionSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Whitelisted Faculty Email
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
            onClick={() => handleModeChange('login')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </form>
      )}

      {/* MODE 4: FORGOT PASSWORD - STEP 2 ANSWER & NEW PASSWORD */}
      {mode === 'forgot-answer' && (
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
            onClick={() => handleModeChange('login')}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        </form>
      )}

    </div>
  );
}
