import React from 'react';

export function FluidBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F7F8FA]">
      {/* Soft gradient glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-violet-200/30 blur-[100px]" />
      <div className="absolute top-[30%] -right-[10%] w-[35vw] h-[35vw] rounded-full bg-blue-200/20 blur-[120px]" />

      {/* Subtle light grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
    </div>
  );
}
