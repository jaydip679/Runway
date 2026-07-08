import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const ForecastChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] w-full rounded-xl glass-panel">
        <div className="animate-pulse text-gray-400">Loading forecast...</div>
      </div>
    );
  }

  if (!data || !data.ready || !data.days || data.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] w-full rounded-xl glass-panel text-center p-8">
        <h3 className="text-xl font-bold mb-2">No Forecast Available</h3>
        <p className="text-gray-400 text-sm">
          We need more transaction history or recurring commitments to generate a reliable forecast.
        </p>
      </div>
    );
  }

  // Transform data for continuous lines of different styles
  const chartData = data.days.map((day, index, array) => {
    const formattedDate = new Date(day.forecastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const result = {
      date: formattedDate,
      balance: parseFloat(day.projectedBalance),
    };

    if (day.confidenceLevel === 'HIGH') {
      result.high = result.balance;
      // Bridge gap to MEDIUM
      if (index + 1 < array.length && array[index + 1].confidenceLevel === 'MEDIUM') {
        // We'll let the next point's medium value connect, 
        // actually we need THIS point to have 'medium' so the MEDIUM line starts here.
        result.medium = result.balance;
      }
    } else if (day.confidenceLevel === 'MEDIUM') {
      result.medium = result.balance;
      // Bridge gap to LOW
      if (index + 1 < array.length && array[index + 1].confidenceLevel === 'LOW') {
        result.low = result.balance;
      }
    } else {
      result.low = result.balance;
    }

    return result;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the first payload item that has a value (since we split them)
      const dataPoint = payload.find(p => p.value !== undefined);
      if (!dataPoint) return null;

      const isNegative = dataPoint.value < 0;
      
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
          <p className="text-sm text-gray-300 mb-1">{label}</p>
          <p className={`font-bold text-lg ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
            ${dataPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[450px] p-4 glass-panel rounded-xl">
      <h2 className="text-lg font-bold mb-4">60-Day Cash Flow Projection</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickMargin={10} 
            minTickGap={30}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
          
          <Line 
            type="monotone" 
            dataKey="high" 
            name="High Confidence (0-14 days)"
            stroke="#10b981" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="medium" 
            name="Medium Confidence (15-30 days)"
            stroke="#f59e0b" 
            strokeWidth={3} 
            strokeDasharray="5 5" 
            dot={false}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            name="Low Confidence (31-60 days)"
            stroke="#ef4444" 
            strokeWidth={3} 
            strokeDasharray="2 4" 
            dot={false}
            activeDot={{ r: 6, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
