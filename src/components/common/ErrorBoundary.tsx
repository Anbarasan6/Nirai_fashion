import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'full' | 'section' | 'admin';
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorRef: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorRef: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorRef = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { hasError: true, error, errorRef };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || this.props.level || 'root'}] Caught error:`, error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorRef: '' });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'full' } = this.props;

      // Admin Area Crash Fallback (ensures admin issue doesn't blank storefront)
      if (level === 'admin') {
        return (
          <div className="p-8 my-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Admin Module Crash Intercepted
              </h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                An unexpected error occurred in this management panel. The customer storefront remains completely unaffected.
              </p>
              <p className="text-[11px] font-mono text-stone-400 mt-2">
                Reference ID: <span className="font-bold text-stone-700">{this.state.errorRef}</span>
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-amber-900 text-white rounded-lg text-xs font-semibold hover:bg-amber-800 transition cursor-pointer"
              >
                Retry Module
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        );
      }

      // Section Level Fallback
      if (level === 'section') {
        return (
          <div className="p-6 my-4 bg-amber-50/40 border border-amber-200 rounded-xl text-center space-y-3">
            <div className="w-9 h-9 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-serif font-bold text-slate-900">
                Section Temporarily Unavailable · தற்காலிக கோளாறு
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                We could not load this section. Your cart and orders are completely safe.
              </p>
              <span className="text-[10px] font-mono text-stone-400 block mt-1">
                Ref: {this.state.errorRef}
              </span>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2D1619] text-amber-100 rounded-lg text-xs font-semibold hover:bg-[#431B21] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              மீண்டும் முயற்சி செய்க (Retry)
            </button>
          </div>
        );
      }

      // Full Page Bilingual Fallback
      return (
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E8E2D5] shadow-xl p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-2xs">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C2D38] block">
                Nirai Handlooms System Recovery · நிறை மீட்பு
              </span>
              <h1 className="font-serif text-2xl font-bold text-slate-900">
                Experiencing a Temporary Glitch
              </h1>
              <p className="text-xs font-medium text-amber-950">
                மன்னிக்கவும், எதிர்பாராத தொழில்நுட்பக் கோளாறு ஏற்பட்டுள்ளது.
              </p>
              <p className="text-xs text-stone-500 leading-relaxed pt-1">
                We encountered an unexpected error while preparing this page. Your shopping bag, wishlist, and payments are safely preserved.
              </p>
              <div className="p-2 bg-stone-50 rounded border border-stone-200 text-[11px] font-mono text-stone-500 mt-2">
                Reference ID: <span className="font-bold text-stone-800">{this.state.errorRef}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#2D1619] hover:bg-[#431B21] text-amber-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page (மீண்டும் ஏற்றுக)</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-4 border border-stone-300 hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home (முகப்பு)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
