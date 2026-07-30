import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CashFlowChart = ({ startDate, endDate, period }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'cashflow', startDate, endDate, period],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/cashflow', {
        params: { startDate, endDate, period }
      });
      return data?.data?.cashFlow?.map(d => ({
        ...d,
        dateFormatted: new Date(d.period).toLocaleDateString(undefined, { 
          month: 'short', 
          year: period === 'year' ? 'numeric' : undefined 
        })
      }));
    }
  });

  if (isLoading) {
    return <div className="h-72 w-full flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-72 w-full flex items-center justify-center text-gray-400">No data available for this period.</div>;
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            width={60}
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickFormatter={(val) => {
              if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
              if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
              return `₹${val}`;
            }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(value) => [`₹${value.toFixed(2)}`]}
            cursor={{ fill: '#374151', opacity: 0.1 }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false} />
          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
