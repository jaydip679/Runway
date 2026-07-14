import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = '', 
  id,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow
          dark:bg-gray-800 dark:text-white
          ${error 
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:text-red-100' 
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600'}
          disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
