import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { X } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const saveGoal = async (data) => {
  if (data.id) {
    const { id, ...rest } = data;
    const res = await axios.put(`/api/v1/goals/${id}`, rest);
    return res.data.data.goal;
  }
  const res = await axios.post('/api/v1/goals', data);
  return res.data.data.goal;
};

const fetchAccounts = async () => {
  const { data } = await axios.get('/api/v1/accounts');
  return data.data.accounts;
};

const GoalModal = ({ isOpen, onClose, goal }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    currentAmount: '0',
    linkedAccountIds: []
  });
  const [error, setError] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
        currentAmount: goal.currentAmount.toString(),
        linkedAccountIds: goal.linkedAccounts ? goal.linkedAccounts.map(link => link.accountId) : []
      });
    } else {
      setFormData({
        name: '',
        targetAmount: '',
        targetDate: '',
        currentAmount: '0',
        linkedAccountIds: []
      });
    }
  }, [goal]);

  const mutation = useMutation({
    mutationFn: saveGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'An error occurred while saving the goal');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount || !formData.targetDate) {
      setError('Please fill in all required fields');
      return;
    }
    mutation.mutate({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount)
    });
  };

  const toggleAccount = (accountId) => {
    setFormData(prev => {
      const isLinked = prev.linkedAccountIds.includes(accountId);
      return {
        ...prev,
        linkedAccountIds: isLinked 
          ? prev.linkedAccountIds.filter(id => id !== accountId)
          : [...prev.linkedAccountIds, accountId]
      };
    });
  };

  const hasLinkedAccounts = formData.linkedAccountIds.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {goal ? 'Edit Goal' : 'Add Savings Goal'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Goal Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Europe Trip"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount ($)"
              type="number"
              step="0.01"
              min="1"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="5000"
              required
            />
            <Input
              label="Target Date"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link Accounts (Optional)</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">If you link accounts, the "Current Saved" amount will automatically track their combined balance.</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {accounts.map(acc => (
                <label key={acc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                    checked={formData.linkedAccountIds.includes(acc.id)}
                    onChange={() => toggleAccount(acc.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{acc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Balance: ${Number(acc.currentBalance).toFixed(2)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {!hasLinkedAccounts && (
            <div className="pt-2">
              <Input
                label="Current Saved Amount ($) (Manual)"
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="0"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isLoading} className="flex-1">
              {goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
