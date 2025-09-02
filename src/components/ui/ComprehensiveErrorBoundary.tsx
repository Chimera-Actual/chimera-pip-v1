import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Bug, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnRouteChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ComprehensiveErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    this.setState({ errorInfo });
    
    // Log error with context
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    }, 'ErrorBoundary');

    // Call custom error handler
    onError?.(error, errorInfo);

    // Auto-retry after 10 seconds in development
    if (process.env.NODE_ENV === 'development') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset();
      }, 10000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showErrorDetails = false } = this.props;
      const { error, errorInfo, errorId } = this.state;

      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bug className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. We've logged the issue and you can try the following actions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Error ID:</strong> {errorId}
                  <br />
                  <strong>Message:</strong> {error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>

              {showErrorDetails && errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details (for developers)
                  </summary>
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                    <strong>Stack Trace:</strong>
                    {'\n'}
                    {error?.stack}
                    {'\n\n'}
                    <strong>Component Stack:</strong>
                    {'\n'}
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>

              <div className="space-x-2">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reload Page</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}