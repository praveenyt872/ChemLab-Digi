import React, { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw, Database, Info, Trash2, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { UNIT_SYSTEM_OPTIONS, getAvailableUnits } from '../../utils/unitConversion';

export function ObservationTable() {
  const {
    activePartConfig,
    experimentConfig,
    observationRows,
    updateCell,
    addRow,
    removeRow,
    setResetConfirmOpen,
    loadSampleData,
    activeUnitSystem,
    selectedUnits,
    setSelectedUnit,
    setUnitSystem
  } = useExperimentStore();

  const [activeDropdownField, setActiveDropdownField] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = activePartConfig || experimentConfig;
  const trialInputs = config?.trial_inputs || [];

  return (
    <div className="space-y-4">
      {/* Header controls & Unit System selector */}
      <div className="flex flex-col gap-3 pb-3 border-b border-[#EDEEF1]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Observation Table</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                {observationRows.length} Trials
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter readings taken during lab session. Select your preferred units below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 text-xs font-mono font-semibold transition-all cursor-pointer"
              title="Populate table with verified sample lab readings in currently selected units"
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

        {/* Global Unit System Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
              Unit System:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {UNIT_SYSTEM_OPTIONS.map((opt) => {
              const isActive = activeUnitSystem === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setUnitSystem(opt.id)}
                  title={opt.description}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-violet-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 font-medium'
                  }`}
                >
                  <span className="text-xs">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editable Data Grid with Individual Column Unit Dropdowns */}
      <div className="overflow-x-auto rounded-xl border border-[#EDEEF1] bg-white shadow-xs" ref={dropdownRef}>
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-[#EDEEF1] text-slate-700 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-12 text-center">Trial</th>
              {trialInputs.map(input => {
                const currentUnit = selectedUnits?.[input.id] || input.unit || '';
                const availableUnits = getAvailableUnits(input.unit);
                const hasMultipleUnits = availableUnits.length > 1;
                const isDropdownOpen = activeDropdownField === input.id;

                return (
                  <th key={input.id} className="py-3 px-4 min-w-[150px] relative">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-slate-800 font-bold">
                        {input.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {hasMultipleUnits ? (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownField(isDropdownOpen ? null : input.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 hover:border-violet-300 transition-all cursor-pointer shadow-2xs"
                              title={`Click to change unit for ${input.label}`}
                            >
                              <span>{currentUnit}</span>
                              <ChevronDown className="w-3 h-3 text-violet-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                              <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1 font-mono text-xs normal-case animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Select Unit
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1">
                                  {availableUnits.map((u) => {
                                    const isSelected = currentUnit === u.symbol;
                                    return (
                                      <button
                                        key={u.symbol}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedUnit(input.id, u.symbol);
                                          setActiveDropdownField(null);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-violet-50 transition-colors cursor-pointer ${
                                          isSelected ? 'text-violet-700 font-bold bg-violet-50/60' : 'text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>{u.label}</span>
                                          <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                                            {u.system}
                                          </span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-600" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          currentUnit && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({currentUnit})
                            </span>
                          )
                        )}

                        {input.tooltip && (
                          <span className="group relative cursor-pointer text-violet-500 hover:text-violet-700 ml-0.5">
                            <Info className="w-3.5 h-3.5" />
                            <span className="pointer-events-none absolute right-0 top-6 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] normal-case text-white z-30 shadow-xl">
                              {input.tooltip}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-4 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {observationRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-4 text-center font-bold text-violet-700">
                  #{rIdx + 1}
                </td>

                {trialInputs.map(input => {
                  const val = row[input.id] !== undefined ? row[input.id] : '';
                  const numVal = parseFloat(val);
                  const allowZero = config?.experiment_id === 'exp1-first-order-system-response' || input.id === 't';
                  const isValid = val !== '' && !isNaN(numVal) && (allowZero ? numVal >= 0 : numVal > 0);
                  const isInvalid = val !== '' && (isNaN(numVal) || (allowZero ? numVal < 0 : numVal <= 0));
                  const currentUnit = selectedUnits?.[input.id] || input.unit || '';

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
                        {currentUnit && (
                          <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none select-none font-mono">
                            {currentUnit}
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
