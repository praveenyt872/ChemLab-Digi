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
      title: 'Welcome to Chem Digi Lab',
      icon: <FlaskConical className="w-8 h-8 text-violet-600" />,
      desc: 'Chem Digi Lab is a virtual laboratory platform designed for Chemical Engineering students. It automates calculations, builds calibration curves, and validates physics readings in real-time.'
    },
    {
      title: 'Enter Observations & Live Calculations',
      icon: <Calculator className="w-8 h-8 text-violet-600" />,
      desc: 'Simply enter your physical lab readings into the Observation Table. Derived values and step-by-step calculations are instantly computed using authentic lab formulas.'
    },
    {
      title: 'AI Validation & Export Lab Record',
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      desc: 'Our AI engine continuously checks your readings for physical impossibilities and out-of-range errors. Once complete, click "Export Report" to generate a college lab record PDF!'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl relative text-slate-900"
      >
        <button
          onClick={() => setOnboardingOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 my-6">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto">
            {slides[slide].icon}
          </div>
          <h3 className="font-heading text-xl font-bold text-slate-900">
            {slides[slide].title}
          </h3>
          <p className="text-xs text-slate-600 font-sans leading-relaxed">
            {slides[slide].desc}
          </p>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                slide === idx ? 'w-8 bg-violet-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EDEEF1]">
          <button
            onClick={() => setSlide(Math.max(0, slide - 1))}
            disabled={slide === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(slide + 1)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setOnboardingOpen(false)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 flex items-center gap-1 cursor-pointer shadow-sm"
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
