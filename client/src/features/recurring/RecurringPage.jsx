import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecurringList, confirmRecurring, dismissRecurring, deleteRecurring } from '../../api/recurringApi';
import RecurringStatusTabs from './RecurringStatusTabs';
import RecurringForm from './RecurringForm';
import RecurringCard from './RecurringCard';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal';

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

  if (isLoading) return <div style={{ padding: '24px' }}>Loading recurring commitments...</div>;
  if (isError) return <div style={{ padding: '24px', color: 'var(--error)' }}>Failed to load recurring commitments.</div>;

  const allItems = response?.data || [];
  const pendingCount = allItems.filter(i => i.status === 'PENDING_CONFIRMATION').length;
  const confirmedCount = allItems.filter(i => i.status === 'CONFIRMED').length;
  const dismissedCount = allItems.filter(i => i.status === 'DISMISSED').length;

  const displayItems = allItems.filter(i => i.status === activeTab);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Recurring Commitments</h1>
        <Button onClick={handleOpenCreate}>+ Add Manual</Button>
      </div>

      <RecurringStatusTabs 
        activeTab={activeTab} 
        onChange={setActiveTab} 
        counts={{ PENDING_CONFIRMATION: pendingCount, CONFIRMED: confirmedCount, DISMISSED: dismissedCount }} 
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px',
        marginTop: '24px'
      }}>
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
        {displayItems.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No {activeTab.toLowerCase().replace('_', ' ')} commitments found.
          </div>
        )}
      </div>

      <RecurringForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingItem}
      />
    </div>
  );
};

export default RecurringPage;
