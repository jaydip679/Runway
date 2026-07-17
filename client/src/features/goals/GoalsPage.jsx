import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Target, Plus, Edit2, Trash2, Calendar, TrendingUp } from 'lucide-react';
import Button from '../../components/ui/Button';
import GoalModal from './GoalModal';
import { format } from 'date-fns';

const fetchGoals = async () => {
  const { data } = await axios.get('/api/v1/goals');
  return data.data.goals;
};

const deleteGoal = async (id) => {
  await axios.delete(`/api/v1/goals/${id}`);
};

const GoalsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading goals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set targets and see if your forecast keeps you on track.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No savings goals yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Plan for a vacation, an emergency fund, or a big purchase. The forecast engine will tell you if you're on track!</p>
          <Button onClick={() => setIsModalOpen(true)}>Create First Goal</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(goal)} className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saved</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${goal.currentAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Target</p>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">${goal.targetAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg flex items-start gap-3 ${goal.isAchievable ? 'bg-finance-50 dark:bg-finance-900/20 text-finance-800 dark:text-finance-300' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300'}`}>
                  <TrendingUp className={`w-5 h-5 shrink-0 mt-0.5 ${goal.isAchievable ? 'text-finance-600 dark:text-finance-400' : 'text-brand-600 dark:text-brand-400'}`} />
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${goal.isAchievable ? 'text-finance-700 dark:text-finance-400' : 'text-brand-700 dark:text-brand-400'}`}>
                      {goal.isAchievable ? 'On Track!' : 'Action Needed'}
                    </h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {goal.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <GoalModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          goal={editingGoal}
        />
      )}
    </div>
  );
};

export default GoalsPage;
