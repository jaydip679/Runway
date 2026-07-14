import React from 'react';

const SummaryCard = ({ title, amount, isLoading, timeframe }) => {
  const isNegative = amount < 0;
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="z-10">
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-4 bg-brand-50 dark:bg-brand-900/30 inline-block px-2 py-0.5 rounded-full">{timeframe}</p>
        
        {isLoading ? (
          <div className="h-10 w-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded mt-2"></div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tracking-tight ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {amount !== undefined && amount !== null 
                ? `$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : '---'}
            </span>
            {isNegative && <span className="text-sm text-red-500 font-medium">Deficit</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const ForecastSummaryCards = ({ summary, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <SummaryCard 
        title="7-Day Outlook" 
        timeframe="High Confidence"
        amount={summary?.day7} 
        isLoading={isLoading} 
      />
      <SummaryCard 
        title="30-Day Projection" 
        timeframe="Medium Confidence"
        amount={summary?.day30} 
        isLoading={isLoading} 
      />
      <SummaryCard 
        title="60-Day Horizon" 
        timeframe="Low Confidence"
        amount={summary?.day60} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default ForecastSummaryCards;
