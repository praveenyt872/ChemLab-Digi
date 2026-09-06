import React, { useMemo } from 'react';
import katex from 'katex';

export function KaTeXRenderer({ math, block = false, className = '' }) {
  const html = useMemo(() => {
    if (!math) return '';
    let sanitized = String(math);

    // If string has double-escaped backslashes (\\frac, \\times, etc.), reduce them to single backslashes
    while (sanitized.includes('\\\\')) {
      sanitized = sanitized.replaceAll('\\\\', '\\');
    }

    try {
      return katex.renderToString(sanitized, {
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
      className={`katex-wrapper inline-block ${block ? 'my-1 text-center w-full overflow-x-auto text-xs sm:text-sm text-slate-900 font-normal' : 'text-xs text-slate-900 font-normal'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
