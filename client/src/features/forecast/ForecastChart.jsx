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
      <div className="flex items-center justify-center h-[400px] w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || !data.ready || !data.days || data.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] w-full rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-dashed text-center p-8 mt-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Forecast Available</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
          <p className={`font-bold text-lg tracking-tight ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            ${dataPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[450px] p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
      <h2 className="text-lg font-bold font-heading text-gray-900 dark:text-white mb-6">60-Day Cash Flow Projection</h2>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-800" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="currentColor" 
            className="text-gray-400 dark:text-gray-500"
            tick={{ fill: 'currentColor', fontSize: 12 }} 
            tickMargin={12} 
            minTickGap={30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="currentColor" 
            className="text-gray-400 dark:text-gray-500"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            width={70}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: '500' }} />
          
          <Line 
            type="monotone" 
            dataKey="high" 
            name="High Confidence (0-14 days)"
            stroke="#0ea5e9" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="medium" 
            name="Medium Confidence (15-30 days)"
            stroke="#f59e0b" 
            strokeWidth={3} 
            strokeDasharray="6 6" 
            dot={false}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            name="Low Confidence (31-60 days)"
            stroke="#94a3b8" 
            strokeWidth={3} 
            strokeDasharray="3 4" 
            dot={false}
            activeDot={{ r: 6, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
