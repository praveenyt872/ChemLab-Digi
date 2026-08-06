import React from 'react';
import { Code2 } from 'lucide-react';

export function ViewCodeButton({ onClick, title = "View Python & MATLAB Reference Code" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm shrink-0"
      title={title}
    >
      <Code2 className="w-4 h-4 text-violet-600" />
      <span>View Code</span>
    </button>
  );
}
