import React from 'react';
import { motion } from 'framer-motion';

export const SUBJECT_THEMES = {
  fluid_mechanics: {
    motif: 'water',
    accentColor: '#0EA5E9',
    badgeActiveBg: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-50 border-sky-200 text-sky-600',
    cardBorderHover: 'hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10',
    cardBg: 'bg-gradient-to-br from-sky-50/60 via-blue-50/20 to-white',
    animation: 'subtle-wave'
  },
  'instrumentation-process-control': {
    motif: 'signal',
    accentColor: '#6366F1',
    badgeActiveBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    cardBorderHover: 'hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10',
    cardBg: 'bg-gradient-to-br from-indigo-50/60 via-cyan-50/20 to-white',
    animation: 'pulse-circuit'
  },
  heat_transfer: {
    motif: 'heat',
    accentColor: '#F59E0B',
    badgeActiveBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    cardBorderHover: 'hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10',
    cardBg: 'bg-gradient-to-br from-amber-50/60 via-orange-50/20 to-white',
    animation: 'heat-shimmer'
  },
  mass_transfer: {
    motif: 'diffusion',
    accentColor: '#14B8A6',
    badgeActiveBg: 'bg-teal-50 text-teal-700 border-teal-200',
    iconBg: 'bg-teal-50 border-teal-200 text-teal-600',
    cardBorderHover: 'hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10',
    cardBg: 'bg-gradient-to-br from-teal-50/60 via-emerald-50/20 to-white',
    animation: 'diffusion-droplet'
  },
  reaction_eng: {
    motif: 'reaction',
    accentColor: '#8B5CF6',
    badgeActiveBg: 'bg-violet-50 text-violet-700 border-violet-200',
    iconBg: 'bg-violet-50 border-violet-200 text-violet-600',
    cardBorderHover: 'hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10',
    cardBg: 'bg-gradient-to-br from-violet-50/60 via-purple-50/20 to-white',
    animation: 'bubbling'
  },
  mechanical_ops: {
    motif: 'particles',
    accentColor: '#D97706',
    badgeActiveBg: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-stone-100 border-stone-300 text-amber-700',
    cardBorderHover: 'hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10',
    cardBg: 'bg-gradient-to-br from-amber-50/50 via-stone-50/60 to-white',
    animation: 'drifting-particles'
  }
};

export function SubjectCardTheme({ themeConfig, active }) {
  if (!themeConfig) return null;

  const motif = themeConfig.motif;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl select-none z-0">
      {/* 1. Water Motif — Subtle flowing wave SVG & ripples */}
      {motif === 'water' && (
        <>
          <motion.div
            className="absolute -bottom-6 -right-6 w-48 h-48 rounded-full bg-sky-400/10 blur-2xl"
            animate={active ? { scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.svg
            className="absolute bottom-0 left-0 right-0 w-full h-16 text-sky-400/20"
            viewBox="0 0 400 60"
            fill="none"
            preserveAspectRatio="none"
            animate={active ? { x: [-20, 0, -20] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M0,20 C100,40 200,0 300,30 C350,45 380,15 400,25 L400,60 L0,60 Z"
              fill="currentColor"
            />
          </motion.svg>
        </>
      )}

      {/* 2. Heat/Thermal Motif — Warm glow & heat shimmer effect */}
      {motif === 'heat' && (
        <>
          <motion.div
            className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-500/15 to-transparent blur-xl"
            animate={active ? { scale: [1, 1.25, 1], opacity: [0.2, 0.45, 0.2] } : {}}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-2 right-4 w-24 h-24 rounded-full bg-rose-400/10 blur-lg"
            animate={active ? { y: [0, -6, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* 3. Signal/Circuit Motif — Fine circuit-trace linework & pulsing dots */}
      {motif === 'signal' && (
        <>
          <svg className="absolute inset-0 w-full h-full text-indigo-500/15 stroke-current" strokeWidth="1" fill="none">
            <pattern id="circuit-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="1.5" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit-grid)" />
          </svg>
          <motion.div
            className="absolute top-6 right-8 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366F1]"
            animate={active ? { opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-8 right-16 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22D3EE]"
            animate={active ? { opacity: [0.3, 0.9, 0.3], scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}

      {/* 4. Particles/Granular Motif — Scattered dust/grain particles drifting */}
      {motif === 'particles' && (
        <>
          {[
            { top: '20%', left: '75%', size: 'w-2 h-2', delay: 0 },
            { top: '45%', left: '85%', size: 'w-1.5 h-1.5', delay: 0.8 },
            { top: '70%', left: '65%', size: 'w-2.5 h-2.5', delay: 1.5 },
            { top: '30%', left: '90%', size: 'w-1 h-1', delay: 0.3 }
          ].map((pt, i) => (
            <motion.div
              key={i}
              className={`absolute ${pt.size} rounded-full bg-amber-600/25 ${pt.top} ${pt.left}`}
              style={{ top: pt.top, left: pt.left }}
              animate={active ? { y: [0, -12, 0], opacity: [0.2, 0.6, 0.2] } : {}}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: pt.delay }}
            />
          ))}
          <motion.div
            className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-amber-500/10 blur-xl"
          />
        </>
      )}

      {/* 5. Diffusion Motif — Expanding dispersing droplet rings */}
      {motif === 'diffusion' && (
        <>
          <motion.div
            className="absolute top-1/2 right-12 -translate-y-1/2 w-28 h-28 rounded-full border border-teal-500/20 bg-teal-400/5"
            animate={active ? { scale: [0.8, 1.25, 0.8], opacity: [0.3, 0.7, 0.3] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 right-12 -translate-y-1/2 w-16 h-16 rounded-full border border-emerald-500/30 bg-emerald-400/10"
            animate={active ? { scale: [0.9, 1.4, 0.9], opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}

      {/* 6. Reaction Motif — Bubbling flask atmosphere */}
      {motif === 'reaction' && (
        <>
          <motion.div
            className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-violet-500/15 blur-2xl"
            animate={active ? { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] } : {}}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {[
            { left: '78%', bottom: '15%', size: 'w-2 h-2', delay: 0 },
            { left: '86%', bottom: '25%', size: 'w-3 h-3', delay: 0.6 },
            { left: '70%', bottom: '35%', size: 'w-1.5 h-1.5', delay: 1.2 },
            { left: '92%', bottom: '45%', size: 'w-2 h-2', delay: 1.8 }
          ].map((b, i) => (
            <motion.div
              key={i}
              className={`absolute ${b.size} rounded-full bg-violet-400/30 border border-violet-400/40`}
              style={{ left: b.left, bottom: b.bottom }}
              animate={active ? { y: [0, -20, 0], opacity: [0.2, 0.7, 0.2] } : {}}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
            />
          ))}
        </>
      )}
    </div>
  );
}
