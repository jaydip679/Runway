import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Sparkles, Plus, Trash2, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import ScenarioChart from './ScenarioChart';

const simulateScenarioApi = async (events) => {
  const { data } = await axios.post('/api/v1/forecast/scenario', { events }, { withCredentials: true });
  return data.data; // { baseline, scenario }
};

const ScenariosPage = () => {
  const [events, setEvents] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);

  const simulateMutation = useMutation({
    mutationFn: simulateScenarioApi,
    onSuccess: (data) => {
      // Zip the arrays together for the chart
      const zipped = [];
      for (let i = 0; i < data.baseline.length; i++) {
        zipped.push({
          date: data.baseline[i].forecastDate,
          baselineBalance: Number(data.baseline[i].projectedBalance),
          scenarioBalance: Number(data.scenario[i].projectedBalance)
        });
      }
      setChartData(zipped);

      // Compute summary (Day 30 and Day 60 difference)
      const day30Base = Number(data.baseline[29].projectedBalance);
      const day30Scen = Number(data.scenario[29].projectedBalance);
      const day60Base = Number(data.baseline[59].projectedBalance);
      const day60Scen = Number(data.scenario[59].projectedBalance);
      
      setSummary({
        day30Diff: day30Scen - day30Base,
        day60Diff: day60Scen - day60Base
      });
    }
  });

  const handleAddEvent = (type) => {
    const newEvent = {
      id: Date.now().toString(),
      type,
      name: '',
      amount: '',
      date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      recurringType: 'EXPENSE',
      intervalUnit: 'MONTHLY'
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleChange = (id, field, value) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSimulate = () => {
    // Format events for API (remove UI-only ID)
    const formattedEvents = events.map(({ id, amount, ...rest }) => ({
      ...rest,
      amount: Number(amount)
    }));
    simulateMutation.mutate(formattedEvents);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-brand-500" />
          Scenario Planning
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Play out "What if?" financial scenarios in a safe sandbox. 
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Pane: Builder */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Simulation Events</h3>
            
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                Add an event below to see how it impacts your future balance.
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {events.map((event, index) => (
                  <div key={event.id} className="relative bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 group">
                    <button 
                      onClick={() => handleRemoveEvent(event.id)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs font-bold px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-md">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                        <input type="text" value={event.name} onChange={(e) => handleChange(event.id, 'name', e.target.value)} placeholder="e.g. Buy Laptop" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                          <input type="number" value={event.amount} onChange={(e) => handleChange(event.id, 'amount', e.target.value)} placeholder="1500" className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">{event.type === 'NEW_RECURRING' ? 'Start Date' : 'Date'}</label>
                          <input type="date" value={event.date} onChange={(e) => handleChange(event.id, 'date', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" />
                        </div>
                      </div>
                      
                      {event.type === 'NEW_RECURRING' && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                            <select value={event.recurringType} onChange={(e) => handleChange(event.id, 'recurringType', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <option value="EXPENSE">Expense</option>
                              <option value="INCOME">Income</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Interval</label>
                            <select value={event.intervalUnit} onChange={(e) => handleChange(event.id, 'intervalUnit', e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <option value="MONTHLY">Monthly</option>
                              <option value="YEARLY">Yearly</option>
                              <option value="WEEKLY">Weekly</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Event</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleAddEvent('ONE_TIME_EXPENSE')} className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4 text-brand-500" /> One-Time Exp.
                </button>
                <button onClick={() => handleAddEvent('NEW_RECURRING')} className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4 text-brand-500" /> Subscription
                </button>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleSimulate} disabled={events.length === 0 || simulateMutation.isPending} className="w-full">
                {simulateMutation.isPending ? 'Simulating...' : 'Run Simulation'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Pane: Chart & Results */}
        <div className="lg:col-span-2 space-y-6">
          {chartData ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Impact (30 Days)</p>
                      <h3 className={`text-2xl font-bold mt-1 ${summary.day30Diff >= 0 ? 'text-finance-600 dark:text-finance-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.day30Diff >= 0 ? '+' : ''}${summary.day30Diff.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Impact (60 Days)</p>
                      <h3 className={`text-2xl font-bold mt-1 ${summary.day60Diff >= 0 ? 'text-finance-600 dark:text-finance-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.day60Diff >= 0 ? '+' : ''}${summary.day60Diff.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Simulation Forecast</h3>
                <ScenarioChart data={chartData} />
              </div>
            </div>
          ) : (
            <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 p-12 rounded-3xl h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-brand-300 dark:text-brand-700 mb-4" />
              <h2 className="text-xl font-bold text-brand-900 dark:text-brand-300 mb-2">Build Your Scenario</h2>
              <p className="text-brand-700 dark:text-brand-500/80 max-w-sm mx-auto">
                Add some hypothetical events on the left, then run the simulation to see exactly how they would impact your financial runway over the next 60 days.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ScenariosPage;
