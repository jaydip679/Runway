import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AlertsBell from './AlertsBell';
import { 
  LayoutDashboard, Users, CreditCard, PieChart, 
  Settings, LogOut, Menu, X, Leaf, Sun, Moon,
  ListOrdered, FileText, BarChart2
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', path: '/dashboard/accounts', icon: CreditCard },
    { name: 'Categories', path: '/dashboard/categories', icon: ListOrdered },
    { name: 'Transactions', path: '/dashboard/transactions', icon: PieChart },
  ];

  const adminItems = user?.role === 'ADMIN' ? [
    { name: 'Users', path: '/dashboard/admin/users', icon: Users },
    { name: 'CSV Imports', path: '/dashboard/admin/csv-imports', icon: FileText },
    { name: 'Metrics', path: '/dashboard/admin/metrics', icon: BarChart2 },
  ] : [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0b] overflow-hidden transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
          transition-all duration-300 ease-in-out z-20 shrink-0
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden text-brand-600 dark:text-brand-400">
            <Leaf className="w-8 h-8 shrink-0" />
            <span className={`font-heading font-bold text-xl whitespace-nowrap transition-opacity duration-300 ${!isSidebarOpen && 'opacity-0 hidden'}`}>
              Runway
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.path === '/dashboard' 
              ? location.pathname === '/dashboard' 
              : location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap
                  ${isActive 
                    ? 'bg-finance-50 text-finance-700 dark:bg-finance-900/30 dark:text-finance-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
                title={!isSidebarOpen ? item.name : ''}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-finance-500' : ''}`} />
                <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>{item.name}</span>
              </Link>
            )
          })}

          {adminItems.length > 0 && (
            <>
              <div className={`mt-6 mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${!isSidebarOpen && 'hidden'}`}>Admin</div>
              {adminItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap
                      ${isActive 
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                    title={!isSidebarOpen ? item.name : ''}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-500' : ''}`} />
                    <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>{item.name}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={!isSidebarOpen ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarOpen ? <X className="w-5 h-5 shrink-0" /> : <Menu className="w-5 h-5 shrink-0" />}
            <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>Collapse</span>
          </button>
          
          <Link 
            to="/dashboard/profile" 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={!isSidebarOpen ? 'Settings' : ''}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>Settings</span>
          </Link>
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
            title={!isSidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-heading font-semibold text-gray-800 dark:text-white capitalize hidden sm:block">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <AlertsBell />
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default MainLayout;
