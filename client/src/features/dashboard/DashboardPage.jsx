import React from 'react';
import apiClient from '../../api/apiClient';
import { useQuery } from '@tanstack/react-query';
import ForecastChart from '../forecast/ForecastChart';
import ForecastSummaryCards from '../forecast/ForecastSummaryCards';
import AccountCard from '../accounts/AccountCard';
import RecurringCard from '../recurring/RecurringCard';
import ForecastInsightsPanel from '../forecast/components/ForecastInsightsPanel';
import PendingConfirmationsWidget from '../recurring/components/PendingConfirmationsWidget';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

const fetchDashboard = async () => {
  const query = `
    query {
      dashboard {
        accounts {
          id
          name
          type
          currentBalance
          currency
        }
        forecastSummary {
          ready
          day7Balance
          day30Balance
          day60Balance
          fullSeries {
            forecastDate
            projectedBalance
            confidenceLevel
          }
        }
        upcomingRecurringCommitments {
          id
          name
          amount
          type
          intervalUnit
          intervalCount
          nextOccurrenceDate
          status
        }
        unreadAlerts {
          id
          type
          message
          severity
          createdAt
        }
      }
    }
  `;
  const res = await apiClient.post('/graphql', { query }, { withCredentials: true });
  if (res.data.errors) {
    throw new Error(res.data.errors[0].message);
  }
  return res.data.data.dashboard;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const getHealthStatus = (forecastSummary, unreadAlerts, accounts) => {
  if (!forecastSummary || !forecastSummary.ready) {
    return { 
      status: 'PENDING', 
      trend: 'STABLE', 
      message: 'Analyzing your financial data...',
      icon: <Minus className="w-6 h-6 text-gray-500" />,
      colorClass: 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700'
    };
  }

  let status = 'HEALTHY';
  let trend = 'STABLE';
  let message = 'Cash flow is expected to remain positive for the next 60 days.';

  const currentTotal = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
  const day60 = Number(forecastSummary.day60Balance) || 0;
  
  if (day60 < 0) {
    status = 'CRITICAL';
    message = 'Forecast indicates a potential deficit in the next 60 days.';
  } else if (Number(forecastSummary.day30Balance) < 0 || unreadAlerts.some(a => a.severity === 'CRITICAL')) {
    status = 'WATCH';
    message = 'Caution advised: Keep an eye on your upcoming expenses.';
  }

  if (day60 > currentTotal * 1.05) trend = 'UP';
  else if (day60 < currentTotal * 0.95) trend = 'DOWN';

  let icon = <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />;
  let colorClass = 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800/50';

  if (status === 'WATCH') {
    icon = <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    colorClass = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50';
  } else if (status === 'CRITICAL') {
    icon = <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400" />;
    colorClass = 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50';
  }

  return { status, trend, message, icon, colorClass };
};

const DashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your command center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error loading dashboard</h2>
          <p className="text-red-600 dark:text-red-300">{error.message}</p>
        </div>
      </div>
    );
  }

  const { 
    accounts = [], 
    forecastSummary = {}, 
    upcomingRecurringCommitments = [], 
    unreadAlerts = [] 
  } = data || {};

  const greeting = getGreeting();
  const health = getHealthStatus(forecastSummary, unreadAlerts, accounts);
  const pendingCount = upcomingRecurringCommitments.filter(c => c.status === 'PENDING_CONFIRMATION').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8 pb-24 md:pb-6 font-sans">
      
      {/* Dynamic Header & Health Banner */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {greeting}.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
            {health.message}
            {pendingCount > 0 && ` You have ${pendingCount} commitment${pendingCount > 1 ? 's' : ''} awaiting confirmation.`}
          </p>
        </div>
        
        {/* Health Status Pill */}
        <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border shadow-sm transition-colors ${health.colorClass}`}>
          {health.icon}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Financial Health</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold capitalize">{health.status.toLowerCase()}</span>
              {health.trend === 'UP' && <TrendingUp className="w-4 h-4 opacity-75" title="Trending Up" />}
              {health.trend === 'DOWN' && <TrendingDown className="w-4 h-4 opacity-75" title="Trending Down" />}
              {health.trend === 'STABLE' && <Minus className="w-4 h-4 opacity-75" title="Stable" />}
            </div>
          </div>
        </div>
      </div>

      {/* Main 60/40 Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Forecast (60%) */}
        <div className="xl:col-span-7 space-y-6 lg:space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Cash Flow Projection
              </h2>
              <Link to="/dashboard/forecast" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">View detailed forecast →</Link>
            </div>
            
            {forecastSummary.ready ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <ForecastSummaryCards summary={forecastSummary} />
                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                  <ForecastChart data={{ ready: forecastSummary.ready, days: forecastSummary.fullSeries || [] }} />
                </div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-brand-500 font-bold text-xl">+</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Data Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm mb-4">
                  Add your first account to unlock 60-day cash flow forecasting.
                </p>
                <Link to="/dashboard/accounts" className="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors">
                  Add Account
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 rounded-2xl text-center shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-brand-500 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analyzing your financial future</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                  We are aggregating your accounts and recurring commitments to build a highly accurate 60-day projection.
                </p>
              </div>
            )}
          </div>
          
          <ForecastInsightsPanel compact={true} />
        </div>

        {/* Right Column: Action Items & Accounts (40%) */}
        <div className="xl:col-span-5 space-y-6 lg:space-y-8">
          
          <PendingConfirmationsWidget />

          {/* Accounts Strip */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Active Accounts
              </h2>
              <Link to="/dashboard/accounts" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Manage</Link>
            </div>
            
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              {accounts?.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {accounts?.slice(0, 4).map(account => (
                    <AccountCard key={account.id} account={account} onEdit={() => {}} minimal={true} />
                  ))}
                  {accounts?.length > 4 && (
                    <div className="p-3 text-center bg-gray-50 dark:bg-gray-800/30">
                      <Link to="/dashboard/accounts" className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        View {accounts.length - 4} more accounts
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No active accounts</p>
                  <Link to="/dashboard/accounts" className="text-brand-600 dark:text-brand-400 font-medium text-sm mt-2 inline-block hover:underline">Add your first account</Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Recurring */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Upcoming Commitments
              </h2>
              <Link to="/dashboard/recurring" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Manage</Link>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              {upcomingRecurringCommitments?.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {upcomingRecurringCommitments?.map(commitment => (
                    <RecurringCard 
                      key={commitment.id} 
                      item={commitment} 
                      minimal={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming commitments</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
