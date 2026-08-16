import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SubjectCardTheme } from './SubjectCardTheme';

export function ThemedSubjectCard({ subject, onSelectSubject }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const theme = subject.theme || {};
  const active = subject.active;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      tabIndex={active ? 0 : -1}
      role="button"
      aria-disabled={!active}
      onClick={() => {
        if (active && onSelectSubject) {
          onSelectSubject(subject.id);
        }
      }}
      onKeyDown={(e) => {
        if (active && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelectSubject(subject.id);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col justify-between h-[270px] rounded-[20px] overflow-hidden transition-all duration-300 transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14] ${
        active
          ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.98]'
          : 'cursor-not-allowed opacity-70 grayscale-[25%]'
      } ${theme.cardBorderHover || 'hover:border-violet-400/50'}`}
      style={{
        focusRingColor: theme.accentColor || '#8B5CF6'
      }}
    >
      {/* 1. Underlying Domain Accent Gradient Backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.cardBgGradient || 'from-slate-900 to-slate-950'} z-0`} />

      {/* 2. Atmospheric Per-Subject Animated Visual Motif */}
      <SubjectCardTheme themeConfig={theme} active={active} isHovered={isHovered} />

      {/* 3. Physical Light Source — Interactive Mouse Spotlight Radial Glow */}
      {isHovered && active && (
        <div
          className="pointer-events-none absolute inset-0 z-15 transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${theme.glowColor || 'rgba(255,255,255,0.12)'}, transparent 80%)`
          }}
        />
      )}

      {/* 4. Frosted Dark Liquid Glass Surface Panel */}
      <div
        className="relative z-10 flex flex-col justify-between h-full p-6 transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: isHovered && active ? '0 16px 40px rgba(0, 0, 0, 0.45)' : '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Card Header: Glyph Icon & Status Badge */}
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-inner ${theme.iconBg || 'bg-slate-900/80 border-slate-700 text-white'}`}>
            {subject.icon}
          </div>

          {active ? (
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${theme.badgeActiveBg || 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Active Lab
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-400 border border-slate-700/80 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-500" />
              Locked
            </span>
          )}
        </div>

        {/* Subject Info: Category, Display Title, Tagline */}
        <div className="mt-4">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest block"
            style={{ color: theme.accentColor || '#8B5CF6' }}
          >
            {subject.category}
          </span>

          <h3 className="font-heading text-xl font-bold text-white tracking-tight mt-1 group-hover:text-white transition-colors">
            {subject.name}
          </h3>

          <p className="text-xs text-slate-300 font-sans leading-relaxed mt-2 line-clamp-2">
            {subject.desc}
          </p>
        </div>

        {/* Card Bottom Status Readout & Action Button */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-medium text-[11px]">
            {active ? `${subject.experimentsCount} Experiments · Active` : 'Module coming soon'}
          </span>

          {active && (
            <span
              className="font-bold flex items-center gap-1.5 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: theme.accentColor || '#8B5CF6' }}
            >
              <span>Enter</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
