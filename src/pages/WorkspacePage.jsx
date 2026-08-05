import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  BookOpen,
  Calculator,
  LineChart,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { formatScientific } from '../engine/formulaEngine';
import { GlassCard } from '../components/common/GlassCard';
import { ObservationTable } from '../components/workspace/ObservationTable';
import { SampleCalculationPanel } from '../components/workspace/SampleCalculationPanel';
import { LiveResultsPanel } from '../components/workspace/LiveResultsPanel';
import { GraphPanel } from '../components/workspace/GraphPanel';
import { FormulaCard } from '../components/workspace/FormulaCard';
import { AIValidationPanel } from '../components/workspace/AIValidationPanel';

export function WorkspacePage({ onNavigate }) {
  const {
    experimentConfig,
    activePartConfig,
    activePartId,
    setActivePart,
    headlineResult,
    currentSubject
  } = useExperimentStore();
  const [mobileTab, setMobileTab] = useState('data');

  const config = activePartConfig || experimentConfig;
  if (!config) return null;

  const isProcessControl = currentSubject === 'instrumentation-process-control' || experimentConfig?.subject === 'instrumentation-process-control';
  const hasParts = Array.isArray(experimentConfig?.parts) && experimentConfig.parts.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900">
      
      {/* Experiment Title Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#EDEEF1] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-700">
            <span className="uppercase tracking-wider">
              {isProcessControl ? 'Instrumentation & Process Control Lab' : 'Fluid Mechanics Lab'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>REC ChemEngg 2026 Lab</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            {experimentConfig.title}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1 max-w-3xl">
            {config.aim}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-violet-50 border border-violet-100 text-right font-mono">
            <span className="text-[10px] text-slate-500 block font-semibold uppercase">Headline Output</span>
            <span className="text-lg font-bold text-violet-700">
              {headlineResult.mean !== null
                ? experimentConfig.experiment_id === 'rotameter_calibration'
                  ? formatScientific(headlineResult.mean, 4)
                  : experimentConfig.experiment_id === 'exp1-first-order-system-response'
                  ? activePartId === 'partA'
                    ? `τ = 10.0 s (63.2%)`
                    : `AR = 0.375 | τ = 27 s`
                  : `Cd = ${headlineResult.mean.toFixed(3)}`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher for Multi-Part Experiments */}
      {hasParts && (
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 font-mono text-xs shadow-sm">
          {experimentConfig.parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setActivePart(part.id)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-center transition-all cursor-pointer ${
                activePartId === part.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {part.title}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Navigation Tabs */}
      <div className="flex lg:hidden rounded-xl bg-slate-100 p-1 border border-slate-200 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setMobileTab('data')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center transition-all ${
            mobileTab === 'data' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          Data Input
        </button>
        <button
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center transition-all ${
            mobileTab === 'results' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          Results
        </button>
        <button
          onClick={() => setMobileTab('graph')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center transition-all ${
            mobileTab === 'graph' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setMobileTab('theory')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold text-center transition-all ${
            mobileTab === 'theory' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
          }`}
        >
          Theory
        </button>
      </div>

      {/* Split-Pane Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Main Interactive Cards */}
        <div className={`lg:col-span-7 space-y-6 ${mobileTab !== 'data' && mobileTab !== 'theory' && mobileTab !== 'graph' ? 'hidden lg:block' : ''}`}>
          
          {/* Aim & Apparatus Card */}
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EDEEF1] pb-3">
              <FlaskConical className="w-5 h-5 text-violet-600" />
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Aim & Apparatus — {config.short_title || config.title}
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-violet-700 font-bold uppercase tracking-wider block mb-1">AIM</span>
                <p className="text-slate-700 font-sans leading-relaxed">{config.aim}</p>
              </div>

              <div>
                <span className="text-violet-700 font-bold uppercase tracking-wider block mb-2">APPARATUS REQUIRED</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-sans">
                  {(config.apparatus || experimentConfig.apparatus || []).map((app, i) => (
                    <li key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                      <span>{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* Theory & Formulas Section */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDEEF1] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Theory & Formula Derivations
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-violet-700 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200">
                {(config.formulas || []).length} Formulas
              </span>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed whitespace-pre-wrap">
              {config.theory}
            </p>

            <div className="space-y-3 pt-2">
              {(config.formulas || []).map((formula) => (
                <FormulaCard key={formula.id} formula={formula} />
              ))}
            </div>
          </GlassCard>

          {/* Observation Table Input */}
          <GlassCard className="space-y-4">
            <ObservationTable />
          </GlassCard>

          {/* Step-by-Step Sample Calculation Panel */}
          <GlassCard className="space-y-4">
            <SampleCalculationPanel />
          </GlassCard>

          {/* Graph Panel */}
          <GlassCard className="space-y-4">
            <GraphPanel />
          </GlassCard>

          {/* Viva Voce Section for Process Control */}
          {config.viva_questions && config.viva_questions.length > 0 && (
            <GlassCard className="border-l-4 border-l-violet-600 space-y-4">
              <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-[#EDEEF1] pb-3">
                <HelpCircle className="w-5 h-5 text-violet-600" />
                <span>Viva Voce / Lab Manual Review Questions</span>
              </h3>

              <div className="space-y-3 text-xs font-mono">
                {config.viva_questions.map((vq, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-violet-800 font-bold block">{vq.question}</span>
                    <p className="text-slate-700 font-sans leading-relaxed">{vq.answer}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Result & Precautions Section */}
          <GlassCard className="border-l-4 border-l-amber-500 space-y-4">
            <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-[#EDEEF1] pb-3">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Result & Experimental Precautions</span>
            </h3>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-mono space-y-2">
              <span className="text-amber-800 font-bold uppercase tracking-wider block">STATUTORY RESULT</span>
              {experimentConfig.experiment_id === 'rotameter_calibration' ? (
                <p className="text-sm font-semibold text-slate-900 font-sans">
                  The calibration curve for the given rotameter is generated.
                </p>
              ) : experimentConfig.experiment_id === 'exp1-first-order-system-response' ? (
                activePartId === 'partA' ? (
                  <p className="text-sm font-semibold text-slate-900 font-sans">
                    The step response of the first-order system is studied and the graphical time constant τ (at 63.2% response) is found to be 10.0 sec.
                  </p>
                ) : (
                  <div className="space-y-2 font-sans">
                    <p className="text-sm font-semibold text-slate-900">
                      The sinusoidal response of the thermowell/thermocouple is evaluated with the following parameters:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800 shadow-sm">
                      <div>• I/p amplitude = <span className="text-violet-700 font-bold">10 °C</span></div>
                      <div>• O/p amplitude = <span className="text-violet-700 font-bold">3 °C</span></div>
                      <div>• Amplitude Ratio (AR) = <span className="text-violet-700 font-bold">0.3</span></div>
                      <div>• Freq of oscillation (ω) = <span className="text-violet-700 font-bold">0.105 rad/s</span></div>
                      <div>• Phase lag (φ) = <span className="text-violet-700 font-bold">60°</span></div>
                      <div>• θ / A = <span className="text-violet-700 font-bold">0.1365</span></div>
                      <div className="col-span-1 sm:col-span-2 text-emerald-700 font-bold border-t border-slate-200 pt-1.5 mt-1">
                        • Time Constant (τ) = 30.36 sec
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm font-semibold text-slate-900 font-sans">
                  The mean coefficient of discharge for {experimentConfig.short_name} Cd is found to be {headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '—'}.
                </p>
              )}
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                LAB SAFETY & OPERATIONAL PRECAUTIONS
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700 font-sans">
                {(config.precautions || [
                  'Maintain constant water circulation flow through the heating bath.',
                  'Avoid touching heater coils directly during electrical step voltage changes.',
                  'Record stopwatch timing intervals precisely at steady state.'
                ]).map((prec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>

        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className={`lg:col-span-5 lg:sticky lg:top-20 space-y-6 ${mobileTab !== 'results' ? 'hidden lg:block' : ''}`}>
          
          {/* Live Results Summary Panel */}
          <GlassCard className="space-y-4">
            <LiveResultsPanel />
          </GlassCard>

          {/* AI Validation Panel */}
          <GlassCard className="space-y-4">
            <AIValidationPanel />
          </GlassCard>

        </div>

      </div>
    </div>
  );
}
