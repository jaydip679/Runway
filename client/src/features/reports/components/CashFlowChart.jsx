import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ startDate, endDate, period }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'cashflow', startDate, endDate, period],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/analytics/cashflow', {
        params: { startDate, endDate, period }
      });
      return data.data.cashFlow.map(d => ({
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
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#e5e7eb' }}
            formatter={(value) => [`$${value.toFixed(2)}`]}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowChart;
