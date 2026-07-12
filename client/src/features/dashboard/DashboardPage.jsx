import React from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import ForecastChart from '../forecast/ForecastChart';
import ForecastSummaryCards from '../forecast/ForecastSummaryCards';
import AccountCard from '../accounts/AccountCard';
import RecurringCard from '../recurring/RecurringCard';
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
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading your runway...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error loading dashboard</h2>
          <p className="text-red-300">{error.message}</p>
        </div>
      </div>
    );
  }

  const { accounts, forecastSummary, upcomingRecurringCommitments, unreadAlerts } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-24 md:pb-6">
      
      {/* Header with alerts snippet */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Command Center
          </h1>
          <p className="text-gray-400 mt-2">Your unified financial overview</p>
        </div>
        
        {unreadAlerts && unreadAlerts.length > 0 && (
          <Link to="/alerts" className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              🔔
            </div>
            <div>
              <p className="text-white font-medium">{unreadAlerts.length} Unread Alerts</p>
              <p className="text-sm text-gray-400 truncate max-w-xs">{unreadAlerts[0].message}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Forecast Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-emerald-400">📈</span> Forecast
          </h2>
          <Link to="/forecast" className="text-sm text-emerald-400 hover:text-emerald-300">View Details →</Link>
        </div>
        
        {forecastSummary.ready ? (
          <>
            <ForecastSummaryCards summary={forecastSummary} />
            <div className="glass-panel p-6 rounded-xl">
              <ForecastChart days={forecastSummary.fullSeries || []} />
            </div>
          </>
        ) : (
          <div className="glass-panel p-8 rounded-xl text-center">
            <h3 className="text-lg font-medium text-white mb-2">Calculating Your Future...</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We're analyzing your accounts and recurring commitments to build your 60-day forecast. This happens in the background.
            </p>
          </div>
        )}
      </div>

      {/* Two Column Layout for Accounts & Recurring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Accounts Strip */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-blue-400">🏦</span> Active Accounts
            </h2>
            <Link to="/accounts" className="text-sm text-blue-400 hover:text-blue-300">Manage →</Link>
          </div>
          
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map(account => (
                <AccountCard key={account.id} account={account} onEdit={() => {}} />
              ))}
              {accounts.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">+{accounts.length - 3} more accounts</span>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center border-dashed border-2 border-slate-700">
              <p className="text-gray-400">No active accounts</p>
              <Link to="/accounts" className="text-emerald-400 text-sm mt-2 block hover:underline">Add one now</Link>
            </div>
          )}
        </div>

        {/* Upcoming Recurring */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-purple-400">📅</span> Upcoming Commitments
            </h2>
            <Link to="/recurring" className="text-sm text-purple-400 hover:text-purple-300">Manage →</Link>
          </div>

          {upcomingRecurringCommitments.length > 0 ? (
            <div className="space-y-3">
              {upcomingRecurringCommitments.map(commitment => (
                <RecurringCard 
                  key={commitment.id} 
                  commitment={commitment} 
                  onEdit={() => {}} 
                  onConfirm={() => {}} 
                  onDismiss={() => {}} 
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center border-dashed border-2 border-slate-700">
              <p className="text-gray-400">No upcoming commitments</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
