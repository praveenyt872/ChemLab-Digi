import React from 'react';
import { Sparkles } from 'lucide-react';

export function Watermark() {
  return (
    <div className="fixed bottom-6 right-24 z-30 pointer-events-none select-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(0,229,255,0.2)] bg-slate-950/80 backdrop-blur-md">
      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
      <span>Created by <strong className="text-white font-bold tracking-wide glow-cyan">PRAVEEN R</strong></span>
    </div>
  );
}
