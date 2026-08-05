import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function ResetConfirmModal() {
  const { isResetConfirmOpen, setResetConfirmOpen, resetTable } = useExperimentStore();

  if (!isResetConfirmOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl text-slate-900 space-y-4 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900">
            Reset Observation Table?
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-1">
            This will clear all entered trial readings and reset calculated values. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setResetConfirmOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={resetTable}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm transition-all cursor-pointer"
          >
            Confirm Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}
