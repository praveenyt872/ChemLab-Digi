import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

export const SUBJECT_THEMES = {
  fluid_mechanics: {
    motif: 'water',
    accentColor: '#0EA5E9', // Sky Cyan
    badgeActiveBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    iconBg: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
    cardBorderHover: 'hover:border-cyan-400/50 hover:shadow-[0_12px_36px_rgba(14,165,233,0.25)]',
    cardBgGradient: 'from-[#04222E] via-[#083344]/80 to-[#0F172A]',
    glowColor: 'rgba(14, 165, 233, 0.25)'
  },
  'instrumentation-process-control': {
    motif: 'signal',
    accentColor: '#22D3EE', // Electric Cyan / Indigo
    badgeActiveBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    iconBg: 'bg-indigo-950/60 border-cyan-500/30 text-cyan-300',
    cardBorderHover: 'hover:border-cyan-400/50 hover:shadow-[0_12px_36px_rgba(34,211,238,0.25)]',
    cardBgGradient: 'from-[#0A0E1A] via-[#1E1B4B]/80 to-[#0F172A]',
    glowColor: 'rgba(34, 211, 238, 0.25)'
  },
  heat_transfer: {
    motif: 'heat',
    accentColor: '#F59E0B', // Amber / Flame Red
    badgeActiveBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-950/60 border-amber-500/30 text-amber-300',
    cardBorderHover: 'hover:border-amber-400/50 hover:shadow-[0_12px_36px_rgba(245,158,11,0.25)]',
    cardBgGradient: 'from-[#1A0F0A] via-[#451A03]/80 to-[#0F172A]',
    glowColor: 'rgba(245, 158, 11, 0.25)'
  },
  mass_transfer: {
    motif: 'diffusion',
    accentColor: '#14B8A6', // Teal / Purple
    badgeActiveBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    iconBg: 'bg-teal-950/60 border-teal-500/30 text-teal-300',
    cardBorderHover: 'hover:border-teal-400/50 hover:shadow-[0_12px_36px_rgba(20,184,166,0.25)]',
    cardBgGradient: 'from-[#0F2E2E] via-[#134E4A]/80 to-[#0F172A]',
    glowColor: 'rgba(20, 184, 166, 0.25)'
  },
  reaction_eng: {
    motif: 'reaction',
    accentColor: '#8B5CF6', // Violet / Magenta
    badgeActiveBg: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    iconBg: 'bg-violet-950/60 border-violet-500/30 text-violet-300',
    cardBorderHover: 'hover:border-violet-400/50 hover:shadow-[0_12px_36px_rgba(139,92,246,0.25)]',
    cardBgGradient: 'from-[#1A0F2E] via-[#3B0764]/80 to-[#0F172A]',
    glowColor: 'rgba(139, 92, 246, 0.25)'
  },
  mechanical_ops: {
    motif: 'particles',
    accentColor: '#B08968', // Sand / Clay
    badgeActiveBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconBg: 'bg-stone-900/80 border-amber-600/30 text-amber-300',
    cardBorderHover: 'hover:border-amber-500/50 hover:shadow-[0_12px_36px_rgba(176,137,104,0.25)]',
    cardBgGradient: 'from-[#2A211A] via-[#44382E]/80 to-[#0F172A]',
    glowColor: 'rgba(176, 137, 104, 0.25)'
  }
};

