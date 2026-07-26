import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

const fetchAlerts = async ({ pageParam = null, isRead }) => {
  let url = '/alerts?limit=20';
  if (pageParam) url += `&cursor=${pageParam}`;
  if (isRead !== 'all') url += `&isRead=${isRead}`;
  
  const res = await apiClient.get(url, { withCredentials: true });
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
      await apiClient.patch(`/alerts/${id}/read`, {}, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/alerts/all/read', {}, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = data ? data.pages.flatMap(page => page.alerts || page) : [];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded text-xs font-semibold">Critical</span>;
      case 'WARNING': return <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded text-xs font-semibold">Warning</span>;
      case 'INFO': return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded text-xs font-semibold">Info</span>;
      default: return null;
    }
  };

  const handleDownloadPdf = async (documentId) => {
    try {
      const res = await apiClient.get(`/export/download/${documentId}`, { 
        withCredentials: true,
        responseType: 'blob' // Expect a binary file instead of JSON
      });
      
      // Create a blob URL and open it
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      if (err.response && err.response.status === 410) {
        alert('This export has expired (10 minute limit). Please generate a new one from the Reports page.');
      } else {
        alert('Failed to load PDF document');
      }
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
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || (alerts.length === 0)}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {markAllReadMutation.isPending ? 'Marking...' : 'Mark All Read'}
        </button>
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
                <div className="flex flex-col gap-2 items-end">
                  {!alert.isRead && (
                    <button 
                      onClick={() => markReadMutation.mutate(alert.id)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                    >
                      Mark Read
                    </button>
                  )}
                  {alert.type === 'EXPORT_READY' && alert.relatedEntityId && (
                    <button 
                      onClick={() => handleDownloadPdf(alert.relatedEntityId)}
                      className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  )}
                </div>
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
