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

export function LandingPage({ onNavigate }) {
  const features = [
    {
      icon: <Calculator className="w-6 h-6 text-violet-600" />,
      title: 'Automated Lab Calculations',
      desc: 'Enter raw observation readings taken in physical lab sessions and get instant computation of intermediate and final derived values.'
    },
    {
      icon: <LineChart className="w-6 h-6 text-violet-600" />,
      title: 'Instant Recharts Graphs',
      desc: 'Auto-generated calibration curves and coefficient plots with scatter point tooltips and linear regression trendlines.'
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-amber-500" />,
      title: 'Real-Time AI Validation',
      desc: 'Physics engine continuously checks observations for impossibilities, inverted manometer levels, and out-of-range coefficients.'
    },
    {
      icon: <Bot className="w-6 h-6 text-emerald-600" />,
      title: 'Grounded AI Virtual Assistant',
      desc: 'Ask formulas, derivations, viva questions, and physical parameter error troubleshooting.'
    },
    {
      icon: <FileCheck className="w-6 h-6 text-blue-600" />,
      title: 'Official Lab Report Export',
      desc: 'Generate complete formatted PDF records with calculations, tables, and graphs in 1-click.'
    }
  ];

  const steps = [
    { number: '01', title: 'Select Subject', desc: 'Choose Fluid Mechanics or Process Control virtual laboratory module.' },
    { number: '02', title: 'Pick Experiment', desc: 'Select Rotameter, Venturi Meter, Orifice Meter, or First-Order Response.' },
    { number: '03', title: 'Enter Readings', desc: 'Type physical bench observations into the smart observation grid.' },
    { number: '04', title: 'Get Results & Export', desc: 'View step-by-step calculations, graphs, and export official PDF lab record.' }
  ];

  return (
    <div className="space-y-20 py-8 text-slate-900">
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-slate-900 border border-[#EDEEF1] text-xs font-mono font-bold tracking-tight shadow-md hover:border-violet-300 transition-all">
            <img src={recLogo} alt="Rajalakshmi Engineering College Logo" className="w-6 h-6 object-contain shrink-0" />
            <span className="text-slate-900 font-extrabold text-sm">Rajalakshmi Engineering College</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold max-w-4xl tracking-tight leading-tight text-slate-900"
        >
          Your AI-Powered Virtual{' '}
          <span className="text-violet-600">
            Chemical Engineering Lab
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl font-sans leading-relaxed"
        >
          Eliminate manual calculation errors and lab report friction. Enter physical bench observations to calculate results, plot calibration curves, and receive real-time AI physics validation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => onNavigate('subject')}
            className="group px-8 py-4 rounded-xl bg-violet-600 text-white font-bold text-base hover:bg-violet-700 shadow-md flex items-center gap-3 transition-all cursor-pointer"
          >
            <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Enter Virtual Lab Dashboard</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold text-slate-900">
            Engineered for Chemical Engineers
          </h2>
          <p className="text-sm font-sans text-slate-500 max-w-xl mx-auto">
            Dynamic data-driven architecture built around authentic chemical engineering lab manuals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <GlassCard key={idx} interactive className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {feat.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Interactive How It Works Stepper */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-3xl font-bold text-slate-900">
            How ChemLab AI Works
          </h2>
          <p className="text-xs font-mono text-slate-500">
            Four simple steps from bench reading to verified lab report
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <GlassCard key={idx} className="space-y-3">
              <span className="font-mono text-3xl font-bold text-violet-400/60">
                {st.number}
              </span>
              <h4 className="font-heading font-bold text-base text-slate-900">
                {st.title}
              </h4>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                {st.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

    </div>
  );
}
