import React from 'react';
import { FlaskConical, Github, Sparkles } from 'lucide-react';

export function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-cyan-500/10 bg-[#05070d]/90 backdrop-blur-md relative z-10 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-heading font-bold text-slate-200">ChemLab AI</span>
            <p className="text-xs text-slate-400 font-mono">REC ChemEngg 2026 Fluid Mechanics Spec</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
          <button onClick={() => onNavigate('landing')} className="hover:text-cyan-300 transition-colors">Home</button>
          <button onClick={() => onNavigate('subject')} className="hover:text-cyan-300 transition-colors">Subjects</button>
          <button onClick={() => onNavigate('experiment')} className="hover:text-cyan-300 transition-colors">Fluid Mechanics</button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Powered by</span>
          <span className="text-cyan-400 font-medium">Google Antigravity & AI</span>
        </div>

      </div>
    </footer>
  );
}
