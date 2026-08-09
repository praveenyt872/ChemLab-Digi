import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, Flame, ArrowRightLeft, Atom, Cog, Gauge, Lock, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { useExperimentStore } from '../store/experimentStore';

export function SubjectSelectPage({ onNavigate }) {
  const { setSubject, studentDetails, setStudentGateOpen } = useExperimentStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectSubject = (subId) => {
    setSubject(subId);
    if (!studentDetails?.studentName || !studentDetails?.registerNumber) {
      setStudentGateOpen(true);
    }
    onNavigate('experiment');
  };

  const studentName = studentDetails?.studentName || 'Student';
  const hasStudentDetails = Boolean(studentDetails?.studentName && studentDetails?.registerNumber);

  const subjects = [
    {
      id: 'fluid_mechanics',
      name: 'Fluid Mechanics',
      icon: <Waves className="w-6 h-6 text-violet-600" />,
      active: true,
      experimentsCount: 3,
      category: 'Core Chemical Engineering',
      desc: 'Flow meters, Venturi Meter, Orifice Meter, Rotameter calibration, Bernoulli principles, and friction losses.'
    },
    {
      id: 'instrumentation-process-control',
      name: 'Process Control Lab',
      icon: <Gauge className="w-6 h-6 text-violet-600" />,
      active: true,
      experimentsCount: 1,
      category: 'Process Control & Systems',
      desc: 'Response of first-order thermal system (Step & Sinusoidal input), time constant determination, AR, phase lag, and PID tuning.'
    },
    {
      id: 'heat_transfer',
      name: 'Heat Transfer',
      icon: <Flame className="w-6 h-6 text-violet-600" />,
      active: true,
      experimentsCount: 1,
      category: 'Thermal Operations',
      desc: 'Free convection over vertical cylinder, overall heat transfer coefficient h, and thermal calculations.'
    },
    {
      id: 'mass_transfer',
      name: 'Mass Transfer',
      icon: <ArrowRightLeft className="w-6 h-6 text-slate-400" />,
      active: false,
      category: 'Separation Processes',
      desc: 'Simple distillation, liquid-liquid extraction, packed column absorption, and diffusivity measurements.'
    },
    {
      id: 'reaction_eng',
      name: 'Chemical Reaction Engineering',
      icon: <Atom className="w-6 h-6 text-slate-400" />,
      active: false,
      category: 'Kinetics & Reactor Design',
      desc: 'Continuous Stirred Tank Reactor (CSTR), Tubular Plug Flow Reactor (PFR), and RTD studies.'
    },
    {
      id: 'mechanical_ops',
      name: 'Mechanical Operations',
      icon: <Cog className="w-6 h-6 text-slate-400" />,
      active: false,
      category: 'Solid Processing',
      desc: 'Ball mill size reduction, screen effectiveness, froth flotation, and sedimentation clarifiers.'
    }
  ];

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900">
      
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EDEEF1] pb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hi, {studentName} 👋
          </h1>
          <p className="text-sm text-slate-500 font-sans mt-1">
            Here's your virtual chemical engineering lab progress & experiment workspace overview.
          </p>
        </div>
        {hasStudentDetails && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
              Field: Chemical Engineering (CH23331 / CH23722)
            </span>
          </div>
        )}
      </div>

      {/* Subject Lab Modules Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900">
            Subject Laboratories
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Select a chemical engineering laboratory discipline to launch experiment modules.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter subjects..."
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-sm"
          />
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => (
          <GlassCard
            key={sub.id}
            interactive={sub.active}
            onClick={() => {
              if (sub.active) {
                handleSelectSubject(sub.id);
              }
            }}
            className={`flex flex-col justify-between h-[250px] relative overflow-hidden transition-all duration-200 ${
              sub.active
                ? 'cursor-pointer hover:border-violet-400 hover:shadow-md'
                : 'opacity-65 grayscale-[30%] cursor-not-allowed bg-slate-50/60 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  {sub.icon}
                </div>
                {sub.active ? (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Active Lab
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Locked
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-violet-600 block">
                  {sub.category}
                </span>
                <h3 className="font-heading text-lg font-bold text-slate-900 mt-0.5">
                  {sub.name}
                </h3>
              </div>

              <p className="text-xs text-slate-500 font-sans leading-relaxed mt-2 line-clamp-2">
                {sub.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-semibold">
                {sub.active ? `${sub.experimentsCount} Experiments Available` : 'Module coming soon'}
              </span>
              {sub.active && (
                <span className="text-violet-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
