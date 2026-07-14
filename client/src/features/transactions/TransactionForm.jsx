import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getAccounts } from '../../api/accountsApi';
import { getCategories } from '../../api/categoriesApi';
import { uploadReceipt } from '../../api/transactionsApi';

const transactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  amount: z.preprocess((val) => Number(val), z.number().positive('Amount must be positive')),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required').max(255),
  transactionDate: z.string().min(1, 'Date is required').refine(val => {
    const d = new Date(val);
    const max = new Date();
    max.setDate(max.getDate() + 1);
    return d <= max;
  }, 'Future dates are not allowed')
});

const TransactionForm = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      accountId: '',
      categoryId: '',
      amount: '',
      type: 'EXPENSE',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0]
    }
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        getAccounts({ limit: 100 }),
        getCategories({ limit: 100 })
      ]).then(([accRes, catRes]) => {
        setAccounts(accRes.data || accRes);
        setCategories(catRes.data || catRes);
      }).catch(console.error);

      if (initialData) {
        reset({
          ...initialData,
          amount: initialData.amount.toString(),
          transactionDate: new Date(initialData.transactionDate).toISOString().split('T')[0],
          categoryId: initialData.categoryId || ''
        });
      } else {
        reset({
          accountId: '',
          categoryId: '',
          amount: '',
          type: 'EXPENSE',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0]
        });
      }
      setReceiptFile(null);
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data) => {
    const payload = { ...data };
    if (!payload.categoryId) delete payload.categoryId;
    
    // We pass receiptFile up to the parent to upload after creation/update
    onSubmit(payload, receiptFile);
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 mt-2">
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <select 
              className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.type ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20'} rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-4`} 
              {...register('type')}
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="flex-1">
            <Input label="Date" type="date" {...register('transactionDate')} error={errors.transactionDate?.message} />
          </div>
        </div>

        <Input label="Amount" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} placeholder="0.00" />
        
        <Input label="Description" {...register('description')} error={errors.description?.message} placeholder="e.g. Netflix Subscription" />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Account</label>
          <select 
            className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.accountId ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20'} rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-4`} 
            {...register('accountId')}
          >
            <option value="">Select Account</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          {errors.accountId && <span className="text-red-500 text-xs mt-1 block font-medium">{errors.accountId.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <select 
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-4" 
            {...register('categoryId')}
          >
            <option value="">None</option>
            {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Receipt Image (Optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setReceiptFile(e.target.files[0])} 
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/30 dark:file:text-brand-400" 
          />
          {initialData?.receiptImageUrl && !receiptFile && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Current receipt: <a href={initialData.receiptImageUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-500 dark:text-brand-400">View</a>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
