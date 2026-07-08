import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ForecastChart from './ForecastChart';
import ForecastSummaryCards from './ForecastSummaryCards';

const fetchForecast = async () => {
  const res = await axios.get('/api/v1/forecast', { withCredentials: true });
  return res.data.data;
};

const fetchForecastSummary = async () => {
  const res = await axios.get('/api/v1/forecast/summary', { withCredentials: true });
  return res.data.data;
};

const ForecastPage = () => {
  const { data: forecastData, isLoading: isLoadingForecast } = useQuery({
    queryKey: ['forecast'],
    queryFn: fetchForecast,
    refetchInterval: 60000, // Refresh every minute in case of background updates
  });

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['forecastSummary'],
    queryFn: fetchForecastSummary,
    refetchInterval: 60000,
  });

  const generateMockForecast = async () => {
    // For demo purposes, we can manually trigger the queue via an endpoint if we had one.
    // Since we don't, we just instruct the user.
    alert('Create some transactions or recurring commitments to see the forecast update in real-time!');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Cash Flow Forecast
          </h1>
          <p className="text-gray-400 mt-2">
            AI-driven projections based on your recurring commitments and spending habits.
          </p>
        </div>
        <button 
          onClick={generateMockForecast}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
        >
          Update Data
        </button>
      </div>

      <ForecastSummaryCards summary={summaryData} isLoading={isLoadingSummary} />

      <ForecastChart data={forecastData} isLoading={isLoadingForecast} />
      
      {/* Information Panel */}
      <div className="mt-8 glass-panel p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-3 text-emerald-400">How this works</h3>
        <ul className="list-disc pl-5 text-gray-300 space-y-2 text-sm leading-relaxed">
          <li>
            <strong className="text-white">Day Zero Balance:</strong> Starts with your current total balance across all active accounts.
          </li>
          <li>
            <strong className="text-white">Recurring Commitments:</strong> Only <em>Confirmed</em> recurring income and expenses are projected on their exact due dates.
          </li>
          <li>
            <strong className="text-white">Discretionary Spending:</strong> Your average daily spend (excluding recurring items) over the last 30 days is subtracted daily.
          </li>
          <li>
            <strong className="text-white">Confidence Levels:</strong> Accuracy decreases over time. The next 14 days are High Confidence, 15-30 days are Medium, and 31-60 days are Low.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ForecastPage;
