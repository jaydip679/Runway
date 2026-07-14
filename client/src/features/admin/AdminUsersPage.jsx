import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const fetchUsers = async ({ queryKey }) => {
  const [_key, { page, search, isActive }] = queryKey;
  const params = { page, limit: 10 };
  if (search) params.search = search;
  if (isActive !== 'all') params.isActive = isActive;
  
  const { data } = await axios.get('/api/v1/admin/users', { params });
  return data.data; // { users, totalCount, totalPages }
};

const deactivateUser = async (userId) => {
  const { data } = await axios.patch(`/api/v1/admin/users/${userId}/deactivate`);
  return data.data;
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { page, search, isActive: isActiveFilter }],
    queryFn: fetchUsers,
    keepPreviousData: true
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    }
  });

  const handleDeactivate = (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
      deactivateMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">User Management</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex gap-4">
        <input 
          type="text" 
          placeholder="Search name or email..." 
          className="flex-1 max-w-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select 
          className="max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={isActiveFilter}
          onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Role</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                <th className="p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</td>
                </tr>
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">No users found.</td>
                </tr>
              ) : (
                data?.users?.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="text-finance-600 dark:text-finance-400 text-sm font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-finance-500"></span> Active</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Deactivated</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.id !== currentUser.id && user.isActive && (
                        <button 
                          className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={deactivateMutation.isLoading}
                        >
                          Deactivate
                        </button>
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

export default AdminUsersPage;
