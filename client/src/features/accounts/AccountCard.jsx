import React from 'react';

const AccountCard = ({ account, onEdit, onDelete }) => {
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="account-card" style={{
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: 'var(--bg-card)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{account.name}</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {account.type.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onEdit(account)} style={{
            background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem'
          }}>Edit</button>
          <button onClick={() => onDelete(account)} style={{
            background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem'
          }}>Delete</button>
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Balance</div>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: account.currentBalance < 0 ? 'var(--error)' : 'var(--success)' 
        }}>
          {formatCurrency(account.currentBalance, account.currency)}
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
