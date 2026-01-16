import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error reporting service in production
    if (import.meta.env.PROD) {
      // Add your error reporting service here (e.g., Sentry)
      // reportErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    
    // Reload the page to clear any state issues
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stc-navy rounded-lg p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-stc-danger mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">حدث خطأ</h1>
            <p className="text-white/70 mb-4">
              عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-stc-bg-dark rounded text-sm text-left overflow-auto max-h-40">
                <p className="text-stc-danger font-mono text-xs break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-white/50 mt-2 whitespace-pre-wrap break-all">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-stc-gold text-stc-navy rounded hover:bg-stc-gold-light transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 bg-stc-navy-light text-white rounded hover:bg-stc-navy transition-colors font-medium border border-white/10"
              >
                <Home className="w-4 h-4" />
                الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
