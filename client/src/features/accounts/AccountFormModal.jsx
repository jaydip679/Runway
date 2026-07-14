import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const accountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  type: z.enum(['BANK', 'CASH', 'WALLET', 'CREDIT_CARD'], { required_error: 'Type is required' }),
  currentBalance: z.preprocess((val) => Number(val), z.number()),
  currency: z.string().min(3).max(3).default('INR'),
});

const AccountFormModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      currentBalance: '',
      currency: 'INR'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          ...initialData,
          currentBalance: initialData.currentBalance.toString()
        });
      } else {
        reset({
          name: '',
          type: 'BANK',
          currentBalance: '',
          currency: 'INR'
        });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Account' : 'Add Account'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
        <Input 
          label="Account Name" 
          {...register('name')} 
          error={errors.name?.message} 
          placeholder="e.g. HDFC Savings"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account Type</label>
          <select 
            className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.type ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20'} rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-4`} 
            {...register('type')}
          >
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="WALLET">Wallet</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>
          {errors.type && <span className="text-red-500 text-xs mt-1 block font-medium">{errors.type.message}</span>}
        </div>

        <Input 
          label="Current Balance" 
          type="number" 
          step="0.01"
          {...register('currentBalance')} 
          error={errors.currentBalance?.message} 
          placeholder="0.00"
        />

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountFormModal;
