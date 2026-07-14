import React, { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../api/accountsApi';
import AccountCard from './AccountCard';
import AccountFormModal from './AccountFormModal';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, CreditCard, AlertCircle } from 'lucide-react';

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
      setAccounts(res.data || res); 
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

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-500" />
            Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your checking, savings, and credit cards.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
      </div>

      {error && (
        <div className="flex items-center p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <AccountCard 
            key={acc.id} 
            account={acc} 
            onEdit={handleOpenEdit} 
            onDelete={setDeleteTarget} 
          />
        ))}
        {accounts.length === 0 && !isLoading && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No accounts found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">Connect or create an account to start tracking your finances.</p>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" /> Create First Account
            </Button>
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
        <div className="text-gray-600 dark:text-gray-400 mb-6 mt-2">
          Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteTarget?.name}</strong>? This will permanently remove it from your forecasts and delete all associated transactions.
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isSubmitting}>
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountsPage;
