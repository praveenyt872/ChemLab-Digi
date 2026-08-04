import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LabFlow-AI Component Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto my-12 p-8 rounded-2xl glass-panel border border-red-500/40 bg-slate-950/90 text-slate-100 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-xl font-bold font-heading">Workspace Application Error</h2>
              <p className="text-xs font-mono text-slate-400">
                An uncaught calculation or rendering error occurred in the workspace component.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-red-500/20 font-mono text-xs text-red-300 space-y-2 overflow-x-auto">
            <p className="font-bold">{this.state.error?.toString()}</p>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Recovering Workspace</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono hover:bg-slate-700 transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
