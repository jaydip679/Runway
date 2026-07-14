import React from 'react';
import { formatCurrency } from '../../utils/format';
import { Edit2, Trash2 } from 'lucide-react';

const AccountCard = ({ account, onEdit, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="m-0 text-lg font-semibold text-gray-900 dark:text-white">{account.name}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {account.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.preventDefault(); onEdit(account); }} 
            className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 p-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); onDelete(account); }} 
            className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Balance</div>
        <div className={`text-2xl font-bold ${account.currentBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-finance-600 dark:text-finance-400'}`}>
          {formatCurrency(account.currentBalance, account.currency)}
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
