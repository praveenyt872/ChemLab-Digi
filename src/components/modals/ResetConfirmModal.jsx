import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function ResetConfirmModal() {
  const { isResetConfirmOpen, setResetConfirmOpen, resetTable } = useExperimentStore();

  if (!isResetConfirmOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl glass-panel border border-amber-500/40 p-6 shadow-2xl bg-slate-950/95 text-slate-100 space-y-4 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold text-slate-100">
            Reset Observation Table?
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-1">
            This will clear all entered trial readings and reset calculated values. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setResetConfirmOpen(false)}
            className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={resetTable}
            className="flex-1 py-2 rounded-xl bg-red-500 text-slate-950 font-bold text-xs hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
          >
            Confirm Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}
