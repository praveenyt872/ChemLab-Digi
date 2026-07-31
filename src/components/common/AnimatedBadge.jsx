import React from 'react';

export function AnimatedBadge({ children, variant = 'cyan', className = '' }) {
  const variantStyles = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(0,229,255,0.2)]',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(255,176,32,0.2)]',
    mint: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(61,255,176,0.2)]',
    locked: 'bg-slate-800/40 text-slate-400 border-slate-700/50'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${variantStyles[variant] || variantStyles.cyan} ${className}`}
    >
      {variant !== 'locked' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