/* -------------------------------------------------------------------------- */
/* 1. Water Motif — Fluid Mechanics                                         */
/* -------------------------------------------------------------------------- */
function WaterMotif({ active, isHovered, prefersReducedMotion }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background Gradient Glow */}
      <motion.div
        className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"
        animate={active && !prefersReducedMotion ? { scale: isHovered ? 1.3 : [1, 1.2, 1], opacity: isHovered ? 0.4 : 0.25 } : { opacity: 0.15 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Horizontal Waterline Highlight Streak */}
      <motion.div
        className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent shadow-[0_0_8px_#38BDF8]"
        animate={active && !prefersReducedMotion ? { x: [-30, 30, -30], opacity: [0.3, 0.6, 0.3] } : { opacity: 0.3 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Layered Parallax Waves */}
      {!prefersReducedMotion && (
        <>
          <motion.svg
            className="absolute bottom-0 left-0 right-0 w-[140%] h-24 text-cyan-500/20"
            viewBox="0 0 600 90"
            fill="none"
            preserveAspectRatio="none"
            animate={active ? { x: [0, -80, 0] } : {}}
            transition={{ duration: isHovered ? 4 : 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M0,35 C150,60 350,10 600,45 L600,90 L0,90 Z" fill="currentColor" />
          </motion.svg>

          <motion.svg
            className="absolute bottom-0 left-0 right-0 w-[140%] h-16 text-sky-400/25"
            viewBox="0 0 600 60"
            fill="none"
            preserveAspectRatio="none"
            animate={active ? { x: [-60, 0, -60] } : {}}
            transition={{ duration: isHovered ? 3 : 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M0,20 C200,45 400,0 600,25 L600,60 L0,60 Z" fill="currentColor" />
          </motion.svg>
        </>
      )}

      {/* Hover Droplet Ripple Effect */}
      {isHovered && !prefersReducedMotion && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-cyan-300/40"
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Heat Motif — Heat Transfer                                              */
/* -------------------------------------------------------------------------- */
function HeatMotif({ active, isHovered, prefersReducedMotion }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radiant Heat Bloom */}
      <motion.div
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/30 via-orange-600/20 to-red-600/10 blur-3xl"
        animate={active && !prefersReducedMotion ? { scale: isHovered ? 1.35 : [1, 1.15, 1], opacity: isHovered ? 0.6 : [0.3, 0.5, 0.3] } : { opacity: 0.2 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Vertical Heat Haze Shimmer Bands */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 flex justify-around px-8 opacity-25">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-8 h-full bg-gradient-to-t from-transparent via-amber-500/20 to-transparent blur-md"
              animate={active ? { y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] } : {}}
              transition={{ duration: (isHovered ? 2 : 4) + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            />
          ))}
        </div>
      )}

      {/* Edge Thermometer Scale Bar */}
      <div className="absolute top-4 left-3 bottom-4 w-1 rounded-full bg-gradient-to-b from-red-500 via-amber-500 to-sky-500 opacity-40 shadow-[0_0_8px_#F59E0B]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Signal / Circuit Motif — Process Control                                 */
/* -------------------------------------------------------------------------- */
function CircuitMotif({ active, isHovered, prefersReducedMotion }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* SVG PCB Circuit Trace Grid Background */}
      <svg className="absolute inset-0 w-full h-full text-cyan-400/15 stroke-current" strokeWidth="1" fill="none">
        <pattern id="pcb-circuit-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40 M 0 20 L 20 20 L 20 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <circle cx="0" cy="0" r="2" fill="currentColor" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#pcb-circuit-pattern)" />
      </svg>

      {/* Traveling Signal Pulse Glow */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-8 right-12 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]"
            animate={active ? { opacity: isHovered ? [0.4, 1, 0.4] : [0.2, 0.8, 0.2], scale: isHovered ? [1, 1.4, 1] : [0.8, 1.2, 0.8] } : { opacity: 0.3 }}
            transition={{ duration: isHovered ? 1.2 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 right-20 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818CF8]"
            animate={active ? { opacity: [0.3, 0.9, 0.3], scale: [1, 1.3, 1] } : { opacity: 0.2 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />
        </>
      )}

      {/* Blinking Status LED Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
        <span className="text-[9px] font-mono font-bold text-cyan-300/60 uppercase tracking-widest">LIVE SIGNAL</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Particles / Granular Motif — Particle Science and Tech                  */
/* -------------------------------------------------------------------------- */
function ParticlesMotif({ active, isHovered, prefersReducedMotion }) {
  const particles = [
    { top: '15%', left: '70%', size: 'w-2.5 h-2.5', delay: 0 },
    { top: '35%', left: '85%', size: 'w-1.5 h-1.5', delay: 0.4 },
    { top: '60%', left: '65%', size: 'w-3 h-3', delay: 0.9 },
    { top: '75%', left: '80%', size: 'w-2 h-2', delay: 1.3 },
    { top: '25%', left: '90%', size: 'w-1 h-1', delay: 0.2 },
    { top: '80%', left: '45%', size: 'w-2 h-2', delay: 1.6 }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Warm Ambient Sand Glow */}
      <div className="absolute -bottom-8 -right-8 w-56 h-56 rounded-full bg-amber-600/15 blur-3xl" />

      {/* Floating Granular Specks */}
      {!prefersReducedMotion &&
        particles.map((pt, i) => (
          <motion.div
            key={i}
            className={`absolute ${pt.size} rounded-full bg-amber-400/40 shadow-[0_0_6px_#F59E0B]`}
            style={{ top: pt.top, left: pt.left }}
            animate={active ? { y: isHovered ? [0, -25, 0] : [0, -15, 0], x: isHovered ? [0, 10, 0] : [0, 4, 0], opacity: [0.2, 0.7, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: (isHovered ? 2 : 4) + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: pt.delay }}
          />
        ))}

      {/* Specular Light Glint */}
      {isHovered && !prefersReducedMotion && (
        <motion.div
          className="absolute top-12 right-24 w-1 h-1 rounded-full bg-white shadow-[0_0_12px_#FFFFFF]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Diffusion Motif — Mass Transfer                                         */
/* -------------------------------------------------------------------------- */
function DiffusionMotif({ active, isHovered, prefersReducedMotion }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Expanding Concentric Droplets */}
      <motion.div
        className="absolute top-1/2 right-12 -translate-y-1/2 w-36 h-36 rounded-full border border-teal-400/30 bg-teal-500/10 blur-md"
        animate={active && !prefersReducedMotion ? { scale: isHovered ? [0.9, 1.4, 0.9] : [0.8, 1.2, 0.8], opacity: [0.3, 0.7, 0.3] } : { opacity: 0.2 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 right-12 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-400/40 bg-emerald-500/15 blur-sm"
        animate={active && !prefersReducedMotion ? { scale: isHovered ? [1, 1.5, 1] : [0.9, 1.3, 0.9], opacity: [0.4, 0.8, 0.4] } : { opacity: 0.3 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Reaction Motif — Chemical Reaction Engineering                          */
/* -------------------------------------------------------------------------- */
function ReactionMotif({ active, isHovered, prefersReducedMotion }) {
  const bubbles = [
    { left: '75%', bottom: '10%', size: 'w-2.5 h-2.5', delay: 0 },
    { left: '85%', bottom: '20%', size: 'w-3.5 h-3.5', delay: 0.5 },
    { left: '68%', bottom: '30%', size: 'w-2 h-2', delay: 1.1 },
    { left: '90%', bottom: '40%', size: 'w-3 h-3', delay: 1.6 },
    { left: '80%', bottom: '55%', size: 'w-2 h-2', delay: 0.8 }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Violet Ambient Glow */}
      <div className="absolute -bottom-8 -right-8 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl" />

      {/* Floating Bubbles */}
      {!prefersReducedMotion &&
        bubbles.map((b, i) => (
          <motion.div
            key={i}
            className={`absolute ${b.size} rounded-full bg-violet-400/40 border border-violet-300/50 shadow-[0_0_8px_#C084FC]`}
            style={{ left: b.left, bottom: b.bottom }}
            animate={active ? { y: isHovered ? [0, -35, 0] : [0, -20, 0], opacity: [0.2, 0.8, 0.2] } : { opacity: 0.2 }}
            transition={{ duration: (isHovered ? 2 : 3.5) + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
          />
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN SUBJECT CARD THEME WRAPPER                                            */
/* -------------------------------------------------------------------------- */
export function SubjectCardTheme({ themeConfig, active, isHovered }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!themeConfig) return null;

  const motif = themeConfig.motif;

  // Pause offscreen animations via IntersectionObserver / useInView
  const shouldAnimate = active && isInView;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl select-none z-0">
      {motif === 'water' && <WaterMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
      {motif === 'heat' && <HeatMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
      {motif === 'signal' && <CircuitMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
      {motif === 'particles' && <ParticlesMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
      {motif === 'diffusion' && <DiffusionMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
      {motif === 'reaction' && <ReactionMotif active={shouldAnimate} isHovered={isHovered} prefersReducedMotion={prefersReducedMotion} />}
    </div>
  );
}
