import React from 'react';
import { FlaskConical } from 'lucide-react';
import recLogo from '../../assets/rec-logo.png';

export function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-[#EDEEF1] bg-white relative z-10 py-8 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <span className="font-heading font-bold text-slate-900">ChemLab AI</span>
            <p className="text-xs text-slate-500 font-sans flex items-center gap-1.5 mt-0.5">
              <img src={recLogo} alt="REC Logo" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span>Rajalakshmi Engineering College</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-slate-600 font-semibold">
          <button onClick={() => onNavigate('subject')} className="hover:text-violet-700 transition-colors cursor-pointer">Dashboard</button>
          <button onClick={() => onNavigate('subject')} className="hover:text-violet-700 transition-colors cursor-pointer">Subjects</button>
          <button onClick={() => onNavigate('experiment')} className="hover:text-violet-700 transition-colors cursor-pointer">Experiments</button>
        </div>

        <div className="text-slate-500 flex items-center gap-2">
          <span>Powered by</span>
          <span className="text-violet-700 font-bold">Google Antigravity AI</span>
        </div>

      </div>
    </footer>
  );
}
