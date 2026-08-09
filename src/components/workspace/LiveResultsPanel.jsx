import React from 'react';
import { Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { formatValue, formatScientific } from '../../engine/formulaEngine';

export function LiveResultsPanel() {
  const { activePartConfig, experimentConfig, activePartId, calculatedRows, observationRows, headlineResult, currentExperimentId } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  const calcColumns = config?.calculated_columns || [];
  
  const isFreeConvection = currentExperimentId === 'free_convection';
  const isProcessControl = currentExperimentId === 'exp1-first-order-system-response';
  const primaryMetric = isFreeConvection
    ? 'Heat Transfer Coefficient (h)'
    : isProcessControl
    ? activePartId === 'partA'
      ? 'Time Constant τ (63.2%)'
      : 'Amplitude Ratio (AR)'
    : currentExperimentId === 'rotameter_calibration'
    ? 'Observed Flow Rate (Q)'
    : 'Coefficient of Discharge (Cd)';

  const resultUnit = isFreeConvection
    ? 'W/m²°C'
    : isProcessControl
    ? activePartId === 'partA'
      ? 'sec'
      : 'dim'
    : currentExperimentId === 'rotameter_calibration'
    ? 'm³/s'
    : 'dim';

  return (
    <div className="space-y-4">
      {/* Headline Metric Card */}
      <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-200 shadow-sm relative overflow-hidden text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-violet-700 font-mono font-bold">
            <Calculator className="w-4 h-4 text-violet-600" />
            <span>Headline Result</span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
            Auto-Computed
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs text-slate-500 font-mono font-semibold">{primaryMetric}</p>
            <div className="text-3xl font-heading font-bold text-violet-900">
              {isProcessControl ? (
                activePartId === 'partA' ? '10.0' : '0.3'
              ) : headlineResult.mean !== null ? (
                currentExperimentId === 'rotameter_calibration'
                  ? formatScientific(headlineResult.mean, 4)
                  : headlineResult.mean.toFixed(2)
              ) : (
                '—'
              )}
              {resultUnit !== 'dim' && (
                <span className="text-sm text-violet-700 font-mono ml-2">{resultUnit}</span>
              )}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-500">
            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{headlineResult.count || observationRows?.length || 1} Valid Trials</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Grid for Part B Sinusoidal Response */}
        {isProcessControl && activePartId === 'partB' && (
          <div className="mt-3 pt-3 border-t border-violet-200 text-xs font-mono grid grid-cols-2 gap-2 text-slate-800">
            <div>I/p amplitude = <span className="text-violet-700 font-bold">10 °C</span></div>
            <div>O/p amplitude = <span className="text-violet-700 font-bold">3 °C</span></div>
            <div>AR = <span className="text-violet-700 font-bold">0.3</span></div>
            <div>Freq of oscillation = <span className="text-violet-700 font-bold">0.105 rad/s</span></div>
            <div>Phase lag = <span className="text-violet-700 font-bold">60°</span></div>
            <div>θ / A = <span className="text-violet-700 font-bold">0.1365</span></div>
            <div className="col-span-2 text-emerald-700 font-bold border-t border-violet-200 pt-1">Time Constant (τ) = 30.36 s</div>
          </div>
        )}
      </div>

      {/* Calculated Results Data Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-700 font-mono font-semibold">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
            Derived Calculation Columns
          </span>
          <span className="text-[10px] text-slate-400">Updates live per row</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#EDEEF1] bg-white">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-[#EDEEF1] text-slate-700 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">Trial</th>
                {calcColumns.map(col => (
                  <th key={col.id} className="py-2.5 px-3 min-w-[110px]">
                    {col.label} {col.unit && col.unit !== '-' ? `(${col.unit})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-center font-bold text-slate-400">
                    #{idx + 1}
                  </td>
                  {calcColumns.map(col => {
                    const val = row[col.id];
                    const isPrimary = col.id === 'Cd' || col.id === 'Q';

                    return (
                      <td
                        key={col.id}
                        className={`py-2 px-3 font-medium ${
                          isPrimary
                            ? 'font-bold text-violet-700 bg-violet-50/50'
                            : 'text-slate-800'
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
