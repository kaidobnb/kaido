import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-slate-800/70 rounded-xl p-8 border border-slate-700/50 backdrop-blur-sm max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-slate-400 mb-6">
            There was an error loading this component. Please try refreshing the page.
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => window.history.back()} 
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Go Back
            </button>
          </div>
          
          {/* Debug information for developers */}
          <div className="mt-8 p-4 bg-slate-900 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Error Details:</h3>
            <pre className="text-xs text-slate-500 overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
