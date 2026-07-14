import React, { forwardRef } from 'react';

const Select = forwardRef(({ 
  label, 
  options = [], 
  error, 
  helperText, 
  className = '', 
  id,
  ...props 
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm shadow-sm appearance-none
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500' 
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600'}
          disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900
        `}
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        {...props}
      >
        <option value="" disabled hidden>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
