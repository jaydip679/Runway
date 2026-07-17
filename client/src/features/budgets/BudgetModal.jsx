import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { X } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const saveBudget = async (data) => {
  if (data.id) {
    const { id, ...rest } = data;
    const res = await axios.put(`/api/v1/budgets/${id}`, rest);
    return res.data.data.budget;
  }
  const res = await axios.post('/api/v1/budgets', data);
  return res.data.data.budget;
};

const fetchCategories = async () => {
  const { data } = await axios.get('/api/v1/categories?type=EXPENSE');
  return data.data.categories;
};

const BudgetModal = ({ isOpen, onClose, budget }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'MONTHLY'
  });
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'EXPENSE'],
    queryFn: fetchCategories
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budget.amount,
        period: budget.period
      });
    } else {
      setFormData({
        categoryId: categories.length > 0 ? categories[0].id : '',
        amount: '',
        period: 'MONTHLY'
      });
    }
  }, [budget, categories]);

  const mutation = useMutation({
    mutationFn: saveBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'An error occurred while saving the budget');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }
    mutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {budget ? 'Edit Budget' : 'Add New Budget'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              disabled={!!budget} // Don't allow changing category of existing budget
              className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors disabled:opacity-50"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Monthly Limit ($)"
            type="number"
            step="0.01"
            min="1"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="e.g. 500"
            required
          />

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isLoading} className="flex-1">
              {budget ? 'Save Changes' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
