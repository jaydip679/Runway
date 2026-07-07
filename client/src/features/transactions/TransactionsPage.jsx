import React, { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getTransactions, deleteTransaction, uploadReceipt, createTransaction, updateTransaction } from '../../api/transactionsApi';
import { getAccounts } from '../../api/accountsApi';
import { getCategories } from '../../api/categoriesApi';
import TransactionForm from './TransactionForm';
import CsvImportModal from './CsvImportModal';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const TransactionsPage = () => {
  const [filters, setFilters] = useState({ accountId: '', categoryId: '', type: '', startDate: '', endDate: '' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([
      getAccounts({ limit: 100 }),
      getCategories({ limit: 100 })
    ]).then(([accRes, catRes]) => {
      setAccounts(accRes.data || accRes);
      setCategories(catRes.data || catRes);
    }).catch(console.error);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['transactions', filters, debouncedSearch],
    queryFn: ({ pageParam = undefined }) => {
      return getTransactions({
        ...filters,
        search: debouncedSearch,
        cursor: pageParam,
        limit: 20
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const handleFormSubmit = async (data, file) => {
    try {
      let txId;
      if (editingTransaction) {
        await updateTransaction({ id: editingTransaction.id, ...data });
        txId = editingTransaction.id;
      } else {
        const res = await createTransaction(data);
        const created = res.data || res;
        txId = created.id;
      }

      if (file) {
        await uploadReceipt(txId, file);
      }
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Transactions</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</Button>
          <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>+ Add Transaction</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input 
          placeholder="Search..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', flex: 1, minWidth: '200px' }}
        />
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select value={filters.accountId} onChange={e => setFilters(f => ({ ...f, accountId: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={filters.categoryId} onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
      </div>

      {isError && <div style={{ color: 'var(--error)' }}>Failed to load transactions</div>}

      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {data?.pages.map((page, i) => (
          <React.Fragment key={i}>
            {page.data.map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {tx.category?.icon || '📄'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{tx.description}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span>{new Date(tx.transactionDate).toLocaleDateString()}</span>
                      <span>• {tx.account?.name}</span>
                      {tx.category && <span>• {tx.category.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontWeight: '600', color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingTransaction(tx); setIsFormOpen(true); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => setDeleteTarget(tx)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
        
        {isLoading && <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>}
        {data?.pages[0]?.data.length === 0 && <div style={{ padding: '24px', textAlign: 'center' }}>No transactions found</div>}
        {isFetchingNextPage && <div style={{ padding: '24px', textAlign: 'center' }}>Loading more...</div>}
      </div>

      <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editingTransaction} onSubmit={handleFormSubmit} />
      
      <CsvImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportComplete={() => refetch()} />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Transaction">
        <p>Are you sure you want to delete this transaction?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm} style={{ backgroundColor: 'var(--error)' }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsPage;
