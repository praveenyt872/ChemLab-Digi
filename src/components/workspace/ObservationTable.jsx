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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDEEF1]">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Observation Table</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {observationRows.length} Trials
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Enter exact readings taken during your physical lab session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-mono font-semibold transition-all cursor-pointer"
            title="Populate table with verified sample lab readings"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 text-xs font-mono font-semibold transition-all cursor-pointer"
            title="Clear all entered readings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Editable Data Grid */}
      <div className="overflow-x-auto rounded-xl border border-[#EDEEF1] bg-white">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-[#EDEEF1] text-slate-700 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-12 text-center">Trial</th>
              {trialInputs.map(input => (
                <th key={input.id} className="py-3 px-4 min-w-[140px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>
                      {input.label} {input.unit ? `(${input.unit})` : ''}
                    </span>
                    {input.tooltip && (
                      <span className="group relative cursor-pointer text-violet-500 hover:text-violet-700">
                        <Info className="w-3.5 h-3.5" />
                        <span className="pointer-events-none absolute right-0 top-6 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] normal-case text-white z-30 shadow-xl">
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
          <tbody className="divide-y divide-slate-100">
            {observationRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-4 text-center font-bold text-violet-700">
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
                          className={`w-full px-3 py-1.5 rounded-lg bg-white border text-xs font-mono text-slate-900 transition-all ${
                            isInvalid
                              ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-200'
                              : isValid
                              ? 'border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100'
                              : 'border-slate-300 focus:border-violet-500'
                          }`}
                        />
                        {input.unit && (
                          <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none select-none">
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
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
