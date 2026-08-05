import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookOpen, Layers, Maximize2 } from 'lucide-react';
import { KaTeXRenderer } from '../common/KaTeXRenderer';
import { useExperimentStore } from '../../store/experimentStore';

export function FormulaCard({ formula }) {
  const [isOpen, setIsOpen] = useState(false);
  const { setDerivationModal } = useExperimentStore();

  if (!formula) return null;

  return (
    <div className="rounded-xl border border-[#EDEEF1] bg-white overflow-hidden transition-all hover:border-violet-200 shadow-sm">
      
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-50 hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-slate-900">
              {formula.label}
            </h4>
            <div className="mt-0.5 text-slate-900">
              <KaTeXRenderer math={formula.latex} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {formula.derivation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDerivationModal(formula);
              }}
              className="px-2.5 py-1 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer font-semibold"
              title="Expand full-screen step-by-step derivation"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Derivation</span>
            </button>
          )}

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="border-t border-[#EDEEF1] p-5 space-y-4 text-xs font-mono bg-white"
          >
            {/* Purpose */}
            {formula.purpose && (
              <div>
                <span className="text-violet-700 font-bold uppercase tracking-wider block mb-1">
                  Purpose
                </span>
                <p className="text-slate-600 font-sans leading-relaxed">{formula.purpose}</p>
              </div>
            )}

            {/* Rendered Math Formula */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-slate-900">
              <KaTeXRenderer math={formula.latex} block={true} />
            </div>

            {/* Variables Table */}
            {formula.variables && formula.variables.length > 0 && (
              <div>
                <span className="text-violet-700 font-bold uppercase tracking-wider block mb-2">
                  Variables & Units
                </span>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Meaning</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Typical Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {formula.variables.map((v, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-violet-700">{v.symbol}</td>
                          <td className="p-2">{v.meaning}</td>
                          <td className="p-2 text-violet-600 font-semibold">{v.unit}</td>
                          <td className="p-2 text-slate-500">{v.typical_range || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assumptions */}
            {formula.assumptions && formula.assumptions.length > 0 && (
              <div>
                <span className="text-amber-600 font-bold uppercase tracking-wider block mb-1">
                  Derivation Assumptions
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 font-sans">
                  {formula.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practical Application */}
            {formula.practical_application && (
              <div className="p-3 rounded-lg bg-violet-50/50 border border-violet-100 text-slate-700">
                <span className="text-violet-700 font-bold flex items-center gap-1.5 mb-1 font-heading">
                  <Layers className="w-3.5 h-3.5" />
                  Industrial Application
                </span>
                <p className="font-sans leading-relaxed text-slate-600">
                  {formula.practical_application}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
