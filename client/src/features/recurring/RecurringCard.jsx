import React from 'react';
import Button from '../../components/ui/Button/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/format';

const formatNextDate = (isoString) => {
  if (!isoString) return 'Unknown';
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const RecurringCard = ({ item, onConfirm, onDismiss, onEdit, onDelete, isConfirming, isDismissing }) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem' }}>{item.name}</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {item.account?.name || 'Unknown Account'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: item.type === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}>
            {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {item.intervalUnit.toLowerCase()}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
        <div>Next: <span style={{ fontWeight: '500' }}>{formatNextDate(item.nextOccurrenceDate)}</span></div>
        {item.status === 'PENDING_CONFIRMATION' && item.confidenceScore && (
          <Badge variant={item.confidenceScore > 0.7 ? 'success' : 'warning'}>
            {Math.round(item.confidenceScore * 100)}% Match
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        {item.status === 'PENDING_CONFIRMATION' && (
          <>
            <Button variant="primary" style={{ flex: 1 }} onClick={onConfirm} isLoading={isConfirming}>Confirm</Button>
            <Button variant="secondary" style={{ flex: 1 }} onClick={onDismiss} isLoading={isDismissing}>Dismiss</Button>
          </>
        )}
        {(item.status === 'CONFIRMED' || item.status === 'DISMISSED') && (
          <>
            <Button variant="secondary" style={{ flex: 1 }} onClick={onEdit}>Edit</Button>
            <Button variant="danger" style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white' }} onClick={onDelete}>Delete</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default RecurringCard;
