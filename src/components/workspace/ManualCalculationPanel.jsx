import React from 'react';
import { Lock, Calculator, CheckCircle2, BookOpen } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { calculateTable, formatValue } from '../../engine/formulaEngine';
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
    stdTableA,
    stdTableB
  } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  if (!config || !config.manual_calculation_mode) return null;

  const calcDefs = Array.isArray(config.calculations) ? config.calculations : [];
  const expManualData = manualCalculationData[currentExperimentId] || {};

  // Compute true auto-calculated rows for Trial 1 reference example
  const trueRows = calculateTable(
    observationRows,
    config.calculation_expressions || config.calculations,
    config.fixed_inputs || []
  );

  const trial1Obs = observationRows?.[0] || {};
  const trial1TrueRow = trueRows?.[0] || {};

  const getSubstitutedLatex = (templateStr, row) => {
    if (!templateStr || !row) return '';
    const h1 = parseFloat(row.h1);
    const h2 = parseFloat(row.h2);
    const h_diff = !isNaN(h1) && !isNaN(h2) ? Math.abs(h1 - h2) : null;
    const h_diff_cm = h_diff !== null ? h_diff.toFixed(1) : '';

    let res = templateStr.replace(/\{h_diff_cm\}/g, h_diff_cm);

    res = res.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
      const val = row[varName];
      if (val === undefined || val === null) return match;
      if (typeof val === 'number') {
        if (Math.abs(val) < 0.0001 && val !== 0) return val.toExponential(4);
        return Number.isInteger(val) ? val.toString() : val.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      }
      return String(val);
    });
    return res;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Trial 1 — Inline Worked Example Card (Locked Reference) */}
      <GlassCard className="border-l-4 border-l-cyan-600 bg-slate-50/90 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Worked Example – Trial 1 (Locked Reference)</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Auto-calculated reference trial with step-by-step formula substitutions
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Read-Only Reference
          </span>
        </div>

        {/* Trial 1 Observations Summary */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono space-y-1">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Trial 1 Base Observation Readings:</span>
          <div className="flex items-center gap-3 flex-wrap text-slate-800 font-bold pt-1">
            {(config?.trial_inputs || []).map((inp) => (
              <span key={inp.id} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                {inp.label}: <span className="text-cyan-700">{trial1Obs[inp.id] || '—'} {inp.unit}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Trial 1 Step-by-Step Worked Solutions */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block">
            Step-by-Step Worked Reference Solutions (Trial 1):
          </span>

          {calcDefs.map((stepItem, stepIdx) => {
            const rawRefVal = trial1TrueRow[stepItem.target_field || stepItem.id];
            const refValFormatted = formatValue(rawRefVal, stepItem.format || 'decimal');
            const subLatex = getSubstitutedLatex(stepItem.substitution_template, trial1TrueRow);

            return (
              <div key={stepItem.id} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 font-mono text-xs text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 text-[10px] flex items-center justify-center font-bold">
                      {stepIdx + 1}
                    </span>
                    {stepItem.label || `Step ${stepIdx + 1}`}
                  </span>
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    Ref = {refValFormatted} {stepItem.result_unit && stepItem.result_unit !== 'dim' ? stepItem.result_unit : ''}
                  </span>
                </div>

                {/* Formula */}
                <div className="p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto flex items-baseline gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Formula:</span>
                  <KaTeXRenderer math={stepItem.formula_latex || 'y = f(x)'} block={false} />
                </div>

                {/* Numeric Substitution */}
                {subLatex && (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto flex items-baseline gap-2">
                    <span className="text-[10px] text-cyan-600 font-bold uppercase shrink-0">Substituted:</span>
                    <KaTeXRenderer math={subLatex} block={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* 2. Trial 2+ — Step-by-Step Manual Calculation Tasks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-violet-600" />
            <span>Manual Step-by-Step Calculation Tasks (Trial 2+)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Fill in values to populate derived results table
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
                            Filled into Results Table
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
