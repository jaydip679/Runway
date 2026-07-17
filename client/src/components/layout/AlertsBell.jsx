import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const fetchUnreadAlerts = async () => {
  const res = await axios.get('/api/v1/alerts?isRead=false&limit=5', { withCredentials: true });
  return res.data.data;
};

const markAsRead = async (id) => {
  const res = await axios.patch(`/api/v1/alerts/${id}/read`, {}, { withCredentials: true });
  return res.data;
};

const getExportUrl = async (documentId) => {
  const res = await axios.get(`/api/v1/export/download/${documentId}`, { withCredentials: true });
  return res.data.data.secureUrl;
};

const AlertsBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', 'unread'],
    queryFn: fetchUnreadAlerts,
    refetchInterval: 30000, // Check every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAlertClick = async (alert) => {
    markReadMutation.mutate(alert.id);
    setIsOpen(false);

    if (alert.type === 'EXPORT_READY' && alert.metadata?.documentId) {
      try {
        const url = await getExportUrl(alert.metadata.documentId);
        window.open(url, '_blank');
      } catch (err) {
        console.error('Failed to get export URL', err);
      }
      return;
    }

    // Route based on related entity
    if (alert.relatedEntityType === 'RECURRING_COMMITMENT') {
      navigate('/recurring');
    } else if (alert.relatedEntityType === 'FORECAST') {
      navigate('/forecast');
    } else {
      navigate('/alerts');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'WARNING': return 'bg-amber-500';
      case 'INFO': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[9px] items-center justify-center font-bold text-white">
              {alerts.length}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {alerts.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{alerts.length} unread</span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                You're all caught up!
              </div>
            ) : (
              alerts.map(alert => (
                <div 
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className="p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 cursor-pointer transition-colors flex gap-3"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getSeverityColor(alert.severity)}`} />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-snug">{alert.message}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/alerts');
              }}
              className="w-full text-center text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 py-1.5 transition-colors"
            >
              View all alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsBell;
