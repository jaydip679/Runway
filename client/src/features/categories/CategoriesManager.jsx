import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoriesApi';
import CategoryItem from './CategoryItem';
import CategoryFormModal from './CategoryFormModal';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Tags, AlertCircle } from 'lucide-react';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await getCategories({ page: 1, limit: 100 });
      setCategories(res.data || res);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    if (category.isSystem) return;
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, ...data });
      } else {
        await createCategory(data);
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Delete failed (Category might be in use)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => filterType === 'ALL' || c.type === filterType);

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-2">
            <Tags className="w-6 h-6 text-brand-500" />
            Categories
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage tags for your transactions.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'EXPENSE', 'INCOME'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterType === type 
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {type === 'ALL' ? 'All Types' : type}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {filteredCategories.map(cat => (
          <CategoryItem 
            key={cat.id} 
            category={cat} 
            onEdit={handleOpenEdit} 
            onDelete={setDeleteTarget} 
          />
        ))}
        {filteredCategories.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Tags className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No categories found</h3>
            <p className="text-gray-500 dark:text-gray-400">Add a custom category to organize your spending.</p>
          </div>
        )}
      </div>

      <CategoryFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingCategory} 
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <Modal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        title="Delete Category"
      >
        <div className="text-gray-600 dark:text-gray-400 mb-6 mt-2">
          Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>?
          This action cannot be undone and will fail if transactions reference this category.
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isSubmitting}>
            Delete Category
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManager;
