import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';

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
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Account Name" 
          {...register('name')} 
          error={errors.name?.message} 
          placeholder="e.g. HDFC Savings"
        />
        
        <div className="input-wrapper">
          <label className="input-label">Account Type</label>
          <select 
            className={`input-field ${errors.type ? 'input-error' : ''}`} 
            {...register('type')}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="WALLET">Wallet</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>
          {errors.type && <span className="error-text">{errors.type.message}</span>}
        </div>

        <Input 
          label="Current Balance" 
          type="number" 
          step="0.01"
          {...register('currentBalance')} 
          error={errors.currentBalance?.message} 
          placeholder="0.00"
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountFormModal;
