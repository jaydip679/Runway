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
    <div className="p-6 max-w-5xl mx-auto animate-fade-in pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Alerts & Notifications
          </h1>
          <p className="text-gray-400 mt-2">
            Review updates about your account, detected recurring expenses, and forecast warnings.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <select 
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Alerts</option>
          <option value="false">Unread Only</option>
          <option value="true">Read Only</option>
        </select>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300">No alerts found</h3>
            <p className="text-gray-500 mt-1">You don't have any alerts matching this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 hover:bg-slate-800/50 transition-colors flex items-start gap-4 ${!alert.isRead ? 'bg-slate-800/20' : ''}`}
              >
                <div className="mt-1">
                  {getSeverityBadge(alert.severity)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${!alert.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.createdAt).toLocaleString()}
                    {alert.relevantDate && ` • Relates to: ${new Date(alert.relevantDate).toLocaleDateString()}`}
                  </p>
                </div>
                {!alert.isRead && (
                  <button 
                    onClick={() => markReadMutation.mutate(alert.id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded transition-colors"
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
            className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Alerts'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
