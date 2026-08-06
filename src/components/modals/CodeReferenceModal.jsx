import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Code2, Copy, Check, Terminal, BookOpen } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useExperimentStore } from '../../store/experimentStore';

export function CodeReferenceModal({ isOpen, onClose, referenceCode, experimentTitle }) {
  const [activeTab, setActiveTab] = useState('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !referenceCode) return null;

  const pythonData = referenceCode.python || {
    label: 'Python (NumPy) Reference',
    code: '# Reference calculation code\n'
  };

  const matlabData = referenceCode.matlab || {
    label: 'MATLAB Reference',
    code: '% Reference plotting code\n'
  };

  const currentSnippet = activeTab === 'python' ? pythonData.code : matlabData.code;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-[#EDEEF1] p-6 shadow-2xl text-slate-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDEEF1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Calculation & Plotting Reference Code</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Reference implementation — for learning purposes, not executed live
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar & Copy Button */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 font-mono text-xs">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'python'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python (NumPy / SciPy)</span>
            </button>
            <button
              onClick={() => setActiveTab('matlab')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'matlab'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MATLAB Plot Script</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono font-semibold text-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Syntax Highlighted Code Viewer Container */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 my-2 text-xs">
          <SyntaxHighlighter
            language={activeTab === 'python' ? 'python' : 'matlab'}
            style={vs}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              background: 'transparent',
              fontSize: '12px',
              fontFamily: "'Fira Code', 'Courier New', monospace"
            }}
          >
            {currentSnippet}
          </SyntaxHighlighter>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-[#EDEEF1] flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Formula Fidelity: REC ChemEngg 2026 Lab Manual Specification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
