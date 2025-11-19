
import React, { useState, useEffect } from 'react';
import { User, Admin } from './types';
import { mockApiService } from './services/mockApiService';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Auth from './components/Auth';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user session
    const checkSession = async () => {
      // In a real app, you would verify a token here
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentAdmin(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  const renderContent = () => {
    if (currentUser) {
      return <UserDashboard user={currentUser} />;
    }
    if (currentAdmin) {
      return <AdminDashboard admin={currentAdmin} />;
    }
    return <Auth onUserLogin={setCurrentUser} onAdminLogin={setCurrentAdmin} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header 
        user={currentUser} 
        admin={currentAdmin} 
        onLogout={handleLogout} 
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
