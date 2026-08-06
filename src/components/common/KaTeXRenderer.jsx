import React, { useMemo } from 'react';
import katex from 'katex';

export function KaTeXRenderer({ math, block = false, className = '' }) {
  const html = useMemo(() => {
    if (!math) return '';
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'html'
      });
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`inline-block text-slate-900 print:text-black ${block ? 'my-1 text-center w-full overflow-x-auto text-xs sm:text-sm font-normal' : 'text-xs'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
