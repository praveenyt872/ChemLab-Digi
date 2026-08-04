import React from 'react';
import { Plus, RotateCcw, Database, Info, Trash2 } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function ObservationTable() {
  const {
    activePartConfig,
    experimentConfig,
    observationRows,
    updateCell,
    addRow,
    removeRow,
    setResetConfirmOpen,
    loadSampleData
  } = useExperimentStore();

  const config = activePartConfig || experimentConfig;
  const trialInputs = config?.trial_inputs || [];

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-cyan-500/10">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Observation Table</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {observationRows.length} Trials
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Enter exact readings taken during your physical lab session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs font-mono font-medium transition-all cursor-pointer"
            title="Populate table with verified sample lab readings"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-mono transition-all cursor-pointer"
            title="Clear all entered readings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Editable Data Grid */}
      <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-cyan-500/20 text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Trial</th>
              {trialInputs.map(input => (
                <th key={input.id} className="py-3 px-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>
                      {input.label} {input.unit ? `(${input.unit})` : ''}
                    </span>
                    {input.tooltip && (
                      <span className="group relative cursor-pointer text-cyan-400/70 hover:text-cyan-300">
                        <Info className="w-3.5 h-3.5" />
                        <span className="pointer-events-none absolute right-0 top-6 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-[11px] normal-case text-slate-200 z-30 shadow-xl">
                          {input.tooltip}
                        </span>
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {observationRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-cyan-500/[0.02] transition-colors">
                <td className="py-2.5 px-4 text-center font-bold text-cyan-400/80">
                  #{rIdx + 1}
                </td>

                {trialInputs.map(input => {
                  const val = row[input.id] !== undefined ? row[input.id] : '';
                  const numVal = parseFloat(val);
                  const allowZero = config?.experiment_id === 'exp1-first-order-system-response' || input.id === 't';
                  const isValid = val !== '' && !isNaN(numVal) && (allowZero ? numVal >= 0 : numVal > 0);
                  const isInvalid = val !== '' && (isNaN(numVal) || (allowZero ? numVal < 0 : numVal <= 0));

                  return (
                    <td key={input.id} className="py-2.5 px-3">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="any"
                          value={val}
                          placeholder={input.placeholder || '0.00'}
                          onChange={(e) => updateCell(rIdx, input.id, e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg glass-input text-xs font-mono ${
                            isInvalid
                              ? 'border-red-500/60 bg-red-500/10 text-red-200 focus:border-red-400'
                              : isValid
                              ? 'border-emerald-500/40 focus:border-cyan-400'
                              : 'border-slate-800'
                          }`}
                        />
                        {input.unit && (
                          <span className="absolute right-2 text-[10px] text-slate-500 pointer-events-none select-none">
                            {input.unit}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}

                <td className="py-2.5 px-4 text-center">
                  <button
                    onClick={() => removeRow(rIdx)}
                    disabled={observationRows.length <= 1}
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Remove trial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
