import React from 'react';
import { motion } from 'framer-motion';
import { X, HelpCircle, AlertTriangle, Check } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function ValidationDetailModal() {
  const { isValidationModalOpen, activeValidationFlag, setValidationModal, applyValidationSuggestion } = useExperimentStore();

  if (!isValidationModalOpen || !activeValidationFlag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl text-slate-900 space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading text-lg font-bold text-slate-900">
              AI Validation Flag Details
            </h3>
          </div>
          <button
            onClick={() => setValidationModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <span className="text-amber-600 font-bold uppercase tracking-wider block mb-1">
              Issue Detected
            </span>
            <p className="text-slate-900 font-heading font-semibold text-base">
              {activeValidationFlag.title}
            </p>
            <p className="text-slate-600 mt-1 font-sans">{activeValidationFlag.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-violet-700 font-bold uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <HelpCircle className="w-4 h-4 text-violet-600" />
              Scientific Reasoning ("Why?")
            </span>
            <p className="text-slate-700 font-sans leading-relaxed text-xs">
              {activeValidationFlag.why}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#EDEEF1] flex items-center justify-between">
          <button
            onClick={() => setValidationModal(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-semibold hover:bg-slate-200 transition-all cursor-pointer"
          >
            Dismiss
          </button>

          {activeValidationFlag.suggestion && (
            <button
              onClick={() => {
                applyValidationSuggestion(activeValidationFlag.suggestion);
                setValidationModal(null);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
