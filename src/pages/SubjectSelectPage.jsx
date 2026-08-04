import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Flame, ArrowRightLeft, Atom, Cog, Gauge, Lock, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedBadge } from '../components/common/AnimatedBadge';

import { useExperimentStore } from '../store/experimentStore';

export function SubjectSelectPage({ onNavigate }) {
  const { setSubject, studentDetails, setStudentGateOpen } = useExperimentStore();

  const handleSelectSubject = (subId) => {
    setSubject(subId);
    if (!studentDetails?.studentName || !studentDetails?.registerNumber) {
      setStudentGateOpen(true);
    }
    onNavigate('experiment');
  };

  const subjects = [
    {
      id: 'fluid_mechanics',
      name: 'Fluid Mechanics',
      icon: <Waves className="w-8 h-8 text-cyan-400" />,
      active: true,
      experimentsCount: 3,
      desc: 'Flow meters, Venturi, Orifice, Rotameter calibration, Bernoulli principles, and pressure drop studies.'
    },
    {
      id: 'heat_transfer',
      name: 'Heat Transfer',
      icon: <Flame className="w-8 h-8 text-slate-500" />,
      active: false,
      experimentsCount: 0,
      desc: 'Double pipe heat exchanger, shell & tube exchanger, Stefan-Boltzmann radiation, and thermal conductivity.'
    },
    {
      id: 'mass_transfer',
      name: 'Mass Transfer',
      icon: <ArrowRightLeft className="w-8 h-8 text-slate-500" />,
      active: false,
      experimentsCount: 0,
      desc: 'Simple distillation, liquid-liquid extraction, packed column absorption, and diffusivity measurements.'
    },
    {
      id: 'reaction_eng',
      name: 'Chemical Reaction Engineering',
      icon: <Atom className="w-8 h-8 text-slate-500" />,
      active: false,
      experimentsCount: 0,
      desc: 'Continuous Stirred Tank Reactor (CSTR), Tubular Plug Flow Reactor (PFR), and RTD studies.'
    },
    {
      id: 'mechanical_ops',
      name: 'Mechanical Operations',
      icon: <Cog className="w-8 h-8 text-slate-500" />,
      active: false,
      experimentsCount: 0,
      desc: 'Ball mill size reduction, screen effectiveness, froth flotation, and sedimentation clarifiers.'
    },
    {
      id: 'instrumentation-process-control',
      name: 'Instrumentation & Process Control Lab',
      icon: <Gauge className="w-8 h-8 text-violet-400" />,
      active: true,
      experimentsCount: 1,
      desc: 'Response of first-order thermal system (Step input & Sinusoidal input), time constant determination, AR, phase lag, and PID dynamics.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h2 className="font-heading text-3xl font-bold text-slate-100 flex items-center gap-3">
          <span>Select Subject Laboratory</span>
        </h2>
        <p className="text-sm font-mono text-cyan-300/80 mt-1">
          Choose a Chemical Engineering laboratory discipline to launch virtual experiment modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <GlassCard
            key={sub.id}
            interactive={sub.active}
            onClick={() => {
              if (sub.active) {
                handleSelectSubject(sub.id);
              }
            }}
            className={`flex flex-col justify-between h-[240px] relative overflow-hidden ${
              sub.active
                ? 'cursor-pointer border-cyan-500/40 shadow-[0_0_25px_rgba(0,229,255,0.15)] hover:border-cyan-400'
                : 'opacity-60 grayscale-[40%] cursor-not-allowed border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center">
                  {sub.icon}
                </div>
                {sub.active ? (
                  <AnimatedBadge variant="cyan">Active Lab</AnimatedBadge>
                ) : (
                  <AnimatedBadge variant="locked">
                    <Lock className="w-3 h-3" />
                    <span>Coming Soon</span>
                  </AnimatedBadge>
                )}
              </div>

              <h3 className="font-heading text-xl font-bold text-slate-100 mt-4">
                {sub.name}
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
                {sub.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                {sub.active ? `${sub.experimentsCount} Experiments Available` : 'Module locked'}
              </span>
              {sub.active && (
                <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
