import React from 'react';
import { Sparkles } from 'lucide-react';

export function Watermark() {
  return (
    <div className="fixed bottom-6 right-24 z-30 pointer-events-none select-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EDEEF1] text-slate-700 text-xs font-mono shadow-sm">
      <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
      <span>Created by <strong className="text-slate-900 font-bold tracking-wide">PRAVEEN R</strong></span>
    </div>
  );
}
