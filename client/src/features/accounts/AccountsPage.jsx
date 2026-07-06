import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accountsApi';
import AccountCard from './AccountCard';
import AccountFormModal from './AccountFormModal';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await getAccounts({ page: 1, limit: 100 });
      setAccounts(res.data || res); // Depends on how interceptor extracts data
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      if (editingAccount) {
        await updateAccount({ id: editingAccount.id, ...data });
      } else {
        await createAccount(data);
      }
      setIsFormOpen(false);
      fetchAccounts();
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
      await deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && accounts.length === 0) return <div>Loading accounts...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Accounts</h1>
        <Button onClick={handleOpenCreate}>+ Add Account</Button>
      </div>

      {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {accounts.map(acc => (
          <AccountCard 
            key={acc.id} 
            account={acc} 
            onEdit={handleOpenEdit} 
            onDelete={setDeleteTarget} 
          />
        ))}
        {accounts.length === 0 && !isLoading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No accounts found. Create one to get started.
          </div>
        )}
      </div>

      <AccountFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingAccount} 
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <Modal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        title="Delete Account"
      >
        <div style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will exclude it from forecasts.
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

export default AccountsPage;
