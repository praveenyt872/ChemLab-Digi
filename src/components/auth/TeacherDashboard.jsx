import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { KeyRound, Power, Copy, Check, Sparkles, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';

export function TeacherDashboard({ onEnterLab }) {
  const {
    user,
    generatedCode,
    generatedCodeTime,
    generateAccessCode,
    endAccessCode,
    authLoading,
    authError,
    logout
  } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleGenerate = async () => {
    setToastMsg('');
    const res = await generateAccessCode();
    if (res.success) {
      setToastMsg('New 6-digit class access code active!');
    }
  };

  const handleEndCode = async () => {
    const res = await endAccessCode();
    if (res.success) {
      setToastMsg('Code deactivated. New student logins blocked.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Faculty Control Console
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Classroom Access Management
            </h1>
            <p className="text-sm text-slate-300">
              Welcome, <span className="font-semibold text-white">{user?.email}</span>. Generate access codes for live student lab sessions.
            </p>
          </div>

          <button
            onClick={onEnterLab}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            Enter Lab Workspace
            <ArrowRight className="w-4 h-4 text-violet-600" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Code Generation Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-violet-600" />
              Active Classroom Access Code
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Students sign in with Google and enter this code to access experiment modules.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={authLoading}
              className="px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generatedCode ? 'Generate New Code' : 'Generate Code'}
            </button>

            {generatedCode && (
              <button
                onClick={handleEndCode}
                disabled={authLoading}
                className="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Power className="w-4 h-4 text-rose-600" />
                End Code
              </button>
            )}
          </div>
        </div>

        {/* Display Code Display Card */}
        {generatedCode ? (
          <div className="bg-gradient-to-b from-violet-50/80 to-slate-50 border-2 border-dashed border-violet-200 rounded-3xl p-8 text-center space-y-4 relative">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider">
              Live Active Class Code
            </span>

            {/* Prominent Large Code Display */}
            <div className="py-4">
              <span className="text-5xl md:text-7xl font-black text-slate-900 tracking-widest font-mono select-all bg-white px-8 py-4 rounded-3xl border border-violet-100 shadow-md inline-block">
                {generatedCode}
              </span>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Code'}
              </button>

              {generatedCodeTime && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Generated at {generatedCodeTime}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto pt-2">
              Share this code aloud with students in class — it stays valid until you click <strong className="text-slate-800">End Code</strong> or generate a new one.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Active Access Code</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click <strong className="text-slate-700">"Generate Code"</strong> above to launch a 6-digit access code for your upcoming student laboratory session.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
