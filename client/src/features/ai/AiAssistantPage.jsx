import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import Button from '../../components/ui/Button';

const askAiAffordability = async (question) => {
  const res = await axios.post('/api/v1/ai/affordability', { question }, { withCredentials: true });
  return res.data.data;
};

const AiAssistantPage = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]); // [{ type: 'user' | 'ai' | 'error', text: '', reasoning: '', confidence: '' }]
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [resetAt, setResetAt] = useState(null);
  const messagesEndRef = useRef(null);

  const mutation = useMutation({
    mutationFn: askAiAffordability,
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        type: 'ai',
        text: data.answer,
        reasoning: data.reasoning,
        confidence: data.confidence,
        isMock: data.isMock
      }]);
    },
    onError: (err) => {
      if (err.response?.status === 429) {
        setQuotaExceeded(true);
        setResetAt(err.response.data?.error?.details?.resetAt);
        setMessages(prev => [...prev, {
          type: 'error',
          text: `Daily AI quota exceeded. Please try again after ${new Date(err.response.data?.error?.details?.resetAt).toLocaleString()}.`
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'error',
          text: err.response?.data?.error?.message || 'Failed to get a response from AI.'
        }]);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || quotaExceeded || mutation.isPending) return;

    setMessages(prev => [...prev, { type: 'user', text: question }]);
    mutation.mutate(question);
    setQuestion('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'HIGH': return <span className="bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">HIGH CONFIDENCE</span>;
      case 'MEDIUM': return <span className="bg-amber-900/50 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">MEDIUM CONFIDENCE</span>;
      case 'LOW': return <span className="bg-red-900/50 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">LOW CONFIDENCE</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-gray-900 dark:text-white">
          AI Affordability Assistant
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Ask questions about your financial future based on your projected balance and recurring commitments.
        </p>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-brand-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">How can I help?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Try asking: "Can I afford a $500 vacation next month?" or "Will I have enough for rent on the 1st?"
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.type === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-sm' 
                      : msg.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-tl-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  {msg.reasoning && (
                    <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed"><strong className="text-gray-700 dark:text-gray-300">Reasoning:</strong> {msg.reasoning}</p>
                    </div>
                  )}
                  
                  {msg.confidence && (
                    <div className="mt-3 flex items-center justify-between">
                      {getConfidenceBadge(msg.confidence)}
                      {msg.isMock !== undefined && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${msg.isMock ? 'bg-amber-900/50 text-amber-400 border border-amber-500/30' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'}`} title={msg.isMock ? "Using fallback mock data because GEMINI_API_KEY is not set." : "Connected to Google Gemini API"}>
                          {msg.isMock ? 'MOCK MODE' : 'LIVE API'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 w-24 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          {quotaExceeded ? (
            <div className="text-center p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50">
              You've reached your daily AI query limit. Resets at {new Date(resetAt).toLocaleString()}.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your financial forecast..."
                disabled={mutation.isPending}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || mutation.isPending}
                className="absolute right-2 top-2 p-1.5 text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-brand-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
