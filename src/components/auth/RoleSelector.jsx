import React from 'react';
import { ShieldCheck, GraduationCap, UserCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function RoleSelector({ selectedRole, onSelectRole }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200/60 rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          Rajalakshmi Engineering College
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to ChemLab AI
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Select your institutional role to access the virtual laboratory
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-full shadow-inner">
        <button
          type="button"
          onClick={() => onSelectRole('student')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            selectedRole === 'student'
              ? 'bg-white text-violet-900 shadow-md ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${selectedRole === 'student' ? 'text-violet-600' : 'text-slate-400'}`} />
          Student
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('teacher')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
            selectedRole === 'teacher'
              ? 'bg-white text-violet-900 shadow-md ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 ${selectedRole === 'teacher' ? 'text-violet-600' : 'text-slate-400'}`} />
          Faculty / Teacher
        </button>
      </div>
    </div>
  );
}
