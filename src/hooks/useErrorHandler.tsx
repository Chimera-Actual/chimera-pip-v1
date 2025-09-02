import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { DatabaseError } from '@/types/common';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: Error | DatabaseError | string,
    context: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    let errorMessage = fallbackMessage;
    let errorDetails: unknown;

    // Parse different error types
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as DatabaseError).message;
      errorDetails = (error as DatabaseError).details;
    }

    // Log the error
    if (logError) {
      logger.error(`Error in ${context}: ${errorMessage}`, errorDetails, context);
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    return {
      message: errorMessage,
      handled: true,
    };
  }, [toast]);

  const handleAsyncError = useCallback((
    asyncOperation: () => Promise<void>,
    context: string,
    options?: ErrorHandlerOptions
  ) => {
    return async () => {
      try {
        await asyncOperation();
      } catch (error) {
        handleError(error as Error, context, options);
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};