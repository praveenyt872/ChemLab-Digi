import React from 'react';
import { FlaskConical, FileDown, HelpCircle, Sparkles, ChevronRight, UserCheck, Edit3 } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#05070d]/80 border-b border-cyan-500/10">
      <ScrollProgress />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 flex items-center justify-center group-hover:border-cyan-400/60 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
            <FlaskConical className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                ChemLab AI
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 font-medium hidden sm:block">
              Virtual Chemical Engineering Lab
            </p>
          </div>
        </button>

        {/* Breadcrumb Navigation */}
        {currentPage === 'workspace' && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <button onClick={() => onNavigate('subject')} className="hover:text-cyan-300 transition-colors">
              {currentSubject === 'instrumentation-process-control' ? 'Process Control' : 'Fluid Mechanics'}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button onClick={() => onNavigate('experiment')} className="hover:text-cyan-300 transition-colors">
              Experiments
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-300 font-semibold truncate max-w-[200px]">
              {experimentConfig?.short_name || 'Workspace'}
            </span>
          </div>
        )}

        {/* Action Controls & Student Details Badge */}
        <div className="flex items-center gap-3">
          {hasStudentDetails && (
            <button
              onClick={() => setStudentGateOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer group"
              title="Edit Student Details"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-slate-200">{studentDetails.studentName}</span>
              <span className="text-[10px] text-slate-400">({studentDetails.registerNumber})</span>
              <Edit3 className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform ml-0.5" />
            </button>
          )}

          <button
            onClick={() => setOnboardingOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all cursor-pointer"
            title="How it Works / Onboarding"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {currentPage === 'workspace' ? (
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-semibold text-sm hover:brightness-110 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('subject')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium text-sm hover:bg-cyan-500/20 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Enter Lab</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
