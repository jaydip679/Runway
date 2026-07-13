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
        <h1 className="text-2xl font-bold text-gray-100">System CSV Imports</h1>
      </div>

      <div className="glass p-4 rounded-xl flex gap-4">
        <select 
          className="input-field max-w-xs"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="FAILED">Failed Imports</option>
          <option value="COMPLETED">Completed Imports</option>
          <option value="PROCESSING">Processing Imports</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-semibold text-gray-300">Date</th>
                <th className="p-4 font-semibold text-gray-300">User</th>
                <th className="p-4 font-semibold text-gray-300">File Name</th>
                <th className="p-4 font-semibold text-gray-300">Progress</th>
                <th className="p-4 font-semibold text-gray-300">Status/Error</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">Loading imports...</td>
                </tr>
              ) : data?.imports?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">No imports found for this status.</td>
                </tr>
              ) : (
                data?.imports?.map(job => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm">
                      <div>{job.user.name}</div>
                      <div className="text-gray-500 text-xs">{job.user.email}</div>
                    </td>
                    <td className="p-4 font-medium text-sm">{job.filename}</td>
                    <td className="p-4 text-sm">
                      {job.processedRows} / {job.totalRows}
                    </td>
                    <td className="p-4">
                      {job.status === 'FAILED' ? (
                        <div className="text-rose-400 text-sm max-w-xs truncate" title={job.error}>
                          {job.error || 'Unknown error'}
                        </div>
                      ) : (
                        <span className={`text-sm ${job.status === 'COMPLETED' ? 'text-emerald-400' : 'text-blue-400'}`}>
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
            className="btn-secondary px-3 py-1 text-sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <span className="px-3 py-1 text-gray-400 text-sm">Page {page} of {data.totalPages}</span>
          <button 
            className="btn-secondary px-3 py-1 text-sm" 
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
