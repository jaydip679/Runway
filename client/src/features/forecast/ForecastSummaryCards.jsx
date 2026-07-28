import React from 'react';

const SummaryCard = ({ title, amount, isLoading, timeframe }) => {
  const isNegative = amount < 0;
  
  return (
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="z-10">
        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4">{timeframe}</p>
        
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded mt-2"></div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {amount !== undefined && amount !== null 
                ? `₹${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
                : '---'}
            </span>
            {isNegative && <span className="text-xs text-red-500 font-bold uppercase tracking-wider">Deficit</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const ForecastSummaryCards = ({ summary, isLoading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
      <SummaryCard 
        title="7-Day Outlook" 
        timeframe="High Confidence"
        amount={summary?.day7 ?? summary?.day7Balance} 
        isLoading={isLoading} 
      />
      <SummaryCard 
        title="30-Day Projection" 
        timeframe="Medium Confidence"
        amount={summary?.day30 ?? summary?.day30Balance} 
        isLoading={isLoading} 
      />
      <SummaryCard 
        title="60-Day Horizon" 
        timeframe="Low Confidence"
        amount={summary?.day60 ?? summary?.day60Balance} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default ForecastSummaryCards;
