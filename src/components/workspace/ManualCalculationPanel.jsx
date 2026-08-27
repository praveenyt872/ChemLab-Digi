import React from 'react';
import { Lock, Calculator, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    updateManualVariable,
    updateManualResult
  } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  if (!config || !config.manual_calculation_mode) return null;

  const calcDefs = Array.isArray(config.calculations) ? config.calculations : [];
  const primaryCalc = calcDefs[0] || {};
  const variables = primaryCalc.variables || [];

  // Compute true rows for worked example and silent validation
  const trueRows = calculateTable(
    observationRows,
    config.calculation_expressions || config.calculations,
    config.fixed_inputs
  );

  const expManualData = manualCalculationData[currentExperimentId] || {};

  // Trial 1 Worked Example Substitution Construction
  const trial1Row = trueRows[0] || {};
  const t1_V = trial1Row.V !== undefined ? trial1Row.V : 30;
  const t1_I = trial1Row.I !== undefined ? trial1Row.I : 0.20;
  const t1_D = trial1Row.D !== undefined ? trial1Row.D : 0.032;
  const t1_L = trial1Row.L !== undefined ? trial1Row.L : 0.5;
  const t1_Ts = trial1Row.Ts !== undefined ? Number(trial1Row.Ts).toFixed(2) : '44.86';
  const t1_Ta = trial1Row.Ta !== undefined ? Number(trial1Row.Ta).toFixed(2) : '28.00';
  const t1_h = trial1Row.h !== undefined && trial1Row.h !== null ? Number(trial1Row.h).toFixed(2) : '—';

  const t1_substitution = `h = \\frac{${t1_V} \\times ${t1_I}}{\\pi \\times ${t1_D} \\times ${t1_L} \\times (${t1_Ts} - ${t1_Ta})}`;

  return (
    <div className="space-y-6">
      
      {/* 1. Trial 1 — Worked Example Card (Read-Only Reference) */}
      <GlassCard className="border-l-4 border-l-slate-400 bg-slate-50/90 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-800">
                Worked Example – Trial 1 (for reference only)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Auto-calculated reference trial with full formula substitution
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
            Read Only
          </span>
        </div>

        {/* Worked Example Substitution Steps */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 font-mono text-xs text-slate-800">
          <div>
            <span className="text-slate-500 font-bold block mb-1">1. SYMBOLIC FORMULA</span>
            <div className="p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto">
              <KaTeXRenderer math={primaryCalc.formula_latex || "h = \\frac{V \\times I}{\\pi \\times D \\times L \\times (T_s - T_a)}"} block={false} />
            </div>
          </div>

          <div>
            <span className="text-slate-500 font-bold block mb-1">2. NUMERIC SUBSTITUTION (TRIAL 1)</span>
            <div className="p-2 rounded bg-slate-50 border border-slate-200 overflow-x-auto">
              <KaTeXRenderer math={t1_substitution} block={false} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase">Computed Result (h)</span>
            <span className="text-sm font-bold text-violet-700">
              {t1_h} {primaryCalc.result_unit || 'W/m²·K'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 2. Trial 2+ — Manual Calculation Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-violet-600" />
            <span>Manual Calculation Tasks (Trial 2+)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Fill in variables & calculate result
          </span>
        </div>

        {observationRows.slice(1).map((obsRow, offsetIdx) => {
          const rIdx = offsetIdx + 1;
          const trialState = expManualData[rIdx] || { variables: {}, result: '', flagged_for_review: false };
          const trialVars = trialState.variables || {};
          const isFlagged = Boolean(trialState.flagged_for_review);

          return (
            <GlassCard key={rIdx} className="border-l-4 border-l-violet-600 space-y-4">
              
              {/* Trial Header & Self-Check Nudge Glyph */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-800 font-mono font-bold text-xs flex items-center justify-center">
                    #{rIdx + 1}
                  </span>
                  <h4 className="font-heading font-bold text-slate-900 text-base">
                    Manual Calculation – Trial #{rIdx + 1}
                  </h4>
                </div>

                {/* Neutral Self-Check Indicator */}
                {isFlagged && (
                  <div className="group relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-xs font-mono cursor-help">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Self-Check</span>
                    <span className="pointer-events-none absolute right-0 top-7 hidden group-hover:block w-56 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] normal-case text-white z-30 shadow-xl">
                      Double-check this trial's calculation
                    </span>
                  </div>
                )}
              </div>

              {/* Symbolic Formula Reference */}
              <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100 text-xs font-mono flex items-center justify-between">
                <span className="text-slate-600 font-bold uppercase">Formula:</span>
                <KaTeXRenderer math={primaryCalc.formula_latex || "h = \\frac{V \\times I}{\\pi \\times D \\times L \\times (T_s - T_a)}"} block={false} />
              </div>

              {/* Variable Fill-in Input Grid */}
              <div>
                <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  1. Fill in Variable Values for Trial #{rIdx + 1}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {variables.map((varDef) => {
                    const symbol = varDef.symbol;
                    const val = trialVars[symbol] !== undefined ? trialVars[symbol] : '';

                    return (
                      <div key={symbol} className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-slate-700 flex items-center justify-between">
                          <span>{symbol} — {varDef.label}</span>
                          <span className="text-slate-400 text-[10px]">({varDef.unit})</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={val}
                          placeholder={`Enter ${symbol}`}
                          onChange={(e) => updateManualVariable(rIdx, symbol, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all shadow-inner"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Final Student Result Input */}
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider block mb-1">
                  2. Your Calculated Result ({primaryCalc.label || 'h'})
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    step="any"
                    value={trialState.result || ''}
                    placeholder="Enter calculated h (e.g. 8.45)"
                    onChange={(e) => updateManualResult(rIdx, e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-violet-300 text-sm font-mono font-bold text-violet-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all shadow-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                    {primaryCalc.result_unit || 'W/m²·K'}
                  </span>
                </div>
              </div>

            </GlassCard>
          );
        })}
      </div>

    </div>
  );
}
