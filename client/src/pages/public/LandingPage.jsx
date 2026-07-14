import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Leaf, Sparkles, TrendingUp, Bot, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white flex flex-col font-sans relative overflow-hidden selection:bg-brand-500/30">
      
      {/* --- Rich Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white dark:from-slate-900 dark:via-[#030712] dark:to-black opacity-80"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 70%)'
        }}></div>
        <div className="absolute inset-0 dark:block hidden" style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 70%)'
        }}></div>

        {/* Animated glowing orbs */}
        <div className="absolute top-[-15%] left-[20%] w-[40%] h-[40%] bg-brand-500/10 dark:bg-brand-600/20 blur-[140px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-[10%] right-[-10%] w-[35%] h-[35%] bg-finance-500/10 dark:bg-finance-600/20 blur-[130px] rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      </div>

      {/* --- Navigation --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12 backdrop-blur-md border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-[#030712]/50 sticky top-0">
        <div className="flex items-center gap-2 font-bold text-xl font-heading tracking-tight select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-finance-500 flex items-center justify-center text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="text-gray-900 dark:text-white">Runway</span>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/register')} 
            className="bg-brand-500 hover:bg-brand-400 text-white font-semibold px-5 py-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] border-none"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* --- Main Hero Section --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-24 md:pt-32 pb-16 px-4 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-8 backdrop-blur-md shadow-md dark:shadow-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
          </span>
          <span className="text-sm font-medium tracking-wide text-gray-700 dark:text-brand-100">Runway AI Forecasting is Live</span>
        </div>
        
        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight font-heading">
          Know your financial future <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-finance-300 to-brand-600">
            before it happens.
          </span>
        </h1>
        
        {/* Sub-headline */}
        <p className="text-lg md:text-2xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
          Runway automatically detects recurring bills, models your income, and uses AI to project your exact bank balance 30 days out. 
          <strong className="text-gray-900 dark:text-slate-200 font-medium"> Stop guessing, start knowing.</strong>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto z-20">
          <button 
            onClick={() => navigate('/register')}
            className="group relative px-8 py-4 bg-brand-500 text-white font-semibold rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative text-lg">Start Forecasting Free</span>
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white dark:bg-white/5 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 text-lg shadow-sm backdrop-blur-sm"
          >
            Sign In to Dashboard
          </button>
        </div>

        {/* Abstract Dashboard Mockup */}
        <div className="w-full max-w-4xl mx-auto mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#030712] via-transparent to-transparent z-10 top-[50%]"></div>
          <div className="relative rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700/50 backdrop-blur-xl p-4 shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-500">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-700/50 pb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700"></div>
            </div>
            {/* Mock Chart Area */}
            <div className="h-48 md:h-64 w-full flex items-end justify-between px-2 gap-1.5 opacity-80">
              {[40, 50, 45, 60, 75, 65, 80, 95, 85, 100, 90, 110, 105, 120, 115, 130].map((height, i) => (
                <div key={i} className="w-full bg-gradient-to-t from-brand-200 dark:from-brand-500/20 to-brand-400/80 rounded-t-sm transition-all duration-500 hover:opacity-100" style={{ height: `${height}%` }}></div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* --- Feature Grid --- */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to <span className="text-brand-500">take control.</span></h2>
          <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">A complete suite of intelligent financial tools built right in.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          {/* Card 1 */}
          <div className="group bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md hover:-translate-y-2 shadow-sm hover:shadow-[0_10px_40px_rgba(14,165,233,0.1)] dark:hover:shadow-[0_10px_40px_rgba(14,165,233,0.15)] transition-all duration-300 hover:border-brand-300 dark:hover:border-brand-500/30">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-gradient-to-br dark:from-brand-500/10 dark:to-brand-500/5 flex items-center justify-center mb-6 border border-brand-100 dark:border-brand-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-brand-500 dark:text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3 text-gray-900 dark:text-white">Automated Discovery</h3>
            <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">Instantly imports your transactions and automatically detects your hidden subscriptions and recurring bills with zero manual entry.</p>
          </div>
          
          {/* Card 2 */}
          <div className="group bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md hover:-translate-y-2 shadow-sm hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] dark:hover:shadow-[0_10px_40px_rgba(16,185,129,0.15)] transition-all duration-300 hover:border-finance-300 dark:hover:border-finance-500/30">
            <div className="w-14 h-14 rounded-2xl bg-finance-50 dark:bg-gradient-to-br dark:from-finance-500/10 dark:to-finance-500/5 flex items-center justify-center mb-6 border border-finance-100 dark:border-finance-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-finance-500 dark:text-finance-400" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3 text-gray-900 dark:text-white">30-Day Forecast</h3>
            <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">Projects your exact daily balance onto a beautiful chart. Instantly know if you can safely afford upcoming expenses before they hit.</p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md hover:-translate-y-2 shadow-sm hover:shadow-[0_10px_40px_rgba(168,85,247,0.1)] dark:hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)] transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-500/30">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/10 dark:to-purple-500/5 flex items-center justify-center mb-6 border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
              <Bot className="w-7 h-7 text-purple-500 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3 text-gray-900 dark:text-white">Gemini AI Assistant</h3>
            <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">Ask natural questions like "Can I afford a $500 vacation next week?" and get precise, data-backed answers powered by Google Gemini.</p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-white/5 py-8 bg-gray-50 dark:bg-[#030712]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold font-heading text-sm text-gray-700 dark:text-slate-300">
            <Leaf className="text-brand-500 w-4 h-4" />
            Runway
          </div>
          <p className="text-gray-500 dark:text-slate-500 text-xs">© 2026 Runway Financial. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage;
