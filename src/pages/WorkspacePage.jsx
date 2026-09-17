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
  HelpCircle,
  Code2,
  ListOrdered,
  Lock,
  UserCheck
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { useAuthStore } from '../store/authStore';
import { formatScientific, formatResultString } from '../engine/formulaEngine';
import { GlassCard } from '../components/common/GlassCard';
import { ObservationTable } from '../components/workspace/ObservationTable';
import { ManualCalculationPanel } from '../components/workspace/ManualCalculationPanel';
import { SampleCalculationPanel } from '../components/workspace/SampleCalculationPanel';
import { StandardizationTables } from '../components/workspace/StandardizationTables';
import { LiveResultsPanel } from '../components/workspace/LiveResultsPanel';
import { GraphPanel } from '../components/workspace/GraphPanel';
import { FormulaCard } from '../components/workspace/FormulaCard';
import { AIValidationPanel } from '../components/workspace/AIValidationPanel';
import { StudentInterpretationPanel } from '../components/workspace/StudentInterpretationPanel';
import { CodeReferenceModal } from '../components/modals/CodeReferenceModal';
import { WorkedExampleModal } from '../components/modals/WorkedExampleModal';
import { getSchematicDiagram } from '../utils/schematicAssets';
import { isValidRajalakshmiEmail } from '../data/faculty';
import recLogo from '../assets/rec-logo.png';

