import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'widget' | 'tab' | 'app';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ComprehensiveErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.handleReset}
            level={this.props.level || 'widget'}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.handleReset}
          level={this.props.level || 'widget'}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, level }) => {
  const isWidgetLevel = level === 'widget';
  
  return (
    <div className={`${isWidgetLevel ? 'p-4' : 'p-8'} flex flex-col items-center justify-center text-center space-y-4 bg-card border border-destructive/20 rounded-lg`}>
      <AlertCircle className={`${isWidgetLevel ? 'w-8 h-8' : 'w-12 h-12'} text-destructive`} />
      
      <div className="space-y-2">
        <h3 className={`${isWidgetLevel ? 'text-sm' : 'text-lg'} font-mono font-semibold text-destructive`}>
          {isWidgetLevel ? 'Widget Error' : 'Application Error'}
        </h3>
        <p className={`${isWidgetLevel ? 'text-xs' : 'text-sm'} text-muted-foreground font-mono max-w-md`}>
          {isWidgetLevel 
            ? 'This widget encountered an error and cannot be displayed.'
            : 'Something went wrong. The application encountered an unexpected error.'}
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="w-full max-w-md">
          <summary className="text-xs font-mono cursor-pointer text-muted-foreground hover:text-foreground">
            Show Error Details
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded text-left overflow-auto max-h-40">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-2">
        <Button
          onClick={resetError}
          size="sm"
          variant="outline"
          className="font-mono"
        >
          <RefreshCcw className="w-3 h-3 mr-1" />
          Retry
        </Button>
        
        {!isWidgetLevel && (
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="default"
            className="font-mono"
          >
            <Home className="w-3 h-3 mr-1" />
            Reload App
          </Button>
        )}
      </div>
    </div>
  );
};

// Widget-specific error boundary
export const WidgetErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComprehensiveErrorBoundary level="widget">
    {children}
  </ComprehensiveErrorBoundary>
);

// Tab-specific error boundary  
export const TabErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComprehensiveErrorBoundary level="tab">
    {children}
  </ComprehensiveErrorBoundary>
);

// App-level error boundary
export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ComprehensiveErrorBoundary 
    level="app"
    onError={(error, errorInfo) => {
      // Send to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        console.error('App Error:', error, errorInfo);
        // TODO: Send to error tracking service
      }
    }}
  >
    {children}
  </ComprehensiveErrorBoundary>
);