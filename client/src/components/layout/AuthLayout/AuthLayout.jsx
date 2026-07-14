import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-brand-600 dark:text-brand-400">
          <Leaf className="w-10 h-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-heading">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800">
          {children}
        </div>
        
        {(footerText || footerLinkText) && (
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">{footerText} </span>
            {footerLinkText && footerLinkTo && (
              <Link to={footerLinkTo} className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                {footerLinkText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
