import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-finance-50 dark:bg-finance-900/30',
      border: 'border-finance-200 dark:border-finance-800',
      text: 'text-finance-800 dark:text-finance-200',
      icon: <CheckCircle2 className="w-5 h-5 text-finance-500 dark:text-finance-400" />
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
    },
    info: {
      bg: 'bg-brand-50 dark:bg-brand-900/30',
      border: 'border-brand-200 dark:border-brand-800',
      text: 'text-brand-800 dark:text-brand-200',
      icon: <Info className="w-5 h-5 text-brand-500 dark:text-brand-400" />
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${currentStyle.bg} ${currentStyle.border}`}>
      {currentStyle.icon}
      <p className={`text-sm font-medium ${currentStyle.text}`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
