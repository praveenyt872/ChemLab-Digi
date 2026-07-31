import React, { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-950/40 z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-300 transition-all duration-150 ease-out shadow-[0_0_10px_#00e5ff]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
