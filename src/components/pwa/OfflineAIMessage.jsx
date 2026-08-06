import React from 'react';
import { WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export function OfflineAIMessage({ featureName = "AI Assistant" }) {
  return (
    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
          <WifiOff className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-heading text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>{featureName} Unavailable Offline</span>
          </h4>
          <p className="text-xs text-slate-600 font-sans">
            Internet connection required for live AI text generation.
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-700 font-sans leading-relaxed">
        You're currently offline — all calculations, MATLAB-styled graphs, formula steps, rule-based verification, and PDF report exports continue to work normally. Reconnect to access {featureName}.
      </p>

      <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] font-mono font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Math Engine, Plotting, & PDF Export active offline</span>
      </div>
    </div>
  );
}
