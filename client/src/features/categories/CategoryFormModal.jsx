import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'Type is required' }),
  icon: z.string().optional(),
});

const CategoryFormModal = ({ isOpen, onClose, onSubmit, initialData, isSubmitting }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      icon: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          name: '',
          type: 'EXPENSE',
          icon: ''
        });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Category Name" 
          {...register('name')} 
          error={errors.name?.message} 
          placeholder="e.g. Groceries"
        />
        
        <div className="input-wrapper">
          <label className="input-label">Type</label>
          <select 
            className={`input-field ${errors.type ? 'input-error' : ''}`} 
            {...register('type')}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          {errors.type && <span className="error-text">{errors.type.message}</span>}
        </div>

        <Input 
          label="Icon (emoji or short text)" 
          {...register('icon')} 
          error={errors.icon?.message} 
          placeholder="e.g. 🛒"
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
