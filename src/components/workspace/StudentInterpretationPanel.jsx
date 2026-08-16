import React from 'react';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { GlassCard } from '../common/GlassCard';

export function StudentInterpretationPanel() {
  const {
    currentExperimentId,
    experimentConfig,
    studentInterpretations,
    setStudentInterpretation
  } = useExperimentStore();

  const expId = currentExperimentId || 'rotameter_calibration';
  const text = studentInterpretations[expId] || '';

  // Calculate word count
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const handleTextChange = (e) => {
    setStudentInterpretation(expId, e.target.value);
  };

  const handleInsertTemplate = () => {
    const title = experimentConfig?.title || 'this experiment';
    const sampleTemplate = `Experimental observations recorded during ${title} divert from theoretical calculations due to inherent physical system losses, fluid viscosity friction along internal pipe walls, and entrance/exit boundary layer turbulence. During trial measurement intervals, minor differential manometer reading parallax and small flow rate fluctuations contributed to variance between empirical readings and ideal mathematical models. Furthermore, ambient room temperature variations, minor fitting head losses, and instrument calibration tolerances account for the numerical deviation observed between bench measurements and theoretical predictions. These real-world physical dynamics explain why experimental results naturally diverge from idealized theoretical formulas.`;

    setStudentInterpretation(expId, sampleTemplate);
  };

  return (
    <GlassCard className="border-l-4 border-l-violet-600 space-y-4">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEEF1] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 leading-tight">
              Discussion of Results & Theoretical Deviations
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Student Interpretation & Engineering Analysis
            </span>
          </div>
        </div>

        {/* Word Count Indicator Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-mono font-bold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
            <span>Word Count: {wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          </span>
        </div>
      </div>

      {/* Analytical Guidance Note */}
      <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 text-xs font-sans text-slate-700 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-violet-800 uppercase tracking-wider block">
            INTERPRETATION GUIDANCE
          </span>
          <button
            onClick={handleInsertTemplate}
            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-700 hover:text-violet-900 underline cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>Load Sample Guide Template</span>
          </button>
        </div>
        <p className="leading-relaxed">
          Provide your engineering analysis discussing why experimental observations divert from theoretical values (e.g. fluid skin friction, heat dissipation to ambient air, non-ideal mixing, pressure tap entrance losses, or instrument calibration tolerances).
        </p>
      </div>

      {/* Main Interpretation Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          value={text}
          onChange={handleTextChange}
          placeholder="Write your student interpretation here... Explain physical reasons for variance between experimental measurements and theoretical values."
          className="w-full p-4 rounded-xl text-xs font-sans leading-relaxed text-slate-900 placeholder-slate-400 bg-white border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner"
        />

        {/* Live Word Count Footer */}
        <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-500">
          <span className="text-slate-600 font-medium">
            Student interpretation will be included in the official report export.
          </span>
          <span className="font-bold text-slate-700">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
