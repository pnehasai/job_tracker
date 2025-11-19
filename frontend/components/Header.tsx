
import React from 'react';
import { User, Admin, Notification } from '../types';
import BriefcaseIcon from './icons/BriefcaseIcon';
import NotificationBell from './NotificationBell';
import { mockApiService } from '../services/mockApiService';

interface HeaderProps {
  user: User | null;
  admin: Admin | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, admin, onLogout }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    if (user) {
      mockApiService.getUserNotifications(user.userID).then(setNotifications);
    }
  }, [user]);

  const loggedInUser = user || admin;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-indigo-500" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">JobTracker</h1>
          </div>
          {loggedInUser && (
            <div className="flex items-center space-x-4">
              {user && <NotificationBell notifications={notifications} />}
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{loggedInUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{loggedInUser.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
