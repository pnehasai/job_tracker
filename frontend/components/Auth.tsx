// frontend/src/components/Auth.tsx
import React, { useState } from 'react';
import { mockApiService } from '../services/mockApiService';
import type { User, Admin } from '../types';

interface AuthProps {
  onUserLogin: (user: User) => void;
  onAdminLogin: (admin: Admin) => void;
}

const Auth: React.FC<AuthProps> = ({ onUserLogin, onAdminLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const showErrorFrom = (err: any) => {
    // err might be a structured object from mockApiService.fetchJson
    if (!err) return 'An error occurred';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (err.body && typeof err.body === 'object') {
      return err.body.error || err.body.message || JSON.stringify(err.body);
    }
    return 'An error occurred';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const resp = await mockApiService.registerUser(name, email, contact, password);
        // server returns { user: {...} } or just { user } depending on endpoint
        const newUser = resp?.user || resp;
        if (!newUser) throw { message: 'Registration failed' };
        
        onUserLogin(newUser);
        return;
      }

      if (isAdminLogin) {
        const resp = await mockApiService.loginAdmin(email, password);
        const admin = resp?.admin || resp;
        if (!admin) throw resp || { message: 'Invalid admin credentials' };
        onAdminLogin(admin);
        return;
      }

      // normal user login
      const resp = await mockApiService.loginUser(email, password);
      const user = resp?.user || resp;
      if (!user) throw resp || { message: 'Invalid user credentials' };
      onUserLogin(user);
            localStorage.setItem('user', JSON.stringify(user));

    } catch (err: any) {
      console.error('Auth error', err);
      setError(showErrorFrom(err));
    } finally {
      setLoading(false);
    }
  };

  const formTitle = isRegister ? 'Register' : isAdminLogin ? 'Admin Login' : 'User Login';

  return (
    <div className="flex items-center justify-center pt-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">{formTitle}</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Info</label>
                <input type="text" value={contact} onChange={e => setContact(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
              {loading ? 'Processing...' : formTitle}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          {isRegister ? (
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={() => setIsRegister(false)} className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</button>
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No account?{' '}
              <button onClick={() => setIsRegister(true)} className="font-medium text-indigo-600 hover:text-indigo-500">Register</button>
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            or{' '}
            <button onClick={() => { setIsAdminLogin(!isAdminLogin); setIsRegister(false); }} className="font-medium text-indigo-600 hover:text-indigo-500">
              {isAdminLogin ? 'Login as User' : 'Login as Admin'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
