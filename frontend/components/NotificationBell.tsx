
import React, { useState, useRef, useEffect } from 'react';
import { Notification } from '../types';
import BellIcon from './icons/BellIcon';

interface NotificationBellProps {
  notifications: Notification[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.length; // Simple count for now

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-10">
          <div className="p-3 font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 dark:text-gray-400">No new notifications</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.notificationID} className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{notif.type}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notif.companyName} - {notif.roleTitle}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{notif.date} at {notif.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
