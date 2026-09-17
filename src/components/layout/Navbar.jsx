import React from 'react';
import { FlaskConical, FileDown, HelpCircle, Sparkles, Edit3, Search, UserCheck, LogOut } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { ScrollProgress } from '../common/ScrollProgress';
import { OfflineBadge } from '../pwa/OfflineBadge';
import { isValidRajalakshmiEmail } from '../../data/faculty';
import recLogo from '../../assets/rec-logo.png';

export function Navbar({ currentPage, onNavigate }) {
  const {
    setReportModalOpen,
    setOnboardingOpen,
    studentDetails,
    setStudentGateOpen,
    logoutStudent
  } = useExperimentStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1A1D23] text-white border-b border-slate-800 shadow-sm">
      <ScrollProgress />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Logo */}
        <button
          onClick={() => onNavigate('subject')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center group-hover:border-violet-500 transition-all">
            <img src={recLogo} alt="Rajalakshmi Engineering College Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white tracking-tight">
                Chem Digi <span className="text-violet-400">Lab</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                v1.0
              </span>
              <OfflineBadge />
            </div>
          </div>
        </button>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onNavigate('subject')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'subject' ? 'bg-slate-800 text-violet-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('subject')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentPage === 'experiment' || currentPage === 'workspace' ? 'bg-slate-800 text-violet-400' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Experiments
          </button>
          {currentPage === 'workspace' && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Lab Report
            </button>
          )}
        </nav>

        {/* Center-Right: Search Input */}
        <div className="hidden sm:flex items-center relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search experiments, formulas..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {studentDetails?.studentName && isValidRajalakshmiEmail(studentDetails?.email) ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStudentGateOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-slate-200 transition-all cursor-pointer group"
                title={`Logged in as ${studentDetails.studentName} (${studentDetails.email})`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px] uppercase">
                  {studentDetails.studentName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-200 block text-[11px] leading-tight">{studentDetails.studentName}</span>
                  <span className="text-[9px] text-emerald-400 block font-mono">@rajalakshmi.edu.in</span>
                </div>
                <Edit3 className="w-3 h-3 text-violet-400 group-hover:scale-110 transition-transform ml-0.5" />
              </button>
              <button
                onClick={logoutStudent}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                title="Sign out of student account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStudentGateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              title="Student Login with @rajalakshmi.edu.in"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student Login</span>
            </button>
          )}

          <button
            onClick={() => setOnboardingOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="How it Works / Onboarding"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {currentPage === 'workspace' ? (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 shadow-sm transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('subject')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Select Subject</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
