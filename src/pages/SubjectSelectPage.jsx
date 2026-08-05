import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, Flame, ArrowRightLeft, Atom, Cog, Gauge, Lock, ArrowRight, TrendingUp, CheckCircle2, FileText, Sparkles, Search, Filter } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { useExperimentStore } from '../store/experimentStore';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
      name: 'Instrumentation & Process Control Lab',
      icon: <Gauge className="w-6 h-6 text-violet-600" />,
      active: true,
      experimentsCount: 1,
      category: 'Process Control & Systems',
      desc: 'Response of first-order thermal system (Step & Sinusoidal input), time constant determination, AR, phase lag, and PID tuning.'
    },
    {
      id: 'heat_transfer',
      name: 'Heat Transfer',
      icon: <Flame className="w-6 h-6 text-slate-400" />,
      active: false,
      experimentsCount: 0,
      category: 'Thermal Operations',
      desc: 'Double pipe heat exchanger, shell & tube exchanger, Stefan-Boltzmann radiation, and thermal conductivity.'
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

  // Donut chart 1 data: Subject distribution
  const subjectChartData = [
    { name: 'Fluid Mechanics', value: 3, color: '#8B5CF6' },
    { name: 'Process Control', value: 1, color: '#3B82F6' },
    { name: 'Heat Transfer', value: 0, color: '#E2E8F0' },
    { name: 'Mass Transfer', value: 0, color: '#CBD5E1' }
  ];

  // Donut chart 2 data: Validation status
  const validationChartData = [
    { name: 'Passed', value: 92, color: '#22C55E' },
    { name: 'Flagged', value: 8, color: '#F59E0B' }
  ];

  // Line chart data: Cd performance trend
  const performanceTrend = [
    { trial: 'Trial 1', Cd: 0.956, Qth: 4.75 },
    { trial: 'Trial 2', Cd: 0.962, Qth: 4.22 },
    { trial: 'Trial 3', Cd: 0.948, Qth: 3.51 },
    { trial: 'Trial 4', Cd: 0.968, Qth: 2.89 },
    { trial: 'Trial 5', Cd: 0.954, Qth: 2.11 }
  ];

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

      {/* Row of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Experiments</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <Waves className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-heading">4</span>
            <span className="text-xs font-semibold text-emerald-600 ml-2 flex items-center inline-flex gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Active virtual modules available</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports Generated</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-heading">12</span>
            <span className="text-xs font-semibold text-emerald-600 ml-2 flex items-center inline-flex gap-0.5">
              <TrendingUp className="w-3 h-3" /> +25%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">PDF lab record exports</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Accuracy (Cd)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-heading">0.958</span>
            <span className="text-xs font-semibold text-emerald-600 ml-2 flex items-center inline-flex gap-0.5">
              <TrendingUp className="w-3 h-3" /> +2.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Venturi / Orifice discharge ratio</p>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validation Status</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-heading">92%</span>
            <span className="text-xs font-semibold font-mono text-emerald-600 ml-2">Passed</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">AI physics rules verified</p>
        </GlassCard>
      </div>

      {/* Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart 1: Experiments by Subject */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Experiments by Subject</h3>
            <span className="text-xs font-semibold text-slate-400 font-mono">4 Modules</span>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {subjectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900 font-heading">4</span>
              <span className="text-[10px] text-slate-500 uppercase">Active</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              <span>Fluid Mech (3)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Process Ctrl (1)</span>
            </div>
          </div>
        </GlassCard>

        {/* Donut Chart 2: Validation Status */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Validation Status</h3>
            <span className="text-xs font-semibold text-emerald-600 font-mono">92% Passed</span>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={validationChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {validationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-emerald-600 font-heading">92%</span>
              <span className="text-[10px] text-slate-500 uppercase">Passed</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-mono pt-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Passed (92%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Flagged (8%)</span>
            </div>
          </div>
        </GlassCard>

        {/* Line Chart: Performance Over Time */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Performance Over Time</h3>
            <select className="text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded px-2 py-1">
              <option>Last 7 days</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="trial" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[0.92, 0.98]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip />
                <Line type="monotone" dataKey="Cd" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Subject Lab Modules Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EDEEF1]">
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
