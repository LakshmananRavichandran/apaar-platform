import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[APAAR ErrorBoundary] Uncaught component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center text-slate-800 dark:text-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {this.props.fallbackTitle || 'Section Display Interrupted'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              An unexpected render anomaly occurred while rendering this interface. Your data and credentials remain completely secure.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-left border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">Error Trace:</span>
                <code className="text-xs text-red-600 dark:text-red-400 font-mono break-all line-clamp-3">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-[#0A3871] hover:bg-[#082a56] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Interface</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
