import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Button from './ui/Button';

const ErrorFallback = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We apologize for the inconvenience. An unexpected error has occurred. Our engineering team has been notified.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-4 text-left bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-xs font-mono text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700">
              {error.message}
            </div>
          )}

          <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button onClick={resetError} variant="primary" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="secondary" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
