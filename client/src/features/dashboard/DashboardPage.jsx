import React from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import ForecastChart from '../forecast/ForecastChart';
import ForecastSummaryCards from '../forecast/ForecastSummaryCards';
import AccountCard from '../accounts/AccountCard';
import RecurringCard from '../recurring/RecurringCard';
import ForecastInsightsPanel from '../forecast/components/ForecastInsightsPanel';
import PendingConfirmationsWidget from '../recurring/components/PendingConfirmationsWidget';
import { Link } from 'react-router-dom';

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
  const res = await axios.post('/api/v1/graphql', { query }, { withCredentials: true });
  if (res.data.errors) {
    throw new Error(res.data.errors[0].message);
  }
  return res.data.data.dashboard;
};

const DashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchOnWindowFocus: false, // Prevents random errors when switching apps
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your runway...</p>
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24 md:pb-6">
      
      {/* Header with alerts snippet */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white">
            Command Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Your unified financial overview</p>
        </div>
        
        {unreadAlerts && unreadAlerts.length > 0 && (
          <Link to="/dashboard/alerts" className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex items-center gap-4 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg">
              🔔
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium">{unreadAlerts.length} Unread Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{unreadAlerts[0].message}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Forecast Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-brand-500">📈</span> Forecast
          </h2>
          <Link to="/dashboard/forecast" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">View Details →</Link>
        </div>
        
        {forecastSummary.ready ? (
          <>
            <ForecastSummaryCards summary={forecastSummary} />
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
              <ForecastChart days={forecastSummary.fullSeries || []} />
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl text-center shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Calculating Your Future...</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We're analyzing your accounts and recurring commitments to build your 60-day forecast. This happens in the background.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 space-y-6">
        <PendingConfirmationsWidget />
        <ForecastInsightsPanel compact={true} />
      </div>

      {/* Two Column Layout for Accounts & Recurring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Accounts Strip */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-finance-500">🏦</span> Active Accounts
            </h2>
            <Link to="/dashboard/accounts" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Manage →</Link>
          </div>
          {accounts?.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map(account => (
                <AccountCard key={account.id} account={account} onEdit={() => {}} />
              ))}
              {accounts.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">+{accounts.length - 3} more accounts</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No active accounts</p>
              <Link to="/dashboard/accounts" className="text-brand-600 dark:text-brand-400 font-medium text-sm mt-2 block hover:underline">Add one now</Link>
            </div>
          )}
        </div>

        {/* Upcoming Recurring */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-purple-500">📅</span> Upcoming Commitments
            </h2>
            <Link to="/dashboard/recurring" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Manage →</Link>
          </div>

          {upcomingRecurringCommitments?.length > 0 ? (
            <div className="space-y-3">
              {upcomingRecurringCommitments.map(commitment => (
                <RecurringCard 
                  key={commitment.id} 
                  item={commitment} 
                  onEdit={() => {}} 
                  onConfirm={() => {}} 
                  onDismiss={() => {}} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl text-center border-dashed border-2 border-gray-200 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No upcoming commitments</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
