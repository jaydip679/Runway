import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const fetchPending = async () => {
  const { data } = await axios.get('/api/v1/recurring/occurrences/pending', { withCredentials: true });
  return data.data;
};

const resolveOccurrence = async ({ id, action }) => {
  const { data } = await axios.post(`/api/v1/recurring/occurrences/${id}/resolve`, { action }, { withCredentials: true });
  return data.data;
};

const PendingConfirmationsWidget = () => {
  const queryClient = useQueryClient();

  const { data: pendingOccurrences = [], isLoading } = useQuery({
    queryKey: ['pendingOccurrences'],
    queryFn: fetchPending
  });

  const resolveMutation = useMutation({
    mutationFn: resolveOccurrence,
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingOccurrences']);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['forecast']);
    }
  });

  if (isLoading) return null;
  if (pendingOccurrences.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-500/30 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-amber-900 dark:text-amber-300">Action Required: Due Transactions</h3>
        <span className="ml-auto bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">
          {pendingOccurrences.length}
        </span>
      </div>
      
      <div className="divide-y divide-amber-200/50 dark:divide-amber-500/20 max-h-80 overflow-y-auto">
        {pendingOccurrences.map(occurrence => (
          <div key={occurrence.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                {occurrence.commitment.name}
              </p>
              <div className="flex flex-wrap gap-2 items-center mt-1 text-sm text-amber-700 dark:text-amber-400/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 
                  Due: {new Date(occurrence.expectedDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className={occurrence.commitment.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400 font-medium' : 'font-medium'}>
                  {occurrence.commitment.type === 'INCOME' ? '+' : '-'}${Number(occurrence.amount).toFixed(2)}
                </span>
                <span>•</span>
                <span>{occurrence.commitment.account?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => resolveMutation.mutate({ id: occurrence.id, action: 'COMPLETE' })}
                disabled={resolveMutation.isPending}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Paid
              </button>
              <button 
                onClick={() => resolveMutation.mutate({ id: occurrence.id, action: 'SKIP' })}
                disabled={resolveMutation.isPending}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Skip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingConfirmationsWidget;
