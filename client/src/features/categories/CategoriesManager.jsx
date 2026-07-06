import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoriesApi';
import CategoryItem from './CategoryItem';
import CategoryFormModal from './CategoryFormModal';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal';

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

  if (isLoading && categories.length === 0) return <div>Loading categories...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Categories</h1>
        <Button onClick={handleOpenCreate}>+ Add Category</Button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {['ALL', 'EXPENSE', 'INCOME'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              backgroundColor: filterType === type ? 'var(--primary)' : 'transparent',
              color: filterType === type ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {type === 'ALL' ? 'All Types' : type}
          </button>
        ))}
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {filteredCategories.map(cat => (
          <CategoryItem 
            key={cat.id} 
            category={cat} 
            onEdit={handleOpenEdit} 
            onDelete={setDeleteTarget} 
          />
        ))}
        {filteredCategories.length === 0 && !isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No categories found.
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
        <div style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This action cannot be undone and will fail if transactions reference this category.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isSubmitting} style={{ backgroundColor: 'var(--error)', color: 'white' }}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManager;
