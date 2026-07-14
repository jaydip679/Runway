import React, { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getTransactions, deleteTransaction, uploadReceipt, createTransaction, updateTransaction } from '../../api/transactionsApi';
import { getAccounts } from '../../api/accountsApi';
import { getCategories } from '../../api/categoriesApi';
import TransactionForm from './TransactionForm';
import CsvImportModal from './CsvImportModal';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Search, Upload, Plus, Trash2, Edit2, AlertCircle, RefreshCcw, LayoutList } from 'lucide-react';

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
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-brand-500" />
            Transactions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and categorize your spending.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            placeholder="Search transactions..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
          />
        </div>
        
        <select 
          value={filters.type} 
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
        >
          <option value="">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        
        <select 
          value={filters.accountId} 
          onChange={e => setFilters(f => ({ ...f, accountId: e.target.value }))} 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        
        <select 
          value={filters.categoryId} 
          onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))} 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <input 
          type="date" 
          value={filters.startDate} 
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white" 
        />
        <input 
          type="date" 
          value={filters.endDate} 
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white" 
        />
      </div>

      {isError && (
        <div className="flex items-center p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="text-sm font-medium">Failed to load transactions</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {data?.pages.map((page, i) => (
          <React.Fragment key={i}>
            {page.data.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-4 sm:gap-0 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-lg border border-gray-200 dark:border-gray-700">
                    {tx.category?.icon || '📄'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-0.5">{tx.description}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 items-center">
                      <span>{new Date(tx.transactionDate).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span>{tx.account?.name}</span>
                      {tx.category && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span>{tx.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <div className={`font-semibold ${tx.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}₹{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingTransaction(tx); setIsFormOpen(true); }} 
                      className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(tx)} 
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
        
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <RefreshCcw className="w-6 h-6 text-brand-500 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading transactions...</p>
          </div>
        )}
        
        {data?.pages[0]?.data.length === 0 && (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <LayoutList className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">No transactions found</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting your filters or importing a CSV file.</p>
          </div>
        )}
        
        {isFetchingNextPage && (
          <div className="p-6 flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4 text-brand-500 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading more...</p>
          </div>
        )}
      </div>

      <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editingTransaction} onSubmit={handleFormSubmit} />
      
      <CsvImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportComplete={() => refetch()} />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Transaction">
        <div className="text-gray-600 dark:text-gray-400 mb-6 mt-2">
          Are you sure you want to delete this transaction? It will be removed from your forecasts permanently.
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Delete Transaction</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsPage;
