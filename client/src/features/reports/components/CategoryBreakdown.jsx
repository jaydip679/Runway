import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CategoryBreakdown = ({ startDate, endDate, accountId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'categories', startDate, endDate, accountId],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/analytics/categories', {
        params: { startDate, endDate, accountId }
      });
      return data.data.breakdown.map(d => ({
        name: d.category.name,
        value: d.amount,
        percentage: d.percentage
      }));
    }
  });

  if (isLoading) {
    return <div className="h-72 w-full flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-72 w-full flex items-center justify-center text-gray-400">No expenses found for this period.</div>;
  }

  return (
    <div className="h-72 w-full mt-4 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [`$${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`, name]}
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryBreakdown;
