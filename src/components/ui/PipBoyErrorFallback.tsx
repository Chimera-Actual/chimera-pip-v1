// Pip-Boy Themed Error Boundary Fallback
import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PipBoyErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const PipBoyErrorFallback: React.FC<PipBoyErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className={cn(
      "h-full flex items-center justify-center p-8",
      "bg-card/50 border-2 border-destructive/50 rounded-lg",
      "pip-boy-scanlines relative overflow-hidden"
    )}>
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 mx-auto text-destructive animate-pulse" />
        </div>

        {/* Error Message */}
        <div className="mb-6">
          <h2 className="font-mono text-xl font-bold text-destructive mb-2">
            SYSTEM ERROR DETECTED
          </h2>
          <div className="text-sm text-muted-foreground font-mono mb-4">
            A critical error has occurred in this component
          </div>
          
          {/* Error Details */}
          <div className="bg-background/50 border border-border/50 rounded p-3 mb-4">
            <div className="text-xs font-mono text-left">
              <div className="text-destructive font-semibold mb-1">
                ERROR: {error.name}
              </div>
              <div className="text-foreground break-words">
                {error.message}
              </div>
            </div>
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          <Button 
            onClick={resetErrorBoundary}
            className="w-full font-mono"
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            RESTART COMPONENT
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            className="w-full font-mono"
            variant="secondary"
          >
            FULL SYSTEM RESTART
          </Button>
        </div>

        {/* Debug Info */}
        <div className="mt-6 text-xs text-muted-foreground font-mono">
          <div>TIMESTAMP: {new Date().toISOString()}</div>
          <div>COMPONENT: Widget System</div>
          <div>STATUS: ERROR_RECOVERY_MODE</div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 right-4 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        <div className="absolute bottom-4 left-4 w-1 h-8 bg-destructive/30 animate-pulse" />
      </div>
    </div>
  );
};