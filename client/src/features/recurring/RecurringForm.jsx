import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { createRecurring, updateRecurring } from '../../api/recurringApi';
import { getAccounts } from '../../api/accountsApi';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accountId: z.string().uuid('Please select an account'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  intervalUnit: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  intervalCount: z.coerce.number().int().min(1).default(1),
  nextOccurrenceDate: z.string().min(1, 'Date is required')
});

const RecurringForm = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const { data: accountsRes } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts({ page: 1, limit: 100 })
  });
  
  const accounts = accountsRes?.data || accountsRes || [];
  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'EXPENSE',
      intervalUnit: 'MONTHLY',
      intervalCount: 1,
      nextOccurrenceDate: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          accountId: initialData.accountId,
          amount: initialData.amount,
          type: initialData.type,
          intervalUnit: initialData.intervalUnit,
          intervalCount: initialData.intervalCount,
          nextOccurrenceDate: initialData.nextOccurrenceDate ? new Date(initialData.nextOccurrenceDate).toISOString().split('T')[0] : ''
        });
      } else {
        reset({
          name: '',
          accountId: accountOptions.length > 0 ? accountOptions[0].value : '',
          amount: '',
          type: 'EXPENSE',
          intervalUnit: 'MONTHLY',
          intervalCount: 1,
          nextOccurrenceDate: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData, reset, accounts]);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? updateRecurring({ id: initialData.id, data }) : createRecurring(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      onClose();
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to save recurring commitment');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Commitment' : 'Add Commitment'}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Name" 
          {...register('name')} 
          error={errors.name?.message} 
        />
        
        <Select 
          label="Account" 
          options={accountOptions} 
          {...register('accountId')} 
          error={errors.accountId?.message} 
        />
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              label="Amount" 
              type="number" 
              step="0.01" 
              {...register('amount')} 
              error={errors.amount?.message} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <Select 
              label="Type" 
              options={[{value: 'EXPENSE', label: 'Expense'}, {value: 'INCOME', label: 'Income'}]} 
              {...register('type')} 
              error={errors.type?.message} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Select 
              label="Frequency" 
              options={[
                {value: 'DAILY', label: 'Daily'},
                {value: 'WEEKLY', label: 'Weekly'},
                {value: 'MONTHLY', label: 'Monthly'},
                {value: 'YEARLY', label: 'Yearly'}
              ]} 
              {...register('intervalUnit')} 
              error={errors.intervalUnit?.message} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              label="Interval Count (e.g., 1 for every month)" 
              type="number" 
              min="1"
              {...register('intervalCount')} 
              error={errors.intervalCount?.message} 
            />
          </div>
        </div>

        <Input 
          label="Next Occurrence Date" 
          type="date" 
          {...register('nextOccurrenceDate')} 
          error={errors.nextOccurrenceDate?.message} 
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Add Commitment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringForm;
