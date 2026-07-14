import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
        <Input 
          label="Category Name" 
          {...register('name')} 
          error={errors.name?.message} 
          placeholder="e.g. Groceries"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
          <select 
            className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border ${errors.type ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500/20'} rounded-lg text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-4`} 
            {...register('type')}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
          {errors.type && <span className="text-red-500 text-xs mt-1 block font-medium">{errors.type.message}</span>}
        </div>

        <Input 
          label="Icon (emoji or short text)" 
          {...register('icon')} 
          error={errors.icon?.message} 
          placeholder="e.g. 🛒"
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
