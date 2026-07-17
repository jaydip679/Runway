import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecurringList, confirmRecurring, dismissRecurring, deleteRecurring } from '../../api/recurringApi';
import RecurringStatusTabs from './RecurringStatusTabs';
import RecurringForm from './RecurringForm';
import RecurringCard from './RecurringCard';
import PendingConfirmationsWidget from './components/PendingConfirmationsWidget';
import Button from '../../components/ui/Button';
import { Plus, Repeat, AlertCircle } from 'lucide-react';

const RecurringPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING_CONFIRMATION');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['recurring'],
    queryFn: getRecurringList
  });

  const confirmMutation = useMutation({
    mutationFn: confirmRecurring,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['recurring'] });
      const previous = queryClient.getQueryData(['recurring']);
      
      queryClient.setQueryData(['recurring'], old => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => item.id === id ? { ...item, status: 'CONFIRMED' } : item)
        };
      });
      return { previous };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['recurring'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: dismissRecurring,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['recurring'] });
      const previous = queryClient.getQueryData(['recurring']);
      
      queryClient.setQueryData(['recurring'], old => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map(item => item.id === id ? { ...item, status: 'DISMISSED' } : item)
        };
      });
      return { previous };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['recurring'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    }
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading recurring commitments...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Failed to load commitments</h2>
          <p className="text-red-600/80 dark:text-red-400/80">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const allItems = response?.data || [];
  const pendingCount = allItems.filter(i => i.status === 'PENDING_CONFIRMATION').length;
  const confirmedCount = allItems.filter(i => i.status === 'CONFIRMED').length;
  const dismissedCount = allItems.filter(i => i.status === 'DISMISSED').length;

  const displayItems = allItems.filter(i => i.status === activeTab);

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            Recurring Commitments
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 ml-13">
            Manage your subscriptions, bills, and regular income.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Manual
        </Button>
      </div>

      <div className="mb-8">
        <PendingConfirmationsWidget />
      </div>

      <div className="mb-6">
        <RecurringStatusTabs 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          counts={{ PENDING_CONFIRMATION: pendingCount, CONFIRMED: confirmedCount, DISMISSED: dismissedCount }} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map(item => (
          <RecurringCard 
            key={item.id} 
            item={item} 
            onConfirm={() => confirmMutation.mutate(item.id)}
            onDismiss={() => dismissMutation.mutate(item.id)}
            onEdit={() => handleOpenEdit(item)}
            onDelete={() => deleteMutation.mutate(item.id)}
            isConfirming={confirmMutation.isPending && confirmMutation.variables === item.id}
            isDismissing={dismissMutation.isPending && dismissMutation.variables === item.id}
          />
        ))}
      </div>

      {displayItems.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center mt-6">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Repeat className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No {activeTab.toLowerCase().replace('_', ' ')} commitments found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {activeTab === 'PENDING_CONFIRMATION' 
              ? 'Our AI will scan your transactions and automatically suggest recurring commitments here.'
              : 'Add manual commitments or confirm AI suggestions to see them here.'}
          </p>
        </div>
      )}

      <RecurringForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingItem}
      />
    </div>
  );
};

export default RecurringPage;
