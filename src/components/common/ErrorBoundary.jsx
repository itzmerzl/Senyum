import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false, showDetails: false });
  };

  handleHardReload = () => {
    window.location.reload();
  };

  handleCopy = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.toString()}
Stack Trace: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Location: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200 relative">
          {/* Theme Toggle at top right */}
          <div className="absolute top-4 right-4 z-20">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-10 relative overflow-hidden fade-in">
            {/* Top decorative glassmorphism background glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mb-6 border border-red-200 dark:border-red-900/50 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ups! Terjadi Kesalahan Sistem
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                Aplikasi Koperasi Sekolah Senyum mengalami kendala saat memuat halaman ini. Jangan khawatir, data Anda tetap aman.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Coba Lagi
                </button>
                <button
                  onClick={this.handleHardReload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Segarkan Halaman
                </button>
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-250 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  Ke Dashboard
                </a>
              </div>

              {/* Technical Details Toggle */}
              <div className="w-full text-left">
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <span>Detail Teknis / Laporan Error</span>
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-750 rounded-xl fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Error Logs
                      </span>
                      <button
                        onClick={this.handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-md border border-gray-250 dark:border-gray-700 shadow-sm transition-all"
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-500">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Log</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-red-650 dark:text-red-400 overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed p-2 bg-red-50/50 dark:bg-red-950/10 rounded-lg">
                      {this.state.error?.toString()}
                      {"\n\nComponent Stack:\n"}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
