import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchCsvImports = async ({ queryKey }) => {
  const [_key, { page, status }] = queryKey;
  const { data } = await axios.get('/api/v1/admin/csv-imports', { params: { page, limit: 15, status } });
  return data.data;
};

const AdminCsvImportsPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('FAILED');

  const { data, isLoading } = useQuery({
    queryKey: ['adminCsvImports', { page, status }],
    queryFn: fetchCsvImports,
    keepPreviousData: true
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">System CSV Imports</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex gap-4">
        <select 
          className="max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="FAILED">Failed Imports</option>
          <option value="COMPLETED">Completed Imports</option>
          <option value="PROCESSING">Processing Imports</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">User</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">File Name</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status/Error</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading imports...</td>
                </tr>
              ) : data?.imports?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No imports found for this status.</td>
                </tr>
              ) : (
                data?.imports?.map(job => (
                  <tr key={job.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm text-gray-900 dark:text-white">
                      <div>{job.user.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{job.user.email}</div>
                    </td>
                    <td className="p-4 font-medium text-sm text-gray-900 dark:text-white">{job.filename}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {job.processedRows} / {job.totalRows}
                    </td>
                    <td className="p-4">
                      {job.status === 'FAILED' ? (
                        <div className="text-red-600 dark:text-red-400 text-sm max-w-xs truncate" title={job.error}>
                          {job.error || 'Unknown error'}
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${job.status === 'COMPLETED' ? 'text-finance-600 dark:text-finance-400' : 'text-brand-600 dark:text-brand-400'}`}>
                          {job.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-4">
          <button 
            className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <span className="px-3 py-1.5 font-medium text-gray-500 dark:text-gray-400 text-sm">Page {page} of {data.totalPages}</span>
          <button 
            className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors" 
            disabled={page === data.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminCsvImportsPage;
