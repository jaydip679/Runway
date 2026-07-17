import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, ArrowDownCircle, AlertTriangle, ArrowRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchInsights = async () => {
  const { data } = await axios.get('/api/v1/forecast/insights');
  return data.data.insights;
};

const InsightIcon = ({ type, priority }) => {
  if (type === 'BIGGEST_EXPENSE') return <ArrowDownCircle className="w-5 h-5 text-brand-500" />;
  if (priority === 'WARNING') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  if (priority === 'CRITICAL') return <AlertCircle className="w-5 h-5 text-red-500" />;
  return <Lightbulb className="w-5 h-5 text-finance-500" />;
};

const ForecastInsightsPanel = ({ compact = false }) => {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['forecast', 'insights'],
    queryFn: fetchInsights
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading insights...</div>;
  }

  if (insights.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Your forecast looks stable. No major alerts or dips detected.</p>
      </div>
    );
  }

  const displayInsights = compact ? insights.slice(0, 3) : insights;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-brand-500" />
          Forecast Insights
        </h3>
        {compact && insights.length > 3 && (
          <Link to="/dashboard/forecast" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700 flex-1 overflow-y-auto">
        {displayInsights.map((insight, index) => (
          <div key={index} className="p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="mt-0.5 shrink-0">
              <InsightIcon type={insight.type} priority={insight.priority} />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {insight.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastInsightsPanel;
