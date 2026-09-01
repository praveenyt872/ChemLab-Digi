import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Calculator, CheckCircle2 } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { KaTeXRenderer } from '../common/KaTeXRenderer';
import { formatValue, evaluateStepCalculations } from '../../engine/formulaEngine';

export function WorkedExampleModal() {
  const {
    isWorkedExampleOpen,
    setWorkedExampleOpen,
    activePartConfig,
    experimentConfig,
    observationRows,
    calculatedRows
  } = useExperimentStore();

  if (!isWorkedExampleOpen) return null;

  const config = activePartConfig || experimentConfig;
  const trial1Obs = observationRows?.[0] || {};
  const trial1Calc = calculatedRows?.[0] || {};
  const calcStepsDef = config?.calculation_steps || [];
  const calcItems = Array.isArray(config?.calculations) ? config.calculations : [];

  const evaluatedSteps = trial1Obs && calcStepsDef.length > 0
    ? evaluateStepCalculations(trial1Obs, calcStepsDef, config?.fixed_inputs || [])
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl glass-panel border border-cyan-500/40 bg-slate-950 text-slate-100 p-6 shadow-2xl space-y-5"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Trial 1 Worked Example & Formula Reference</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                    Reference Pop-up
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Use Trial 1 as a guide to solve Trials 2–5 step-by-step
                </p>
              </div>
            </div>

            <button
              onClick={() => setWorkedExampleOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Trial 1 Raw Observation Readings */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              <span>Trial 1 Base Lab Observations:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {(config?.trial_inputs || []).map((inp) => (
                <div key={inp.id} className="p-2 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">{inp.label}:</span>
                  <span className="font-bold text-slate-100">{trial1Obs[inp.id] || '—'} {inp.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Worked Solutions */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Step-by-Step Solution Breakdown (Trial 1):
            </h4>

            {evaluatedSteps.length > 0 ? (
              evaluatedSteps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
                      {step.label}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ref = {step.formatted_value} {step.unit !== 'dim' && step.unit !== '-' ? step.unit : ''}
                    </span>
                  </div>

                  {/* Symbolic Formula */}
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-baseline gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">Symbolic Formula:</span>
                    <KaTeXRenderer math={step.formula_latex} block={false} />
                  </div>

                  {/* Substituted Numerical Formula */}
                  {step.substituted_latex && (
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-baseline gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 shrink-0">Substituted Values:</span>
                      <KaTeXRenderer math={step.substituted_latex} block={false} />
                    </div>
                  )}

                  {/* Final Calculation Result */}
                  <div className="text-xs font-mono text-slate-200 font-bold pt-1">
                    Calculated Result: <span className="text-cyan-300">{step.formatted_value} {step.unit !== 'dim' && step.unit !== '-' ? step.unit : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              calcItems.map((stepItem, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
                      {stepItem.label}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      Target: {stepItem.result_unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-baseline gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">Formula:</span>
                    <KaTeXRenderer math={stepItem.formula_latex} block={false} />
                  </div>

                  <div className="text-xs font-mono text-slate-200 font-bold">
                    Trial 1 Reference Value: <span className="text-cyan-300">{formatValue(trial1Calc[stepItem.target_field || stepItem.id], 'decimal')} {stepItem.result_unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setWorkedExampleOpen(false)}
              className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              Understood — Close Reference
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
