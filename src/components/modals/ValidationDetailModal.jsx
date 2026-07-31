import React from 'react';
import { motion } from 'framer-motion';
import { X, HelpCircle, AlertTriangle, Check } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function ValidationDetailModal() {
  const { isValidationModalOpen, activeValidationFlag, setValidationModal, applyValidationSuggestion } = useExperimentStore();

  if (!isValidationModalOpen || !activeValidationFlag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl glass-panel border border-amber-500/40 p-6 shadow-2xl bg-slate-950/95 text-slate-100 space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading text-lg font-bold text-slate-100">
              AI Validation Flag Details
            </h3>
          </div>
          <button
            onClick={() => setValidationModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
              Issue Detected
            </span>
            <p className="text-slate-100 font-heading font-semibold text-base">
              {activeValidationFlag.title}
            </p>
            <p className="text-slate-300 mt-1">{activeValidationFlag.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Scientific Reasoning ("Why?")
            </span>
            <p className="text-slate-200 font-sans leading-relaxed text-xs">
              {activeValidationFlag.why}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setValidationModal(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700 transition-all cursor-pointer"
          >
            Dismiss
          </button>

          {activeValidationFlag.suggestion && (
            <button
              onClick={() => {
                applyValidationSuggestion(activeValidationFlag.suggestion);
                setValidationModal(null);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(61,255,176,0.3)] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply AI Suggestion</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
