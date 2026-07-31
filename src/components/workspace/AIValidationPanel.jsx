import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Check, Sparkles, HelpCircle } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function AIValidationPanel() {
  const { validationFlags, applyValidationSuggestion, setValidationModal } = useExperimentStore();

  const flagIcons = {
    red: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    amber: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    blue: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
    grey: <Info className="w-4 h-4 text-slate-400 shrink-0" />
  };

  const flagCardStyles = {
    red: 'bg-red-500/10 border-red-500/30 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    blue: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_rgba(0,229,255,0.15)]',
    grey: 'bg-slate-800/40 border-slate-700/50 text-slate-300'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-heading text-base font-bold text-slate-100">
            AI Physics Validation
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          {validationFlags.length} Flags
        </span>
      </div>

      <AnimatePresence>
        {validationFlags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs font-mono flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">All Observations Verified Clean</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Readings conform to fluid dynamics laws and equipment parameters.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {validationFlags.map((flag) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-3.5 rounded-xl border backdrop-blur-md text-xs font-mono ${
                  flagCardStyles[flag.type] || flagCardStyles.amber
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {flagIcons[flag.type] || flagIcons.amber}
                    <div>
                      <h4 className="font-bold font-heading text-sm text-slate-100">
                        {flag.title}
                      </h4>
                      <p className="mt-1 leading-relaxed text-slate-200">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setValidationModal(flag)}
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Why this flag?</span>
                  </button>

                  {flag.suggestion && (
                    <button
                      onClick={() => applyValidationSuggestion(flag.suggestion)}
                      className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(61,255,176,0.2)]"
                    >
                      Apply Suggestion
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
