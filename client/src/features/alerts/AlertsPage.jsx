import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const fetchAlerts = async ({ pageParam = null, isRead }) => {
  let url = '/api/v1/alerts?limit=20';
  if (pageParam) url += `&cursor=${pageParam}`;
  if (isRead !== 'all') url += `&isRead=${isRead}`;
  
  const res = await axios.get(url, { withCredentials: true });
  return res.data.data;
};

const AlertsPage = () => {
  const [filterRead, setFilterRead] = useState('all'); // 'all', 'true', 'false'
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['alerts', 'list', filterRead],
    queryFn: ({ pageParam }) => fetchAlerts({ pageParam, isRead: filterRead }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await axios.patch(`/api/v1/alerts/${id}/read`, {}, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = data ? data.pages.flatMap(page => page.alerts || page) : [];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <span className="bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs font-semibold">Critical</span>;
      case 'WARNING': return <span className="bg-amber-900/50 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-semibold">Warning</span>;
      case 'INFO': return <span className="bg-blue-900/50 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs font-semibold">Info</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white">
            Alerts & Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Review updates about your account, detected recurring expenses, and forecast warnings.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <select 
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 dark:text-white"
        >
          <option value="all">All Alerts</option>
          <option value="false">Unread Only</option>
          <option value="true">Read Only</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-500 dark:text-gray-400">Loading alerts...</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No alerts found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">You don't have any alerts matching this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-5 transition-colors flex items-start gap-4 ${!alert.isRead ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div className="mt-1">
                  {getSeverityBadge(alert.severity)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!alert.isRead ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(alert.createdAt).toLocaleString()}
                    {alert.relevantDate && ` • Relates to: ${new Date(alert.relevantDate).toLocaleDateString()}`}
                  </p>
                </div>
                {!alert.isRead && (
                  <button 
                    onClick={() => markReadMutation.mutate(alert.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Alerts'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
