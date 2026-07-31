import React from 'react';
import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', interactive = false, ...props }) {
  const baseStyles = interactive ? 'glass-panel-interactive' : 'glass-panel';
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${baseStyles} rounded-2xl p-6 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
