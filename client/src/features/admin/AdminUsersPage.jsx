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
        <h1 className="text-2xl font-bold text-gray-100">User Management</h1>
      </div>

      <div className="glass p-4 rounded-xl flex gap-4">
        <input 
          type="text" 
          placeholder="Search name or email..." 
          className="input-field max-w-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select 
          className="input-field max-w-xs"
          value={isActiveFilter}
          onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 font-semibold text-gray-300">Name</th>
                <th className="p-4 font-semibold text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-300">Role</th>
                <th className="p-4 font-semibold text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-300">Joined</th>
                <th className="p-4 font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">Loading users...</td>
                </tr>
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                data?.users?.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isActive ? (
                        <span className="text-emerald-400 text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active</span>
                      ) : (
                        <span className="text-rose-400 text-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Deactivated</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.id !== currentUser.id && user.isActive && (
                        <button 
                          className="btn-danger text-xs px-3 py-1"
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

export default AdminUsersPage;
