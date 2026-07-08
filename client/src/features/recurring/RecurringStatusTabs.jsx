import React from 'react';
import Badge from '../../components/ui/Badge';

const tabs = [
  { id: 'PENDING_CONFIRMATION', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'DISMISSED', label: 'Dismissed' }
];

const RecurringStatusTabs = ({ activeTab, onChange, counts }) => {
  return (
    <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === tab.id ? '600' : '400',
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
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
