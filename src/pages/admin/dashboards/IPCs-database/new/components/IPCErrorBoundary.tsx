import React, { Component, ReactNode } from "react";
import { Icon } from "@iconify/react";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import refreshIcon from "@iconify/icons-lucide/refresh-cw";

interface IPCErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface IPCErrorBoundaryProps {
  children: ReactNode;
  stepName?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
}

export class IPCErrorBoundary extends Component<IPCErrorBoundaryProps, IPCErrorBoundaryState> {
  constructor(props: IPCErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): IPCErrorBoundaryState {
    // Update state to show fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("IPC Wizard Error:", error);
    console.error("Error Info:", errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="p-4 bg-error/10 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Icon icon={alertTriangleIcon} className="w-8 h-8 text-error" />
            </div>
            
            <h3 className="text-xl font-semibold text-base-content mb-2">
              {this.props.stepName ? `${this.props.stepName} Error` : "Something went wrong"}
            </h3>
            
            <p className="text-base-content/70 mb-6">
              An error occurred while loading this step of the IPC wizard. Please try refreshing or contact support if the issue persists.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={this.handleRetry}
                className="btn btn-primary btn-sm gap-2"
              >
                <Icon icon={refreshIcon} className="w-4 h-4" />
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-outline btn-sm"
              >
                Refresh Page
              </button>
            </div>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-base-200 rounded-lg text-left">
                <summary className="cursor-pointer text-sm font-medium text-base-content/70 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-xs font-mono text-base-content/60 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export const useIPCErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (error) {
      console.error("IPC Hook Error:", error);
    }
  }, [error]);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  return {
    error,
    resetError,
    handleError,
    hasError: !!error
  };
};

export default IPCErrorBoundary;