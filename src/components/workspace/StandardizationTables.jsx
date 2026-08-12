import React from 'react';
import { Beaker, CheckCircle2, Plus, Trash2, Info } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { useExperimentStore } from '../../store/experimentStore';

export function StandardizationTables() {
  const {
    stdTableA,
    stdTableB,
    updateStdCellA,
    updateStdCellB,
    addStdRowA,
    addStdRowB,
    removeStdRowA,
    removeStdRowB,
    computedNNaOH,
    computedNHCl,
    fixedInputs
  } = useExperimentStore();

  const N1_oxalic = fixedInputs?.N1_oxalic ?? 0.1;

  return (
    <div className="space-y-6">
      
      {/* Table A: Standardization of NaOH against Oxalic Acid */}
      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-xs">
              A
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Standardization of NaOH (against Oxalic Acid)</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Primary Standard: Oxalic Acid ({N1_oxalic} N) — Formula: N_NaOH = (V1 × N1_oxalic) / V2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-xs font-mono font-bold text-violet-700 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              <span>N_NaOH = {computedNNaOH ? computedNNaOH.toFixed(2) : '2.00'} N</span>
            </div>

            <button
              onClick={addStdRowA}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white font-semibold text-xs hover:bg-violet-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {/* Table A Grid */}
        <div className="overflow-x-auto rounded-xl border border-[#EDEEF1] bg-white">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-[#EDEEF1] text-slate-700 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">Trial</th>
                <th className="py-2.5 px-3 min-w-[130px]">Vol Oxalic (V1, mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Burette Init (mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Burette Final (mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Vol NaOH (V2, mL)</th>
                <th className="py-2.5 px-3 min-w-[130px]">N_NaOH (N)</th>
                <th className="py-2.5 px-3 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stdTableA || []).map((row, idx) => {
                const v1 = parseFloat(row.V1 ?? 10);
                const init = parseFloat(row.initial ?? 0);
                const fin = parseFloat(row.final ?? 0);
                const v2 = Math.max(0, fin - init);
                const nTrial = v2 > 0 ? (v1 * N1_oxalic) / v2 : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-violet-700">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.V1 ?? ''}
                        onChange={(e) => updateStdCellA(idx, 'V1', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500"
                        placeholder="10"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.initial ?? ''}
                        onChange={(e) => updateStdCellA(idx, 'initial', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.final ?? ''}
                        onChange={(e) => updateStdCellA(idx, 'final', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500"
                        placeholder="0.5"
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {v2 > 0 ? v2.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-3 font-bold text-violet-700">
                      {nTrial > 0 ? nTrial.toFixed(2) : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeStdRowA(idx)}
                        disabled={(stdTableA || []).length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-all cursor-pointer"
                        title="Remove trial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Table B: Standardization of HCl against Standardized NaOH */}
      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
              B
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Standardization of HCl (against Standardized NaOH)</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Known NaOH Normality N1_NaOH = {computedNNaOH ? computedNNaOH.toFixed(2) : '2.00'} N — Formula: N_HCl = (V1 × N1_NaOH) / V2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>N_HCl = {computedNHCl ? computedNHCl.toFixed(2) : '1.00'} N</span>
            </div>

            <button
              onClick={addStdRowB}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {/* Table B Grid */}
        <div className="overflow-x-auto rounded-xl border border-[#EDEEF1] bg-white">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-[#EDEEF1] text-slate-700 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">Trial</th>
                <th className="py-2.5 px-3 min-w-[130px]">Vol NaOH (V1, mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Burette Init (mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Burette Final (mL)</th>
                <th className="py-2.5 px-3 min-w-[120px]">Vol HCl (V2, mL)</th>
                <th className="py-2.5 px-3 min-w-[130px]">N_HCl (N)</th>
                <th className="py-2.5 px-3 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stdTableB || []).map((row, idx) => {
                const v1 = parseFloat(row.V1 ?? 2);
                const init = parseFloat(row.initial ?? 0);
                const fin = parseFloat(row.final ?? 0);
                const v2 = Math.max(0, fin - init);
                const nNaOH = computedNNaOH || 2.0;
                const nTrial = v2 > 0 ? (v1 * nNaOH) / v2 : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.V1 ?? ''}
                        onChange={(e) => updateStdCellB(idx, 'V1', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-emerald-500"
                        placeholder="2"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.initial ?? ''}
                        onChange={(e) => updateStdCellB(idx, 'initial', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-emerald-500"
                        placeholder="0.0"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        step="any"
                        value={row.final ?? ''}
                        onChange={(e) => updateStdCellB(idx, 'final', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-emerald-500"
                        placeholder="4.0"
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {v2 > 0 ? v2.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-3 font-bold text-emerald-700">
                      {nTrial > 0 ? nTrial.toFixed(2) : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeStdRowB(idx)}
                        disabled={(stdTableB || []).length <= 1}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-all cursor-pointer"
                        title="Remove trial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            The calculated <strong>N_HCl = {computedNHCl ? computedNHCl.toFixed(2) : '1.00'} N</strong> feeds directly into the main RTD concentration formula: <code className="font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">C = (V3 × N_HCl) / Vol_sample</code>.
          </span>
        </div>
      </GlassCard>

    </div>
  );
}
