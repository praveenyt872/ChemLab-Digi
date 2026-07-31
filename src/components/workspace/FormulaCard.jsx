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
    <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-md overflow-hidden transition-all hover:border-cyan-500/40">
      
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-900/60 hover:bg-slate-900/90 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sm text-slate-100">
              {formula.label}
            </h4>
            <div className="mt-0.5">
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
              className="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono flex items-center gap-1 transition-all"
              title="Expand full-screen step-by-step derivation"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Derivation</span>
            </button>
          )}

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400"
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
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-cyan-500/10 p-5 space-y-4 text-xs font-mono bg-slate-950/90"
          >
            {/* Purpose */}
            {formula.purpose && (
              <div>
                <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                  Purpose
                </span>
                <p className="text-slate-300 font-sans leading-relaxed">{formula.purpose}</p>
              </div>
            )}

            {/* Rendered Math Formula */}
            <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/20 text-center">
              <KaTeXRenderer math={formula.latex} block={true} />
            </div>

            {/* Variables Table */}
            {formula.variables && formula.variables.length > 0 && (
              <div>
                <span className="text-cyan-400 font-bold uppercase tracking-wider block mb-2">
                  Variables & Units
                </span>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Meaning</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Typical Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {formula.variables.map((v, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-cyan-300">{v.symbol}</td>
                          <td className="p-2">{v.meaning}</td>
                          <td className="p-2 text-violet-300">{v.unit}</td>
                          <td className="p-2 text-slate-400">{v.typical_range || '—'}</td>
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
                <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  Derivation Assumptions
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 font-sans">
                  {formula.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practical Application */}
            {formula.practical_application && (
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-slate-300">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5 mb-1 font-heading">
                  <Layers className="w-3.5 h-3.5" />
                  Industrial Application
                </span>
                <p className="font-sans leading-relaxed text-slate-300">
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
