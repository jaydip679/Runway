import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import Button from '../../components/ui/Button/Button';

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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          AI Affordability Assistant
        </h1>
        <p className="text-gray-400 mt-2">
          Ask questions about your financial future based on your projected balance and recurring commitments.
        </p>
      </div>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <svg className="w-16 h-16 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">How can I help?</h3>
              <p className="text-sm text-gray-300 max-w-sm">
                Try asking: "Can I afford a $500 vacation next month?" or "Will I have enough for rent on the 1st?"
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.type === 'user' 
                      ? 'bg-emerald-600/20 border border-emerald-500/30 text-white rounded-tr-sm' 
                      : msg.type === 'error'
                        ? 'bg-red-900/20 border border-red-500/30 text-red-200 rounded-tl-sm'
                        : 'bg-slate-800 border border-slate-700 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  
                  {msg.reasoning && (
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                      <p className="text-xs text-gray-400 leading-relaxed"><strong className="text-gray-300">Reasoning:</strong> {msg.reasoning}</p>
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
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 w-24 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          {quotaExceeded ? (
            <div className="text-center p-3 text-sm text-red-400 bg-red-900/10 rounded-lg border border-red-900/50">
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || mutation.isPending}
                className="absolute right-2 top-2 p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-emerald-400/10 disabled:hover:text-emerald-400"
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
