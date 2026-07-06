import React from 'react';

const CategoryItem = ({ category, onEdit, onDelete }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--bg-card)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '8px', 
          backgroundColor: 'var(--bg-input)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
        }}>
          {category.icon || '📁'}
        </div>
        <div>
          <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{category.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
            <span style={{ color: category.type === 'INCOME' ? 'var(--success)' : 'var(--error)' }}>
              {category.type}
            </span>
            {category.isSystem && <span style={{ color: 'var(--primary)' }}>• System</span>}
          </div>
        </div>
      </div>
      
      {!category.isSystem && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onEdit(category)} style={{
            background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem'
          }}>Edit</button>
          <button onClick={() => onDelete(category)} style={{
            background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem'
          }}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default CategoryItem;
