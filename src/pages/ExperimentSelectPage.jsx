import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Gauge, ShieldCheck, Zap } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { useExperimentStore } from '../store/experimentStore';

export function ExperimentSelectPage({ onNavigate }) {
  const { setExperiment } = useExperimentStore();

  const experiments = [
    {
      id: 'rotameter_calibration',
      title: 'Calibration of Rotameter',
      aim: 'To generate the calibration curve for the given rotameter by comparing observed flow rate with float position.',
      schematic: 'Rotameter Tapered Glass Tube + Float',
      formulaPreview: 'Q = V / t',
      calcCount: '1 Formula',
      icon: <Gauge className="w-8 h-8 text-cyan-400" />
    },
    {
      id: 'venturi_meter',
      title: 'Determine Coefficient of Discharge for Venturi Meter',
      aim: 'To determine the coefficient of discharge (Cd) of the Venturi meter and plot Cd vs Qth.',
      schematic: 'Converging Cone + Throat + U-Tube Manometer',
      formulaPreview: 'Qth = (A1 A2 √(2gH)) / √(A1² - A2²)',
      calcCount: '5 Derived Columns',
      icon: <Zap className="w-8 h-8 text-violet-400" />
    },
    {
      id: 'orifice_meter',
      title: 'Determine Coefficient of Discharge for Orifice Meter',
      aim: 'To determine the coefficient of discharge (Cd) of the Orifice meter and calibrate it by plotting Cd vs Qth.',
      schematic: 'Concentric Orifice Plate + Taps + Collecting Tank',
      formulaPreview: 'Qact = (A × h_rise) / t',
      calcCount: '5 Derived Columns',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />
    }
  ];

  const handleLaunch = (expId) => {
    setExperiment(expId);
    onNavigate('workspace');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <button onClick={() => onNavigate('subject')} className="hover:text-cyan-300 transition-colors">
          Fluid Mechanics Lab
        </button>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-cyan-300 font-semibold">Select Experiment</span>
      </div>

      <div>
        <h2 className="font-heading text-3xl font-bold text-slate-100">
          Fluid Mechanics Experiments
        </h2>
        <p className="text-sm font-mono text-cyan-300/80 mt-1">
          Select an experiment to open the dynamic workspace, enter readings, and evaluate calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {experiments.map((exp) => (
          <GlassCard
            key={exp.id}
            interactive
            onClick={() => handleLaunch(exp.id)}
            className="flex flex-col justify-between h-[320px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.1)] group-hover:scale-105 transition-transform">
                  {exp.icon}
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {exp.calcCount}
                </span>
              </div>

              <div>
                <h3 className="font-heading text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed mt-2 line-clamp-3">
                  {exp.aim}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-400/90">
                Formula: {exp.formulaPreview}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLaunch(exp.id);
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Experiment</span>
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
