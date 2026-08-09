import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { KeyRound, ShieldAlert, WifiOff, Lock, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';

export function StudentGate({ children }) {
  const {
    user,
    isVerifiedStudent,
    verifyStudentCode,
    authLoading,
    authError,
    isOffline,
    logout,
    ejectionToastMessage
  } = useAuthStore();
  const [code, setCode] = useState('');

  // If student has verified their 6-digit access code (or user is teacher), grant access!
  if (isVerifiedStudent) {
    return <>{children}</>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;
    await verifyStudentCode(code);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl shadow-slate-200/60 max-w-md w-full mx-auto space-y-6">
        
        {/* Top Lock Badge */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-100 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Classroom Access Gate
          </h2>
          <p className="text-xs text-slate-500">
            Signed in as <span className="font-semibold text-slate-800">{user?.email}</span>
          </p>
        </div>

        {/* Ejection Toast Notice (FLAW 2) */}
        {ejectionToastMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-medium">{ejectionToastMessage}</span>
          </div>
        )}

        {/* Offline Notice */}
        {isOffline && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <span>You need an active internet connection to verify access code.</span>
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Code Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center">
              Enter 6-Digit Class Access Code
            </label>

            <input
              type="text"
              maxLength={6}
              required
              pattern="[0-9]{6}"
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center text-3xl font-bold tracking-[0.5em] font-mono px-4 py-4 rounded-2xl border-2 border-slate-200 text-slate-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-600 transition-all uppercase placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-base"
            />
            <p className="text-[11px] text-slate-400 text-center">
              Ask your faculty instructor for today's active classroom session code.
            </p>
          </div>

          <button
            type="submit"
            disabled={authLoading || isOffline || code.length !== 6}
            className="w-full py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-violet-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? 'Verifying Code...' : 'Verify & Enter Lab'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Sign Out Option */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
          >
            Not your Google account? <span className="underline">Sign out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
