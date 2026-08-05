import React from 'react';
import { FlaskConical, FileDown, HelpCircle, Sparkles, ChevronRight, UserCheck, Edit3, Search, Bell } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { ScrollProgress } from '../common/ScrollProgress';

export function Navbar({ currentPage, onNavigate }) {
  const {
    experimentConfig,
    setReportModalOpen,
    setOnboardingOpen,
    currentSubject,
    studentDetails,
    setStudentGateOpen
  } = useExperimentStore();

  const hasStudentDetails = studentDetails?.studentName && studentDetails?.registerNumber;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1A1D23] text-white border-b border-slate-800 shadow-sm">
      <ScrollProgress />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Logo */}
        <button
          onClick={() => onNavigate('subject')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center group-hover:bg-violet-600/50 transition-all">
            <FlaskConical className="w-5 h-5 text-violet-400 group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white tracking-tight">
                ChemLab<span className="text-violet-400">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                v1.0
              </span>
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

        {/* Right: Actions & Student Profile Badge */}
        <div className="flex items-center gap-3 shrink-0">
          {hasStudentDetails && (
            <button
              onClick={() => setStudentGateOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-slate-200 transition-all cursor-pointer group"
              title="Edit Student Details"
            >
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                {studentDetails.studentName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-200 hidden sm:inline">{studentDetails.studentName}</span>
              <span className="text-[10px] text-slate-400 hidden md:inline">({studentDetails.registerNumber})</span>
              <Edit3 className="w-3 h-3 text-violet-400 group-hover:scale-110 transition-transform ml-0.5" />
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
