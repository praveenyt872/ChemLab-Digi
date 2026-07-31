import React from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Sparkles,
  Calculator,
  LineChart,
  Bot,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedBadge } from '../components/common/AnimatedBadge';

export function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: <Calculator className="w-6 h-6 text-cyan-400" />,
      title: 'Automated Lab Calculations',
      desc: 'Enter raw observation readings taken in physical lab sessions and get instant computation of intermediate and final derived values.'
    },
    {
      icon: <LineChart className="w-6 h-6 text-violet-400" />,
      title: 'Instant Recharts Graphs',
      desc: 'Auto-generated calibration curves and coefficient plots with scatter point tooltips and linear regression trendlines.'
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
      title: 'Real-Time AI Validation',
      desc: 'Physics engine continuously checks observations for impossibilities, inverted manometer levels, and out-of-range coefficients.'
    },
    {
      icon: <Bot className="w-6 h-6 text-emerald-400" />,
      title: 'AI Virtual Lab Assistant',
      desc: 'Ask questions about Bernoulli derivations, formula variables, or experimental errors directly grounded in your live lab data.'
    },
    {
      icon: <FileCheck className="w-6 h-6 text-cyan-300" />,
      title: 'Official Report Export',
      desc: 'Compile aim, apparatus, observation grid, graph snapshot, and result into a college record PDF format with 1 click.'
    }
  ];

  const steps = [
    { number: '01', title: 'Select Subject', desc: 'Choose Fluid Mechanics virtual laboratory module.' },
    { number: '02', title: 'Pick Experiment', desc: 'Select Rotameter, Venturi Meter, or Orifice Meter.' },
    { number: '03', title: 'Enter Readings', desc: 'Type physical bench observations into the smart table.' },
    { number: '04', title: 'Get Results & AI Report', desc: 'View live calculations, graphs, and export PDF lab record.' }
  ];

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <AnimatedBadge variant="cyan">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REC ChemEngg 2026 Spec Compliant</span>
          </AnimatedBadge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold max-w-4xl tracking-tight leading-tight"
        >
          Your AI-Powered Virtual{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 glow-cyan">
            Chemical Engineering Lab
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-sans leading-relaxed"
        >
          Eliminate manual calculation errors and lab report friction. Enter your physical bench observations to instantly calculate results, plot calibration curves, and receive real-time AI physics validation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => onNavigate('subject')}
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold text-base hover:brightness-110 shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center gap-3 transition-all cursor-pointer"
          >
            <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Enter Virtual Lab</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="font-heading text-3xl font-bold text-slate-100">
            Engineered for Chemical Engineers
          </h2>
          <p className="text-sm font-mono text-cyan-300/80 max-w-xl mx-auto">
            Dynamic data-driven architecture built around authentic chemical engineering lab manuals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <GlassCard key={idx} interactive className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                {feat.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-100">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {feat.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Interactive How It Works Stepper */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold text-slate-100">
            How ChemLab AI Works
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Four simple steps from bench reading to verified lab report
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((st, idx) => (
            <GlassCard key={idx} className="relative space-y-3">
              <span className="font-mono text-3xl font-bold text-cyan-400/40">
                {st.number}
              </span>
              <h4 className="font-heading font-bold text-base text-slate-100">
                {st.title}
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {st.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

    </div>
  );
}
