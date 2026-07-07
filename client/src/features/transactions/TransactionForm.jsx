import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
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
      <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label">Type</label>
            <select className={`input-field ${errors.type ? 'input-error' : ''}`} {...register('type')} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="input-wrapper" style={{ flex: 1 }}>
            <label className="input-label">Date</label>
            <Input type="date" {...register('transactionDate')} error={errors.transactionDate?.message} />
          </div>
        </div>

        <Input label="Amount" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} placeholder="0.00" />
        
        <Input label="Description" {...register('description')} error={errors.description?.message} placeholder="e.g. Netflix Subscription" />

        <div className="input-wrapper">
          <label className="input-label">Account</label>
          <select className={`input-field ${errors.accountId ? 'input-error' : ''}`} {...register('accountId')} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <option value="">Select Account</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          {errors.accountId && <span className="error-text">{errors.accountId.message}</span>}
        </div>

        <div className="input-wrapper">
          <label className="input-label">Category</label>
          <select className="input-field" {...register('categoryId')} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <option value="">None</option>
            {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div className="input-wrapper">
          <label className="input-label">Receipt Image (Optional)</label>
          <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }} />
          {initialData?.receiptImageUrl && !receiptFile && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current receipt: <a href={initialData.receiptImageUrl} target="_blank" rel="noreferrer">View</a>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
