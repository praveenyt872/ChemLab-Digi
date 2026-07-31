import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, FlaskConical, Calculator, Sparkles, Check } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';

export function OnboardingModal() {
  const { isOnboardingOpen, setOnboardingOpen } = useExperimentStore();
  const [slide, setSlide] = useState(0);

  if (!isOnboardingOpen) return null;

  const slides = [
    {
      title: 'Welcome to ChemLab AI',
      icon: <FlaskConical className="w-10 h-10 text-cyan-400" />,
      desc: 'ChemLab AI is a virtual laboratory platform designed for Chemical Engineering students. It automates calculations, builds calibration curves, and validates physics readings in real-time.'
    },
    {
      title: 'Enter Observations & Live Calculations',
      icon: <Calculator className="w-10 h-10 text-violet-400" />,
      desc: 'Simply enter your physical lab readings into the Observation Table. Derived values (h, H, Qa, Qth, Cd) are instantly computed using authentic lab formulas.'
    },
    {
      title: 'AI Validation & Export Lab Record',
      icon: <Sparkles className="w-10 h-10 text-amber-400" />,
      desc: 'Our AI engine continuously checks your readings for physical impossibilities and out-of-range errors. Once complete, click "Export Report" to generate a college lab record PDF!'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md rounded-2xl glass-panel border border-cyan-500/30 p-6 shadow-2xl relative bg-slate-950/90 text-slate-100"
      >
        <button
          onClick={() => setOnboardingOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 my-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            {slides[slide].icon}
          </div>
          <h3 className="font-heading text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300">
            {slides[slide].title}
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {slides[slide].desc}
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                slide === idx ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#00e5ff]' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setSlide(Math.max(0, slide - 1))}
            disabled={slide === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 disabled:opacity-30 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(slide + 1)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setOnboardingOpen(false)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 font-bold text-xs hover:brightness-110 flex items-center gap-1 cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.4)]"
            >
              <Check className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