export function WorkspacePage({ onNavigate }) {
  const {
    experimentConfig,
    activePartConfig,
    activePartId,
    setActivePart,
    headlineResult,
    currentSubject,
    calculatedRows,
    studentDetails,
    setStudentGateOpen
  } = useExperimentStore();
  const [mobileTab, setMobileTab] = useState('data');
  const [isCodeModalOpen, setCodeModalOpen] = useState(false);

  const authRole = useAuthStore((s) => s.role);

  const isAuthorized = authRole === 'teacher' || Boolean(
    studentDetails?.studentName &&
    studentDetails?.registerNumber &&
    isValidRajalakshmiEmail(studentDetails?.email)
  );

  React.useEffect(() => {
    if (!isAuthorized) {
      setStudentGateOpen(true);
    }
  }, [isAuthorized, setStudentGateOpen]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Student Login Required
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Rajalakshmi Engineering College Virtual Laboratory
            </p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Only verified students logged in with their official college email ending with <span className="font-mono font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">@rajalakshmi.edu.in</span> can access and perform laboratory experiments.
          </p>
          <button
            onClick={() => setStudentGateOpen(true)}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Log in with @rajalakshmi.edu.in</span>
          </button>
        </div>
      </div>
    );
  }

  const config = activePartConfig || experimentConfig;
  if (!config) return null;

  const schematicUrl = getSchematicDiagram(config) || getSchematicDiagram(experimentConfig);

  const isProcessControl = currentSubject === 'instrumentation-process-control' || experimentConfig?.subject === 'instrumentation-process-control';
  const isHeatTransfer = currentSubject === 'heat_transfer' || experimentConfig?.subject === 'heat_transfer';
  const isReactionEng = currentSubject === 'reaction_eng' || experimentConfig?.subject === 'reaction_eng';
  const isFreeConvection = experimentConfig?.experiment_id === 'free_convection';
  const isRtdCstr = experimentConfig?.experiment_id === 'rtd_cstr';

  const subjectCategoryLabel = isReactionEng
    ? 'Reaction Engineering Lab'
    : isProcessControl
    ? 'Process Control Lab'
    : isHeatTransfer
    ? 'Heat Transfer Lab'
    : 'Fluid Mechanics Lab';

  const hasParts = Array.isArray(experimentConfig?.parts) && experimentConfig.parts.length > 0;
  const headlineConfig = config?.headline_output || config?.headlineOutput || experimentConfig?.headline_output || experimentConfig?.headlineOutput;
  const headlineLabel = headlineConfig?.label || (isFreeConvection ? 'h' : isRtdCstr ? 't̄' : 'Cd');

  let headlineOutputText = '—';
  if (headlineResult.mean !== null && headlineResult.mean !== undefined) {
    if (isRtdCstr || headlineConfig?.resultKey === 't_bar') {
      headlineOutputText = `t̄ = ${headlineResult.mean.toFixed(2)} sec`;
    } else if (experimentConfig.experiment_id === 'rotameter_calibration') {
      headlineOutputText = `Q = ${formatScientific(headlineResult.mean, 4)} m³/s`;
    } else if (experimentConfig.experiment_id === 'pipe_friction') {
      headlineOutputText = `f = ${headlineResult.mean.toFixed(5)}`;
    } else if (experimentConfig.experiment_id === 'minor_losses') {
      headlineOutputText = `K = ${headlineResult.mean.toFixed(2)}`;
    } else if (experimentConfig.experiment_id === 'centrifugal_pump' || experimentConfig.experiment_id === 'reciprocating_pump' || experimentConfig.experiment_id === 'gear_oil_pump') {
      const maxVal = headlineResult.max !== null ? headlineResult.max.toFixed(2) : (headlineResult.mean !== null ? headlineResult.mean.toFixed(2) : '—');
      const meanVal = headlineResult.mean !== null ? headlineResult.mean.toFixed(2) : null;
      headlineOutputText = meanVal ? `Max η = ${maxVal} % | Mean η = ${meanVal} %` : `Max η = ${maxVal} %`;
    } else if (experimentConfig.experiment_id === 'exp1-first-order-system-response') {
      headlineOutputText = activePartId === 'partA' ? `τ = 10.0 s (63.2%)` : `AR = 0.375 | τ = 27 s`;
    } else if (experimentConfig.experiment_id === 'helical_spiral_coil') {
      headlineOutputText = `fc = ${headlineResult.mean.toFixed(4)}`;
    } else if (experimentConfig.experiment_id === 'drag_coefficient_solid_particle') {
      headlineOutputText = `CD = ${headlineResult.mean.toFixed(4)}`;
    } else if (isFreeConvection || headlineLabel === 'h') {
      headlineOutputText = `h = ${headlineResult.mean.toFixed(2)} W/m²·K`;
    } else {
      headlineOutputText = `Cd = ${headlineResult.mean.toFixed(3)}`;
    }
  }

  // Co-efficient of friction factor (Exp and Calculated) for Helical and Spiral Coil
  let coilExpFriction = '—';
  let coilCalcFriction = '—';
  if (experimentConfig?.experiment_id === 'helical_spiral_coil') {
    const Dp = 0.021;
    const L = 5.6;
    const g = 9.81;

    const dataToEvaluate = (calculatedRows && calculatedRows.some(r => r && (r.Hc || r.h2)))
      ? calculatedRows
      : (config?.sample_data || []);

    const expList = [];
    const calcList = [];

    dataToEvaluate.forEach(r => {
      let V = parseFloat(r.V);
      let Hc = parseFloat(r.Hc);
      let fst = parseFloat(r.fst);
      let NRe = parseFloat(r.N_Re);

      if ((isNaN(V) || isNaN(Hc)) && r.Q_act && (r.h1 !== undefined && r.h2 !== undefined)) {
        const dh = Math.abs(parseFloat(r.h2) - parseFloat(r.h1));
        Hc = (dh / 100) * 12.6;
        const A = (Math.PI / 4) * (Dp * Dp);
        V = (parseFloat(r.Q_act) * 0.0001) / A;
        NRe = (1000 * V * Dp) / 0.01;
        fst = NRe < 2000 ? 16 / NRe : 0.046 / Math.pow(NRe, 0.2);
      }

      if (!isNaN(V) && !isNaN(Hc) && V > 0 && Hc > 0) {
        const fExp = (Hc * g * Dp) / (2 * L * (V * V));
        if (!isNaN(fExp) && isFinite(fExp) && fExp > 0) {
          expList.push(fExp);
        }
      }

      if (!isNaN(fst) && isFinite(fst) && fst > 0) {
        calcList.push(fst);
      } else if (!isNaN(NRe) && NRe > 0) {
        const fCalc = NRe < 2000 ? 16 / NRe : 0.046 / Math.pow(NRe, 0.2);
        calcList.push(fCalc);
      }
    });

    if (expList.length > 0) {
      coilExpFriction = (expList.reduce((a, b) => a + b, 0) / expList.length).toFixed(4);
    }
    if (calcList.length > 0) {
      coilCalcFriction = (calcList.reduce((a, b) => a + b, 0) / calcList.length).toFixed(4);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900">
      
      {/* Experiment Title Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#EDEEF1] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-700">
            <span className="uppercase tracking-wider">
              {subjectCategoryLabel}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <img src={recLogo} alt="REC Logo" className="w-4 h-4 object-contain shrink-0" />
              <span>Rajalakshmi Engineering College</span>
            </div>
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
              {headlineOutputText}
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
        {config.show_graph !== false && config.graph && (
          <button
            onClick={() => setMobileTab('graph')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-center transition-all ${
              mobileTab === 'graph' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Graph
          </button>
        )}
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

              {schematicUrl && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-violet-700 font-bold uppercase tracking-wider block font-mono">EXPERIMENTAL SETUP SCHEMATIC DIAGRAM</span>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-center items-center overflow-hidden">
                    <img
                      src={schematicUrl}
                      alt={`${config.title || experimentConfig.title} Schematic Diagram`}
                      className="max-h-80 w-auto object-contain rounded-lg shadow-sm bg-white p-2 border border-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Procedure Card */}
          {config.procedure && config.procedure.length > 0 && (
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EDEEF1] pb-3">
                <ListOrdered className="w-5 h-5 text-violet-600" />
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Experimental Procedure
                </h3>
              </div>

              <ol className="space-y-2 text-xs font-sans text-slate-700 list-decimal list-inside leading-relaxed">
                {config.procedure.map((step, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-900">{step}</span>
                  </li>
                ))}
              </ol>
            </GlassCard>
          )}

          {/* Theory & Formulas Section */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDEEF1] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  Theory & Formula Derivations
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {config.reference_code && (
                  <button
                    onClick={() => setCodeModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>View Code Reference</span>
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-violet-700 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200">
                  {(config.formulas || []).length} Formulas
                </span>
              </div>
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

          {/* Standardization Tables (Table A & Table B for RTD in CSTR) */}
          {config.experiment_id === 'rtd_cstr' && (
            <StandardizationTables />
          )}

          {/* Observation Table Input */}
          <GlassCard className="space-y-4">
            <ObservationTable />
          </GlassCard>

          {/* Manual Calculation Tasks Panel (Gated by manual_calculation_mode) */}
          {config.manual_calculation_mode ? (
            <ManualCalculationPanel />
          ) : (
            <GlassCard className="space-y-4">
              <SampleCalculationPanel />
            </GlassCard>
          )}

          {/* Graph Panel (gated by config.show_graph !== false && config.graph) */}
          {config.show_graph !== false && Boolean(config.graph) && (
            <GlassCard className="space-y-4">
              <GraphPanel />
            </GlassCard>
          )}

          {/* Viva Voce Section (gated by config.show_viva !== false && config.viva_questions) */}
          {config.show_viva !== false && Boolean(config.viva_questions) && config.viva_questions.length > 0 && (
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

          {/* Student Interpretation & Theoretical Deviation Analysis */}
          <StudentInterpretationPanel />

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
              ) : experimentConfig.experiment_id === 'helical_spiral_coil' ? (
                <div className="space-y-1.5 text-sm font-mono text-slate-900 font-bold">
                  <p>Co-efficient of friction factor - Exp &nbsp;= &nbsp;<span className="text-cyan-700">{coilExpFriction}</span></p>
                  <p>Co-efficient of friction factor – Calculated = &nbsp;<span className="text-violet-700">{coilCalcFriction}</span></p>
                </div>
              ) : config.result_template ? (
                <p className="text-sm font-semibold text-slate-900 font-sans">
                  {formatResultString(config.result_template, headlineResult)}
                </p>
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

      {/* Code Reference Modal */}
      {config.reference_code && (
        <CodeReferenceModal
          isOpen={isCodeModalOpen}
          onClose={() => setCodeModalOpen(false)}
          referenceCode={config.reference_code}
          experimentTitle={config.title}
        />
      )}

      {/* Worked Example Reference Pop-up Modal */}
      <WorkedExampleModal />
    </div>
  );
}
