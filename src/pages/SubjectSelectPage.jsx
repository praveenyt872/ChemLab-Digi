import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, Flame, ArrowRightLeft, Atom, Cog, Gauge, Search } from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';
import { SUBJECT_THEMES } from '../components/common/SubjectCardTheme';
import { ThemedSubjectCard } from '../components/common/ThemedSubjectCard';

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

  const rawSubjects = [
    {
      id: 'fluid_mechanics',
      name: 'Fluid Mechanics',
      icon: <Waves className="w-6 h-6 text-cyan-300" />,
      active: true,
      experimentsCount: 3,
      category: 'Core Chemical Engineering',
      desc: 'Flow meters, Venturi Meter, Orifice Meter, Rotameter calibration, Bernoulli principles, and friction losses.',
      theme: SUBJECT_THEMES.fluid_mechanics
    },
    {
      id: 'instrumentation-process-control',
      name: 'Process Control Lab',
      icon: <Gauge className="w-6 h-6 text-cyan-300" />,
      active: true,
      experimentsCount: 1,
      category: 'Process Control & Systems',
      desc: 'Response of first-order thermal system (Step & Sinusoidal input), time constant determination, AR, phase lag, and PID tuning.',
      theme: SUBJECT_THEMES['instrumentation-process-control']
    },
    {
      id: 'heat_transfer',
      name: 'Heat Transfer',
      icon: <Flame className="w-6 h-6 text-amber-300" />,
      active: true,
      experimentsCount: 1,
      category: 'Thermal Operations',
      desc: 'Free convection over vertical cylinder, overall heat transfer coefficient h, and thermal calculations.',
      theme: SUBJECT_THEMES.heat_transfer
    },
    {
      id: 'mass_transfer',
      name: 'Mass Transfer',
      icon: <ArrowRightLeft className="w-6 h-6 text-teal-300" />,
      active: false,
      category: 'Separation Processes',
      desc: 'Simple distillation, liquid-liquid extraction, packed column absorption, and diffusivity measurements.',
      theme: SUBJECT_THEMES.mass_transfer
    },
    {
      id: 'reaction_eng',
      name: 'Chemical Reaction Engineering',
      icon: <Atom className="w-6 h-6 text-violet-300" />,
      active: true,
      experimentsCount: 1,
      category: 'Kinetics & Reactor Design',
      desc: 'Continuous Stirred Tank Reactor (CSTR) non-ideality, impulse tracer injection, and RTD exit-age E curve.',
      theme: SUBJECT_THEMES.reaction_eng
    },
    {
      id: 'mechanical_ops',
      name: 'Particle Science and Technology',
      icon: <Cog className="w-6 h-6 text-amber-200" />,
      active: false,
      category: 'Solid Processing',
      desc: 'Ball mill size reduction, screen effectiveness, froth flotation, and sedimentation clarifiers.',
      theme: SUBJECT_THEMES.mechanical_ops
    }
  ];

  // Dynamic sorting: active/unlocked modules first, locked modules last
  const sortedSubjects = rawSubjects.slice().sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));

  const filteredSubjects = sortedSubjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = rawSubjects.filter(s => s.active).length;
  const totalCount = rawSubjects.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Hi, {studentName} 👋
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Here's your virtual chemical engineering lab progress & experiment workspace overview.
          </p>
        </div>
        {hasStudentDetails && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-3.5 py-1.5 rounded-xl bg-violet-950/60 text-violet-300 border border-violet-500/30 shadow-sm">
              Field: Chemical Engineering (CH23331 / CH23722)
            </span>
          </div>
        )}
      </div>

      {/* Lab Course Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-bold text-white tracking-tight">
              Lab Course
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {activeCount}/{totalCount} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Select a chemical engineering laboratory discipline to launch experiment modules.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter subjects..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-inner transition-all"
          />
        </div>
      </div>

      {/* Subject Cards Grid with Liquid Dark Glass Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => (
          <ThemedSubjectCard
            key={sub.id}
            subject={sub}
            onSelectSubject={handleSelectSubject}
          />
        ))}
      </div>

    </div>
  );
}
