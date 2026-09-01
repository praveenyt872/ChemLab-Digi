import React from 'react';
import { Lock, Calculator, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { KaTeXRenderer } from '../common/KaTeXRenderer';
import { GlassCard } from '../common/GlassCard';

export function ManualCalculationPanel() {
  const {
    activePartConfig,
    experimentConfig,
    observationRows,
    currentExperimentId,
    manualCalculationData,
    updateStepManualVariable,
    updateStepManualResult,
    setWorkedExampleOpen
  } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  if (!config || !config.manual_calculation_mode) return null;

  const calcDefs = Array.isArray(config.calculations) ? config.calculations : [];
  const expManualData = manualCalculationData[currentExperimentId] || {};

  return (
    <div className="space-y-6">
      
      {/* 1. Trial 1 Reference Banner with Pop-up Button */}
      <GlassCard className="border-l-4 border-l-cyan-500 bg-slate-50/90 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Trial 1 Worked Example & Reference Formulae</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Auto-calculated reference trial with full formula substitutions
              </p>
            </div>
          </div>

          <button
            onClick={() => setWorkedExampleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs hover:bg-cyan-500 transition-all shadow-md cursor-pointer shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            <span>View Trial 1 Worked Example (Reference Pop-up)</span>
          </button>
        </div>
        <p className="text-xs font-sans text-slate-600 leading-normal">
          Trial 1 serves as your reference worked example. Click the button above to view step-by-step symbolic formulas, numerical substitutions, and reference values. Use them to perform the manual calculations for Trials 2–5 below.
        </p>
      </GlassCard>

      {/* 2. Trial 2+ — Step-by-Step Manual Calculation Blocks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-violet-600" />
            <span>Manual Step-by-Step Calculation Tasks (Trial 2+)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Complete each step to fill results table
          </span>
        </div>

        {observationRows.slice(1).map((obsRow, offsetIdx) => {
          const rIdx = offsetIdx + 1;
          const trialState = expManualData[rIdx] || { steps: {} };
          const stepsState = trialState.steps || {};

          return (
            <GlassCard key={rIdx} className="border-l-4 border-l-violet-600 space-y-5">
              
              {/* Trial Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-800 font-mono font-bold text-xs flex items-center justify-center">
                    #{rIdx + 1}
                  </span>
                  <h4 className="font-heading font-bold text-slate-900 text-base">
                    Manual Calculation Tasks — Trial #{rIdx + 1}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Trial {rIdx + 1} of {observationRows.length}
                </span>
              </div>

              {/* Step-by-Step Calculation Cards for this Trial */}
              <div className="space-y-4">
                {calcDefs.map((stepItem, stepIdx) => {
                  const stepId = stepItem.id;
                  const stepState = stepsState[stepId] || { variables: {}, result: '' };
                  const stepVars = stepState.variables || {};
                  const variablesList = stepItem.variables || [];
                  const isFlagged = Boolean(stepState.flagged_for_review);
                  const isFilled = stepState.result !== undefined && stepState.result !== '';

                  return (
                    <div
                      key={stepId}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                    >
                      {/* Step Title & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-violet-900 uppercase tracking-wide flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-violet-200 text-violet-800 text-[10px] flex items-center justify-center font-bold">
                            {stepIdx + 1}
                          </span>
                          {stepItem.label || `Step ${stepIdx + 1}`}
                        </span>

                        {isFilled && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Value Entered
                          </span>
                        )}
                      </div>

                      {/* Formula LaTeX Display */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono flex items-center justify-between overflow-x-auto">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">Formula:</span>
                        <KaTeXRenderer math={stepItem.formula_latex || 'y = f(x)'} block={false} />
                      </div>

                      {/* Step Variables Input Grid */}
                      {variablesList.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">
                            Substituted Variables:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {variablesList.map((varDef) => {
                              const symbol = varDef.symbol;
                              const val = stepVars[symbol] !== undefined ? stepVars[symbol] : '';

                              return (
                                <div key={symbol} className="space-y-1">
                                  <label className="text-[10px] font-mono font-semibold text-slate-600 flex items-center justify-between">
                                    <span>{symbol} ({varDef.label})</span>
                                    <span className="text-slate-400">({varDef.unit})</span>
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={val}
                                    placeholder={`e.g. ${obsRow[varDef.source_field] || ''}`}
                                    onChange={(e) => updateStepManualVariable(rIdx, stepId, symbol, e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 transition-all shadow-inner"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Student Calculated Step Result Input */}
                      <div className="pt-2 border-t border-slate-200/80">
                        <label className="text-[11px] font-mono font-bold text-slate-900 uppercase tracking-wider block mb-1">
                          Your Calculated Value for {stepItem.label}:
                        </label>
                        <div className="relative max-w-sm">
                          <input
                            type="number"
                            step="any"
                            value={stepState.result || ''}
                            placeholder={`Enter calculated ${stepItem.id}`}
                            onChange={(e) => updateStepManualResult(rIdx, stepId, e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-violet-300 text-sm font-mono font-bold text-violet-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all shadow-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                            {stepItem.result_unit && stepItem.result_unit !== 'dim' ? stepItem.result_unit : ''}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </GlassCard>
          );
        })}
      </div>

    </div>
  );
}
