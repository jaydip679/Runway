import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertsBell from './AlertsBell';
import Button from '../ui/Button/Button';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <header className="glass-panel" style={{ 
        margin: '16px', 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '16px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700 }}>
          <span style={{ color: 'var(--primary)' }}>▲</span> Runway
        </div>
        
        <div className="flex items-center gap-4">
          <AlertsBell />
          <span className="text-slate-300 text-sm hidden md:inline-block">
            {user?.name || user?.email}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={() => window.location.href = '/profile'}>
              Profile
            </Button>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ padding: '0 32px 16px 32px', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <a href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
        <a href="/accounts" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Accounts</a>
        <a href="/categories" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Categories</a>
        <a href="/transactions" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Transactions</a>
        <a href="/recurring" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Recurring</a>
        <a href="/forecast" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Forecast</a>
        <a href="/ai" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>AI Assistant</a>
        {user?.role === 'ADMIN' && (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <a href="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Users</a>
            <a href="/admin/csv-imports" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>CSV Imports</a>
            <a href="/admin/metrics" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Metrics</a>
          </>
        )}
      </nav>

      {/* Main Content Area */}
      <main style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
