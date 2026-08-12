import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowDownRight, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { evaluateStepCalculations } from '../../engine/formulaEngine';
import { KaTeXRenderer } from '../common/KaTeXRenderer';

export function SampleCalculationPanel() {
  const {
    activePartConfig,
    experimentConfig,
    calculatedRows,
    observationRows,
    computedNNaOH,
    computedNHCl,
    stdTableA,
    stdTableB
  } = useExperimentStore();

  const [selectedTrialIndex, setSelectedTrialIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const config = activePartConfig || experimentConfig;
  const calculationSteps = config?.calculation_steps || [];
  const baseFixed = config?.fixed_inputs || [];

  const effectiveFixed = [...baseFixed];
  if (config?.experiment_id === 'rtd_cstr') {
    const stdARow = stdTableA?.[0] || { V1: 10, initial: 0, final: 0.5 };
    const stdBRow = stdTableB?.[0] || { V1: 2, initial: 0, final: 4 };

    effectiveFixed.push({ id: 'N_NaOH', value: computedNNaOH || 2.0 });
    effectiveFixed.push({ id: 'N_HCl', value: computedNHCl || 1.0 });
    effectiveFixed.push({ id: 'C0', value: computedNNaOH || 2.0 });
    effectiveFixed.push({ id: 'V1_stdA', value: parseFloat(stdARow.V1 ?? 10) });
    effectiveFixed.push({ id: 'V2_stdA', value: Math.max(0.1, parseFloat(stdARow.final ?? 0.5) - parseFloat(stdARow.initial ?? 0)) });
    effectiveFixed.push({ id: 'V1_stdB', value: parseFloat(stdBRow.V1 ?? 2) });
    effectiveFixed.push({ id: 'V2_stdB', value: Math.max(0.1, parseFloat(stdBRow.final ?? 4) - parseFloat(stdBRow.initial ?? 0)) });
  }

  const rows = calculatedRows && calculatedRows.length > 0 ? calculatedRows : observationRows;
  if (!config || !calculationSteps || calculationSteps.length === 0 || !rows || rows.length === 0) {
    return null;
  }

  const activeRow = rows[selectedTrialIndex] || rows[0];
  const evaluatedSteps = evaluateStepCalculations(activeRow, calculationSteps, effectiveFixed);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-[#EDEEF1]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-slate-900">
                Sample Calculation (Trial #{selectedTrialIndex + 1})
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 uppercase tracking-wider">
                Handwritten Record Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
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
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 font-semibold focus:border-violet-500 cursor-pointer appearance-none pr-8 shadow-sm"
            >
              {rows.map((r, idx) => (
                <option key={idx} value={idx} className="bg-white text-slate-900 font-mono">
                  {idx === 0 ? `Trial #${idx + 1} (Sample)` : `Trial #${idx + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6 pt-2"
          >
            {/* Step-by-Step Sequence Flow */}
            <div className="relative ml-4 sm:ml-6 space-y-6 border-l-2 border-slate-200 pl-4 sm:pl-6">
              {evaluatedSteps.map((step, idx) => (
                <div key={step.step_id || idx} className="relative group">
                  
                  {/* Step Connector Node Icon */}
                  <div className="absolute -left-[25px] sm:-left-[33px] top-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-violet-600 flex items-center justify-center text-[10px] font-mono font-bold text-violet-700 shadow-sm">
                    {step.step_number}
                  </div>

                  {/* Calculation Step Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EDEEF1] border-l-4 border-l-violet-600 shadow-sm space-y-3 font-mono">
                    
                    {/* Step Title & Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{step.label}</span>
                      </span>
                      {step.unit && step.unit !== 'dim' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Unit: {step.unit}
                        </span>
                      )}
                    </div>

                    {/* Step Progression */}
                    <div className="space-y-3 text-xs text-slate-900">
                      
                      {/* 1. Symbolic Formula */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">a) Symbolic Formula:</span>
                        <div className="text-slate-900 overflow-x-auto">
                          <KaTeXRenderer math={step.formula_latex} block={false} />
                        </div>
                      </div>

                      {/* 2. Numeric Substitution Step */}
                      <div className="p-2.5 rounded-xl bg-violet-50/60 border border-violet-200 space-y-1">
                        <span className="text-[10px] text-violet-700 font-bold uppercase tracking-wider block">b) Numeric Substitution (Trial #{selectedTrialIndex + 1}):</span>
                        <div className="text-violet-950 font-bold overflow-x-auto">
                          <KaTeXRenderer math={step.substituted_latex || step.formula_latex} block={false} />
                        </div>
                      </div>

                      {/* 3. Intermediate Simplification (if present) */}
                      {step.simplification_latex && (
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">c) Intermediate Simplification:</span>
                          <div className="text-blue-950 font-bold overflow-x-auto">
                            <KaTeXRenderer math={step.simplification_latex} block={false} />
                          </div>
                        </div>
                      )}

                      {/* 4. Final Answer Box */}
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>Calculated Value:</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 font-mono">
                          {step.formatted_value} {step.unit !== 'dim' && step.unit !== '-' ? step.unit : ''}
                        </span>
                      </div>

                      {/* 5. Visual Dependency Link */}
                      {step.feeds_into && (
                        <div className="flex items-center gap-1.5 text-[11px] text-violet-600 italic pt-1">
                          <ArrowDownRight className="w-3.5 h-3.5 text-violet-600" />
                          <span>Feeds into <strong>{step.feeds_into}</strong></span>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              ))}
            </div>

            {/* Note Footer */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <span>
                Same mathematical procedure applies to all remaining trials. Refer to the <strong>Derived Calculation Columns</strong> table for trial-by-trial values.
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
