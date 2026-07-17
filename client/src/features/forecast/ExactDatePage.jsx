import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar, TrendingUp, TrendingDown, Info, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';

const fetchExactDate = async (date) => {
  const { data } = await axios.get('/api/v1/forecast/evaluate-date', {
    params: { date }
  });
  return data.data;
};

const ConfidenceBadge = ({ level }) => {
  if (level === 'HIGH') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"><ShieldCheck className="w-3 h-3" /> High Confidence</span>;
  if (level === 'MEDIUM') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Shield className="w-3 h-3" /> Medium Confidence</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"><ShieldAlert className="w-3 h-3" /> Low Confidence</span>;
};

const ExactDatePage = () => {
  const [targetDate, setTargetDate] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['forecast', 'exact-date', submittedDate],
    queryFn: () => fetchExactDate(submittedDate),
    enabled: !!submittedDate,
    retry: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (targetDate) {
      setSubmittedDate(targetDate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exact Date Evaluation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Peer into the future to see your expected financial state on any specific day.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm max-w-xl">
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
            <input 
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <Button type="submit" disabled={!targetDate || isLoading}>
            {isLoading ? 'Evaluating...' : 'Evaluate'}
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-3 items-start">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error.response?.data?.error?.message || 'Failed to evaluate date. Ensure the date is not in the past.'}</p>
        </div>
      )}

      {data && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <ConfidenceBadge level={data.confidenceLevel} />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Expected Balance</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">${data.projectedBalance.toFixed(2)}</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-finance-500" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Income</p>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">${data.expectedIncome.toFixed(2)}</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Expenses</p>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">${data.expectedExpense.toFixed(2)}</h2>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Commitments on this Date
              </h3>
            </div>
            {data.upcomingCommitments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recurring commitments expected on this date.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.upcomingCommitments.map((c, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.type.toLowerCase()}</p>
                    </div>
                    <p className={`font-semibold ${c.type === 'INCOME' ? 'text-finance-600 dark:text-finance-400' : 'text-gray-900 dark:text-white'}`}>
                      {c.type === 'INCOME' ? '+' : '-'}${c.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExactDatePage;
