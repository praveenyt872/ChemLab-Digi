import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Gauge, ShieldCheck, Zap } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { useExperimentStore } from '../store/experimentStore';

export function ExperimentSelectPage({ onNavigate }) {
  const { setExperiment, currentSubject, studentDetails, setStudentGateOpen } = useExperimentStore();

  const fluidMechanicsExps = [
    {
      id: 'rotameter_calibration',
      title: 'Calibration of Rotameter',
      aim: 'To generate the calibration curve for the given rotameter by comparing observed flow rate with float position.',
      schematic: 'Rotameter Tapered Glass Tube + Float',
      formulaPreview: 'Q = V / t',
      calcCount: '1 Formula Step',
      icon: <Gauge className="w-6 h-6 text-violet-600" />
    },
    {
      id: 'venturi_meter',
      title: 'Determine Coefficient of Discharge for Venturi Meter',
      aim: 'To determine the coefficient of discharge (Cd) of the Venturi meter and plot Cd vs Qth.',
      schematic: 'Converging Cone + Throat + U-Tube Manometer',
      formulaPreview: 'Qth = (A1 A2 √(2gH)) / √(A1² - A2²)',
      calcCount: '4 Formula Steps',
      icon: <Zap className="w-6 h-6 text-violet-600" />
    },
    {
      id: 'orifice_meter',
      title: 'Determine Coefficient of Discharge for Orifice Meter',
      aim: 'To determine the coefficient of discharge (Cd) of the Orifice meter and calibrate it by plotting Cd vs Qth.',
      schematic: 'Concentric Orifice Plate + Taps + Collecting Tank',
      formulaPreview: 'Qact = (A × h_rise) / t',
      calcCount: '4 Formula Steps',
      icon: <ShieldCheck className="w-6 h-6 text-violet-600" />
    },
    {
      id: 'pipe_friction',
      title: 'Friction Losses in Fluid Flow in Pipes',
      aim: 'To determine the Coefficient of Friction (or Friction factor f) for fluid flow through pipes.',
      schematic: '17mm G.I. Pipe + Differential Manometer + Collecting Tank',
      formulaPreview: 'f = (hf × D × g) / (2 L V²)',
      calcCount: '5 Formula Steps',
      icon: <Gauge className="w-6 h-6 text-violet-600" />
    }
  ];

  const processControlExps = [
    {
      id: 'exp1-first-order-system-response',
      title: 'Response of First-Order System',
      aim: 'To study the behavior and determine the time constant of a first-order process subjected to step and sinusoidal heat input changes.',
      schematic: 'Thermal Heating Bath + Thermocouple / Thermowell + Cyclic Timer',
      formulaPreview: 'τ = (m Cp)/(h A)  |  AR = 1/√(1+(ωτ)²)  |  T̄\'(t) = K(1 - e^-t/τ)',
      calcCount: 'Part A & Part B (Step + Sinusoidal)',
      icon: <Gauge className="w-6 h-6 text-violet-600" />
    }
  ];

  const heatTransferExps = [
    {
      id: 'free_convection',
      title: 'Free Convection',
      aim: 'Estimation of overall heat transfer coefficient in a FREE CONVECTION setup',
      schematic: 'Vertical Brass Cylinder + Heater + 7 Surface Temp Sensors + Duct Sensor',
      formulaPreview: 'h = q / (As × (Ts - Ta))',
      calcCount: '5 Formula Steps',
      icon: <Zap className="w-6 h-6 text-violet-600" />
    }
  ];

  const reactionEngExps = [
    {
      id: 'rtd_cstr',
      title: 'RTD Studies in a CSTR',
      aim: 'Study non-ideality of CSTR and find mean residence time t̄ for impulse tracer injection; plot exit age distribution (E curve).',
      schematic: 'CSTR + Peristaltic Pump + RTD Probe & DAQ + Titration Setup',
      formulaPreview: 'E = C / Σ(CΔt)  |  t̄ = Σ(tCΔt) / Σ(CΔt)',
      calcCount: '4 Formula Steps',
      icon: <Zap className="w-6 h-6 text-violet-600" />
    }
  ];

  const isProcessControl = currentSubject === 'instrumentation-process-control';
  const isHeatTransfer = currentSubject === 'heat_transfer';
  const isReactionEng = currentSubject === 'reaction_eng';

  const experiments = isProcessControl
    ? processControlExps
    : isHeatTransfer
    ? heatTransferExps
    : isReactionEng
    ? reactionEngExps
    : fluidMechanicsExps;

  const subjectTitle = isProcessControl
    ? 'Process Control Lab'
    : isHeatTransfer
    ? 'Heat Transfer Lab'
    : isReactionEng
    ? 'Reaction Engineering Lab'
    : 'Fluid Mechanics Lab';

  const subjectDesc = isProcessControl
    ? 'First-order thermal response dynamics, step input, sinusoidal lag, time constants, and phase shift.'
    : isHeatTransfer
    ? 'Natural convection, heat transfer coefficient h, surface temperature profiles, and thermal calculations.'
    : isReactionEng
    ? 'CSTR RTD exit age distribution, impulse tracer injection, mean residence time, and ideal reactor comparison.'
    : 'Select an experiment module to launch the interactive virtual workspace and calculation engine.';

  const handleLaunch = (expId) => {
    setExperiment(expId);
    if (!studentDetails?.studentName || !studentDetails?.registerNumber) {
      setStudentGateOpen(true);
    }
    onNavigate('workspace');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
        <button onClick={() => onNavigate('subject')} className="hover:text-violet-600 transition-colors">
          Subjects
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-700 font-semibold">{subjectTitle}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-violet-600 font-semibold">Select Experiment</span>
      </div>

      <div className="border-b border-[#EDEEF1] pb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {subjectTitle} Modules
        </h1>
        <p className="text-sm text-slate-500 font-sans mt-1">
          {subjectDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {experiments.map((exp) => (
          <GlassCard
            key={exp.id}
            interactive
            onClick={() => handleLaunch(exp.id)}
            className="flex flex-col justify-between h-[320px] cursor-pointer group hover:border-violet-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {exp.icon}
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {exp.calcCount}
                </span>
              </div>

              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed mt-2 line-clamp-3">
                  {exp.aim}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-violet-700 font-semibold">
                Formula: {exp.formulaPreview}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLaunch(exp.id);
              }}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Virtual Experiment</span>
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
