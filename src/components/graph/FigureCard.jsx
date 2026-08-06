import React, { useState } from 'react';
import { LineChart, Download } from 'lucide-react';
import { ViewCodeButton } from './ViewCodeButton';
import { CodeReferenceModal } from '../modals/CodeReferenceModal';

export function FigureCard({
  title = "MATLAB Figure Window",
  subtitle = "Scientific Dual-Series Dual-Plot Figure",
  referenceCode,
  onExportPng,
  isExportDisabled = false,
  children
}) {
  const [isCodeModalOpen, setCodeModalOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[#EDEEF1] bg-white p-5 shadow-md space-y-4 relative overflow-hidden">
      {/* Figure Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDEEF1]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {referenceCode && (
            <ViewCodeButton onClick={() => setCodeModalOpen(true)} />
          )}

          {onExportPng && (
            <button
              onClick={onExportPng}
              disabled={isExportDisabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm"
              title="Export Plot as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
          )}
        </div>
      </div>

      {/* Plot Window Content */}
      <div className="w-full">
        {children}
      </div>

      {/* Code Reference Modal */}
      {referenceCode && (
        <CodeReferenceModal
          isOpen={isCodeModalOpen}
          onClose={() => setCodeModalOpen(false)}
          referenceCode={referenceCode}
          experimentTitle={title}
        />
      )}
    </div>
  );
}
