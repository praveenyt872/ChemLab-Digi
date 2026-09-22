import React from 'react';
import { useExperimentStore } from '../../store/experimentStore';

export function Watermark() {
  const isReportModalOpen = useExperimentStore((s) => s.isReportModalOpen);
  if (isReportModalOpen) return null;

  return (
    <div
      id="watermark-zynix"
      data-html2canvas-ignore="true"
      className="no-print hidden-print fixed bottom-6 right-24 z-30 pointer-events-none select-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EDEEF1] text-slate-700 text-xs font-mono shadow-sm"
    >
      <span>Created by <strong className="text-slate-900 font-bold tracking-wide">Team Zynix</strong></span>
    </div>
  );
}
