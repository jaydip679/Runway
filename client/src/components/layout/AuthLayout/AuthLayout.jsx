import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) => {
  return (
    <div className="auth-container">
      {/* Decorative background blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      
      <div className="glass-panel auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">▲</span> Runway
          </Link>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        
        <div className="auth-body">
          {children}
        </div>
        
        {(footerText || footerLinkText) && (
          <div className="auth-footer">
            <p>
              {footerText}{' '}
              {footerLinkText && footerLinkTo && (
                <Link to={footerLinkTo} className="auth-link">
                  {footerLinkText}
                </Link>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
