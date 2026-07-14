import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const CategoryItem = ({ category, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl border border-gray-200 dark:border-gray-700">
          {category.icon || '📁'}
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white mb-0.5">{category.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className={`font-medium ${category.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400' : 'text-red-600 dark:text-red-400'}`}>
              {category.type}
            </span>
            {category.isSystem && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span className="text-brand-600 dark:text-brand-400 font-medium">System</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {!category.isSystem && (
        <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(category)} 
            className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(category)} 
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryItem;
