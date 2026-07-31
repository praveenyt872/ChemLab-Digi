import React from 'react';

export function FluidBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
      {/* Background Mesh Gradients */}
      <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" />
      <div className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[140px] animate-pulse" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* SVG Fluid Streamlines */}
      <svg className="absolute w-full h-full stroke-cyan-500/10 fill-none" xmlns="http://www.w3.org/2000/svg">
        <g className="animate-streamline">
          <path d="M-100,200 C300,100 600,400 1200,250 C1800,100 2100,500 2400,300" strokeWidth="1.5" strokeDasharray="6,6" />
          <path d="M-100,400 C400,300 700,600 1300,450 C1900,300 2200,700 2500,500" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M-100,600 C200,500 800,800 1400,650 C2000,500 2300,900 2600,700" strokeWidth="1.5" strokeDasharray="10,10" />
        </g>
      </svg>
    </div>
  );
}
