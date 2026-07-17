import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart3, PieChart, Download, FileText } from 'lucide-react';
import CashFlowChart from './components/CashFlowChart';
import CategoryBreakdown from './components/CategoryBreakdown';
import Button from '../../components/ui/Button';

const fetchAccounts = async () => {
  const { data } = await axios.get('/api/v1/accounts', { withCredentials: true });
  return data.data.accounts;
};

const requestExport = async (filters) => {
  const { data } = await axios.post('/api/v1/export/pdf', { filters }, { withCredentials: true });
  return data;
};

const ReportsPage = () => {
  // Default to last 12 months
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 11);
  defaultStart.setDate(1);

  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('month');
  const [accountId, setAccountId] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  });

  const handleExport = async () => {
    try {
      await requestExport({
        startDate,
        endDate,
        accountId: accountId || undefined
      });
      alert('Export queued! You will receive an alert when your PDF is ready.');
    } catch (err) {
      alert('Failed to queue export');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep dive into your financial history.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleExport} variant="outline" className="flex-1 md:flex-none">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <select 
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer border-r border-gray-200 dark:border-gray-700 pr-3"
          >
            <option value="">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>

          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          />
          <span className="text-gray-400">→</span>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer border-r border-gray-200 dark:border-gray-700 pr-3"
          />

          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Flow Trend</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Income vs Expenses over time.</p>
          <CashFlowChart startDate={startDate} endDate={endDate} period={period} />
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-5 h-5 text-finance-600 dark:text-finance-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Breakdown</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Where your money goes.</p>
          <CategoryBreakdown startDate={startDate} endDate={endDate} accountId={accountId} />
        </div>
      </div>
      
      {/* Additional space for future reports (e.g., Largest Expenses Table) */}
      
    </div>
  );
};

export default ReportsPage;
