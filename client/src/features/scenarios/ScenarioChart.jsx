import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const baseline = payload.find(p => p.dataKey === 'baselineBalance');
    const scenario = payload.find(p => p.dataKey === 'scenarioBalance');
    
    let difference = 0;
    if (baseline && scenario) {
      difference = scenario.value - baseline.value;
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl">
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">
          {format(parseISO(label), 'MMM d, yyyy')}
        </p>
        <div className="space-y-2">
          {baseline && (
            <div className="flex justify-between gap-6">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div> Current
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">${baseline.value.toFixed(2)}</span>
            </div>
          )}
          {scenario && (
            <div className="flex justify-between gap-6">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div> Scenario
              </span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">${scenario.value.toFixed(2)}</span>
            </div>
          )}
          {difference !== 0 && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-6">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Impact</span>
              <span className={`text-sm font-bold ${difference > 0 ? 'text-finance-500' : 'text-red-500'}`}>
                {difference > 0 ? '+' : ''}${difference.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ScenarioChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Format data for Recharts
  const chartData = data.map(day => ({
    date: new Date(day.date).toISOString().split('T')[0],
    baselineBalance: day.baselineBalance,
    scenarioBalance: day.scenarioBalance
  }));

  const minBaseline = Math.min(...chartData.map(d => d.baselineBalance));
  const minScenario = Math.min(...chartData.map(d => d.scenarioBalance));
  const maxBaseline = Math.max(...chartData.map(d => d.baselineBalance));
  const maxScenario = Math.max(...chartData.map(d => d.scenarioBalance));
  
  const yMin = Math.min(minBaseline, minScenario) * 0.95;
  const yMax = Math.max(maxBaseline, maxScenario) * 1.05;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700/50" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => format(parseISO(val), 'MMM d')}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            domain={[yMin, yMax]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(val) => `$${val.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey="baselineBalance" 
            stroke="#9ca3af" 
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1} 
            fill="url(#colorBaseline)" 
            name="Current Forecast"
            isAnimationActive={true}
          />
          <Area 
            type="monotone" 
            dataKey="scenarioBalance" 
            stroke="#4f46e5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScenario)" 
            name="Scenario"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScenarioChart;
