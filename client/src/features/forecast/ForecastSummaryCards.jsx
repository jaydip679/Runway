import React from 'react';

const SummaryCard = ({ title, amount, isLoading, timeframe }) => {
  const isNegative = amount < 0;
  
  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />
      
      <div className="z-10">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">{timeframe}</p>
        
        {isLoading ? (
          <div className="h-10 w-32 bg-slate-800 animate-pulse rounded mt-2"></div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
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
