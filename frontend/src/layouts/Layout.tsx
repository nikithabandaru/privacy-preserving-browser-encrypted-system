import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import VaultModal from '../components/VaultModal';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <VaultModal />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full w-full">
        <Navbar onSearch={setSearchQuery} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;

