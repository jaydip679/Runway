import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const fetchPending = async () => {
  const { data } = await apiClient.get('/recurring/occurrences/pending', { withCredentials: true });
  return data.data;
};

const resolveOccurrence = async ({ id, action }) => {
  const { data } = await apiClient.post(`/recurring/occurrences/${id}/resolve`, { action }, { withCredentials: true });
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
    <div className="bg-white dark:bg-gray-900 border-2 border-brand-200 dark:border-brand-800/50 rounded-2xl overflow-hidden shadow-sm relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
      
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-brand-50/50 dark:bg-brand-900/10">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Action Required</h3>
        </div>
        <span className="bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
          {pendingOccurrences.length} Due
        </span>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
        {pendingOccurrences.map(occurrence => (
          <div key={occurrence.id} className="p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {occurrence.commitment.name}
              </p>
              <div className="flex flex-wrap gap-2 items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" /> 
                  Due: {new Date(occurrence.expectedDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className={occurrence.commitment.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400 font-bold' : 'font-bold text-gray-900 dark:text-gray-300'}>
                  {occurrence.commitment.type === 'INCOME' ? '+' : '-'}${Number(occurrence.amount).toFixed(2)}
                </span>
                <span>•</span>
                <span>{occurrence.commitment.account?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto">
              <button 
                onClick={() => resolveMutation.mutate({ id: occurrence.id, action: 'COMPLETE' })}
                disabled={resolveMutation.isPending}
                className="flex-1 xl:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Paid
              </button>
              <button 
                onClick={() => resolveMutation.mutate({ id: occurrence.id, action: 'SKIP' })}
                disabled={resolveMutation.isPending}
                className="flex-1 xl:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
