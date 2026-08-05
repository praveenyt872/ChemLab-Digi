import React from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Layers } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { KaTeXRenderer } from '../common/KaTeXRenderer';

export function DerivationModal() {
  const { isDerivationModalOpen, activeDerivationFormula, setDerivationModal } = useExperimentStore();

  if (!isDerivationModalOpen || !activeDerivationFormula) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl text-slate-900 space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Formula Derivation: {activeDerivationFormula.label}
              </h3>
              <p className="text-xs font-sans text-slate-500">
                Mathematical proof and fluid mechanics foundations
              </p>
            </div>
          </div>

          <button
            onClick={() => setDerivationModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Formula Display */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-900">
          <KaTeXRenderer math={activeDerivationFormula.latex} block={true} />
        </div>

        {/* Step-by-Step Proof */}
        <div className="space-y-3 font-mono text-xs">
          <h4 className="text-sm font-heading font-bold text-violet-700 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" />
            Step-by-Step Derivation
          </h4>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
            {activeDerivationFormula.derivation || 'Derivation text available in manual config.'}
          </div>
        </div>

        {/* Assumptions */}
        {activeDerivationFormula.assumptions && activeDerivationFormula.assumptions.length > 0 && (
          <div className="space-y-2 font-mono text-xs">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Assumptions Made in Derivation
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 font-sans">
              {activeDerivationFormula.assumptions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-[#EDEEF1] flex justify-end">
          <button
            onClick={() => setDerivationModal(null)}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all cursor-pointer shadow-sm"
          >
            Close Derivation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
