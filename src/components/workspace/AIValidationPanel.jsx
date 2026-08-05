import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Check, Sparkles, HelpCircle } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function AIValidationPanel() {
  const { validationFlags, applyValidationSuggestion, setValidationModal } = useExperimentStore();

  const flagIcons = {
    red: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    amber: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    blue: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
    grey: <Info className="w-4 h-4 text-slate-500 shrink-0" />
  };

  const flagCardStyles = {
    red: 'bg-red-50/80 border-red-200 text-red-900',
    amber: 'bg-amber-50/80 border-amber-200 text-amber-900',
    blue: 'bg-blue-50/80 border-blue-200 text-blue-900',
    grey: 'bg-slate-50 border-slate-200 text-slate-800'
  };

  return (
    <div className="space-y-3 text-slate-900">
      <div className="flex items-center justify-between pb-2 border-b border-[#EDEEF1]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-heading text-base font-bold text-slate-900">
            AI Physics Validation
          </h3>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {validationFlags.length === 0 ? 'Passed' : `${validationFlags.length} Flagged`}
        </span>
      </div>

      <AnimatePresence>
        {validationFlags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-xs font-mono flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">All Observations Verified Clean</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Readings conform to fluid dynamics laws & physical parameters.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {validationFlags.map((flag) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3.5 rounded-xl border text-xs font-mono shadow-sm ${
                  flagCardStyles[flag.type] || flagCardStyles.amber
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {flagIcons[flag.type] || flagIcons.amber}
                    <div>
                      <h4 className="font-bold font-heading text-sm text-slate-900">
                        {flag.title}
                      </h4>
                      <p className="mt-1 leading-relaxed text-slate-700 font-sans">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setValidationModal(flag)}
                    className="text-[11px] text-violet-700 hover:text-violet-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Why this flag?</span>
                  </button>

                  {flag.suggestion && (
                    <button
                      onClick={() => applyValidationSuggestion(flag.suggestion)}
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer"
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
