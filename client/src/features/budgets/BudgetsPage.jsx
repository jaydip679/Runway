import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit2, Trash2, PieChart } from 'lucide-react';
import Button from '../../components/ui/Button';
import BudgetModal from './BudgetModal';

const fetchBudgets = async () => {
  const { data } = await axios.get('/api/v1/budgets');
  return data.data.budgets;
};

const deleteBudget = async (id) => {
  await axios.delete(`/api/v1/budgets/${id}`);
};

const BudgetsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgets
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading budgets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Budgets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and control your spending limits.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No budgets set</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Create monthly budgets for your expense categories to keep your spending in check.</p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Budget</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(budget)} className="p-2 text-gray-400 hover:text-finance-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(budget.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-finance-50 dark:bg-finance-900/30 flex items-center justify-center text-finance-600 dark:text-finance-400 text-2xl">
                  {budget.category.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{budget.category.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{budget.period}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Spent: <span className="font-medium text-gray-900 dark:text-white">${budget.amountSpent.toFixed(2)}</span></span>
                  <span className="text-gray-600 dark:text-gray-400">Limit: <span className="font-medium text-gray-900 dark:text-white">${budget.amount.toFixed(2)}</span></span>
                </div>
                
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${budget.isExceeded ? 'bg-red-500' : budget.progressPercentage > 80 ? 'bg-yellow-500' : 'bg-finance-500'}`}
                    style={{ width: `${Math.min(100, budget.progressPercentage)}%` }}
                  />
                </div>
                
                <div className="text-right text-xs font-medium">
                  {budget.isExceeded ? (
                    <span className="text-red-600 dark:text-red-400">Exceeded by ${(budget.amountSpent - budget.amount).toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">${budget.remainingAmount.toFixed(2)} remaining</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <BudgetModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          budget={editingBudget}
        />
      )}
    </div>
  );
};

export default BudgetsPage;
