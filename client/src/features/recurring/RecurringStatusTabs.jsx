import React from 'react';
import Badge from '../../components/ui/Badge';

const tabs = [
  { id: 'PENDING_CONFIRMATION', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'DISMISSED', label: 'Dismissed' }
];

const RecurringStatusTabs = ({ activeTab, onChange, counts }) => {
  return (
    <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-3 overflow-x-auto no-scrollbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-semibold' 
              : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          {tab.label}
          <Badge variant={activeTab === tab.id ? 'primary' : 'secondary'}>
            {counts[tab.id] || 0}
          </Badge>
        </button>
      ))}
    </div>
  );
};

export default RecurringStatusTabs;
