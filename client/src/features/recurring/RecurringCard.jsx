import React from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/format';
import { CalendarClock, Check, X, Edit2, Trash2 } from 'lucide-react';

const formatNextDate = (isoString) => {
  if (!isoString) return 'Unknown';
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const RecurringCard = ({ item, onConfirm, onDismiss, onEdit, onDelete, isConfirming, isDismissing }) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-1">{item.name}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {item.account?.name || 'Unknown Account'}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xl font-bold tracking-tight ${item.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400' : 'text-gray-900 dark:text-white'}`}>
            {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
            {item.intervalUnit.toLowerCase()}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CalendarClock className="w-4 h-4 text-brand-500" />
          <span>Next: <span className="font-medium text-gray-900 dark:text-white">{formatNextDate(item.nextOccurrenceDate)}</span></span>
        </div>
        {item.status === 'PENDING_CONFIRMATION' && item.confidenceScore && (
          <Badge variant={item.confidenceScore > 0.7 ? 'success' : 'warning'}>
            {Math.round(item.confidenceScore * 100)}% Match
          </Badge>
        )}
      </div>

      <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
        {item.status === 'PENDING_CONFIRMATION' && (
          <>
            <Button variant="primary" className="flex-1" onClick={onConfirm} isLoading={isConfirming}>
              <Check className="w-4 h-4 mr-2" /> Confirm
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onDismiss} isLoading={isDismissing}>
              <X className="w-4 h-4 mr-2" /> Dismiss
            </Button>
          </>
        )}
        {(item.status === 'CONFIRMED' || item.status === 'DISMISSED') && (
          <>
            <Button variant="secondary" className="flex-1" onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="danger" className="flex-1" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default RecurringCard;
