import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
    secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    success: 'bg-finance-100 text-finance-700 dark:bg-finance-900/30 dark:text-finance-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const variantClass = variants[variant] || variants.primary;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
