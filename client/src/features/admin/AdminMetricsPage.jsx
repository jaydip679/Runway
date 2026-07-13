import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchMetrics = async () => {
  const { data } = await axios.get('/api/v1/admin/metrics');
  return data.data;
};

const AdminMetricsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: fetchMetrics,
    refetchInterval: 10000 // Poll every 10 seconds
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading system metrics...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-rose-400">Failed to load system metrics.</div>;
  }

  const { users, api, queues } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
        System Metrics
        <span className="relative flex h-3 w-3 ml-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Total Users</div>
          <div className="text-4xl font-bold text-white">{users.total}</div>
        </div>
        
        <div className="glass p-6 rounded-xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">Active Users (7d)</div>
          <div className="text-4xl font-bold text-primary-400">{users.active7d}</div>
        </div>
        
        <div className="glass p-6 rounded-xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
          <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">API Error Rate (1h)</div>
          <div className="text-4xl font-bold text-rose-400">
            {(api.errorRate * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">{api.totalErrors} errs / {api.totalRequests} reqs</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-100 mt-8 mb-4">Background Queues (BullMQ)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(queues).map(([queueName, metrics]) => (
          <div key={queueName} className="glass p-5 rounded-xl border border-white/5 shadow-lg">
            <h3 className="font-semibold text-gray-300 mb-4 truncate" title={queueName}>{queueName}</h3>
            {metrics.error ? (
              <div className="text-rose-400 text-sm">Failed to connect</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Waiting:</span>
                  <span className="font-mono text-gray-200">{metrics.waiting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active:</span>
                  <span className="font-mono text-blue-400">{metrics.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Failed:</span>
                  <span className="font-mono text-rose-400">{metrics.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delayed:</span>
                  <span className="font-mono text-yellow-400">{metrics.delayed}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                  <span className="text-gray-400">Completed:</span>
                  <span className="font-mono text-emerald-400">{metrics.completed}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMetricsPage;
