import React from 'react';
import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', interactive = false, ...props }) {
  const baseStyles = interactive
    ? 'bg-white border border-[#EDEEF1] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
    : 'bg-white border border-[#EDEEF1] shadow-sm';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`${baseStyles} rounded-2xl p-6 text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
