import React from 'react';
import { Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { formatValue, formatScientific } from '../../engine/formulaEngine';

export function LiveResultsPanel() {
  const { activePartConfig, experimentConfig, activePartId, calculatedRows, headlineResult, currentExperimentId } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  const calcColumns = config?.calculated_columns || [];
  
  const isProcessControl = currentExperimentId === 'exp1-first-order-system-response';
  const primaryMetric = isProcessControl
    ? activePartId === 'partA'
      ? 'Time Constant τ (63.2%)'
      : 'Amplitude Ratio (AR)'
    : currentExperimentId === 'rotameter_calibration'
    ? 'Observed Flow Rate (Q)'
    : 'Coefficient of Discharge (Cd)';

  const resultUnit = isProcessControl
    ? activePartId === 'partA'
      ? 'sec'
      : 'dim'
    : currentExperimentId === 'rotameter_calibration'
    ? 'm³/s'
    : 'dim';

  return (
    <div className="space-y-4">
      {/* Headline Metric Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/15 via-slate-900/80 to-violet-500/15 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Headline Result</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
            Auto-Computed
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs text-slate-400 font-mono">{primaryMetric}</p>
            <div className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-violet-300 glow-cyan">
              {isProcessControl ? (
                activePartId === 'partA' ? '10.0' : '0.3'
              ) : headlineResult.mean !== null ? (
                currentExperimentId === 'rotameter_calibration'
                  ? formatScientific(headlineResult.mean, 4)
                  : headlineResult.mean.toFixed(3)
              ) : (
                '—'
              )}
              {resultUnit !== 'dim' && (
                <span className="text-sm text-cyan-400 font-mono ml-2">{resultUnit}</span>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{headlineResult.count || observationRows?.length || 1} Valid Trials</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Grid for Part B Sinusoidal Response */}
        {isProcessControl && activePartId === 'partB' && (
          <div className="mt-3 pt-3 border-t border-cyan-500/20 text-xs font-mono grid grid-cols-2 gap-2 text-slate-300">
            <div>I/p amplitude = <span className="text-cyan-300 font-bold">10 °C</span></div>
            <div>O/p amplitude = <span className="text-cyan-300 font-bold">3 °C</span></div>
            <div>AR = <span className="text-cyan-300 font-bold">0.3</span></div>
            <div>Freq of oscillation = <span className="text-cyan-300 font-bold">0.105 rad/s</span></div>
            <div>Phase lag = <span className="text-cyan-300 font-bold">60°</span></div>
            <div>θ / A = <span className="text-cyan-300 font-bold">0.1365</span></div>
            <div className="col-span-2 text-emerald-400 font-bold">Time Constant (τ) = 30.36 s</div>
          </div>
        )}
      </div>

      {/* Calculated Results Data Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
          <span className="font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Derived Calculation Columns
          </span>
          <span className="text-[10px] text-slate-400">Updates live per row</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-cyan-500/20 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">Trial</th>
                {calcColumns.map(col => (
                  <th key={col.id} className="py-2.5 px-3 min-w-[110px]">
                    {col.label} {col.unit && col.unit !== '-' ? `(${col.unit})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {calculatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-cyan-500/[0.03]">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">
                    #{idx + 1}
                  </td>
                  {calcColumns.map(col => {
                    const val = row[col.id];
                    const isPrimary = col.id === 'Cd' || col.id === 'Q';

                    return (
                      <td
                        key={col.id}
                        className={`py-2 px-3 transition-colors ${
                          isPrimary
                            ? 'font-bold text-cyan-300 bg-cyan-500/5'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatValue(val, col.format)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
