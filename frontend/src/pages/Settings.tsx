import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Bell, Palette } from 'lucide-react';

const Settings = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Profile Information
          </h2>
          <div className="mt-6 flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-400">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                currentUser?.displayName?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <input 
                  type="text" 
                  disabled
                  value={currentUser?.displayName || ''} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm opacity-70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <input 
                  type="email" 
                  disabled
                  value={currentUser?.email || ''} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm opacity-70"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Palette className="w-5 h-5 mr-2 text-emerald-600" />
            Appearance
          </h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">System preference is applied automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
