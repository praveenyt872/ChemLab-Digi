import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowDownRight, CheckCircle2, ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { evaluateStepCalculations } from '../../engine/formulaEngine';
import { KaTeXRenderer } from '../common/KaTeXRenderer';

export function SampleCalculationPanel() {
  const {
    activePartConfig,
    experimentConfig,
    calculatedRows,
    observationRows
  } = useExperimentStore();

  const [selectedTrialIndex, setSelectedTrialIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const config = activePartConfig || experimentConfig;
  const calculationSteps = config?.calculation_steps || [];
  const fixedInputs = config?.fixed_inputs || [];

  const rows = calculatedRows && calculatedRows.length > 0 ? calculatedRows : observationRows;
  if (!config || !calculationSteps || calculationSteps.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  const activeRow = rows[selectedTrialIndex] || rows[0];
  const evaluatedSteps = evaluateStepCalculations(activeRow, calculationSteps, fixedInputs);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-violet-950/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-slate-100">
                Sample Calculation (Trial #{selectedTrialIndex + 1})
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                Handwritten Notebook Standard
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Formula → Substitution → Simplification → Final Answer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Trial Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedTrialIndex}
              onChange={(e) => setSelectedTrialIndex(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs font-mono text-cyan-300 font-bold focus:border-cyan-400 cursor-pointer appearance-none pr-8"
            >
              {rows.map((r, idx) => (
                <option key={idx} value={idx} className="bg-slate-950 text-slate-200 font-mono">
                  {idx === 0 ? `Trial #${idx + 1} (Sample)` : `Trial #${idx + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title={isExpanded ? 'Collapse Calculations' : 'Expand Calculations'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Step-by-Step Sequence */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6 pt-2"
          >
            {/* Step-by-Step Sequence Flow */}
            <div className="relative ml-4 sm:ml-6 space-y-6 border-l-2 border-cyan-500/30 pl-4 sm:pl-6">
              {evaluatedSteps.map((step, idx) => (
                <div key={step.step_id || idx} className="relative group">
                  
                  {/* Step Connector Node Icon */}
                  <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                    {step.step_number}
                  </div>

                  {/* Calculation Step Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-lg space-y-3 font-mono">
                    
                    {/* Step Title & Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                        <span>{step.label}</span>
                      </span>
                      {step.unit && step.unit !== 'dim' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          Unit: {step.unit}
                        </span>
                      )}
                    </div>

                    {/* Step Progression (Formula -> Substitution -> Simplification -> Answer) */}
                    <div className="space-y-3 text-xs">
                      
                      {/* 1. Symbolic Formula */}
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">a) Symbolic Formula:</span>
                        <div className="text-slate-100 overflow-x-auto">
                          <KaTeXRenderer math={step.formula_latex} block={false} />
                        </div>
                      </div>

                      {/* 2. Numeric Substitution Step */}
                      <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">b) Numeric Substitution (Trial #{selectedTrialIndex + 1}):</span>
                        <div className="text-cyan-200 overflow-x-auto">
                          <KaTeXRenderer math={step.substituted_latex || step.formula_latex} block={false} />
                        </div>
                      </div>

                      {/* 3. Intermediate Simplification (if present) */}
                      {step.simplification_latex && (
                        <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-1">
                          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block">c) Intermediate Simplification:</span>
                          <div className="text-violet-200 overflow-x-auto">
                            <KaTeXRenderer math={step.simplification_latex} block={false} />
                          </div>
                        </div>
                      )}

                      {/* 4. Final Answer Box */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Calculated Value:</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-300 font-mono">
                          {step.formatted_value} {step.unit !== 'dim' && step.unit !== '-' ? step.unit : ''}
                        </span>
                      </div>

                      {/* 5. Visual Dependency Link */}
                      {step.feeds_into && (
                        <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80 italic pt-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Feeds into <strong>{step.feeds_into}</strong></span>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              ))}
            </div>

            {/* Note Footer */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Same mathematical procedure applies to all remaining trials. Refer to the <strong>Derived Calculation Columns</strong> table below for trial-by-trial values.
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
