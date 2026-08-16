import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import VaultModal from '../components/VaultModal';
import { LayoutDashboard, Image, Video, FileText } from 'lucide-react';

const Layout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <VaultModal />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full w-full relative">
        <Navbar onSearch={setSearchQuery} />
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          <Outlet context={{ searchQuery }} />
        </main>
        
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 pb-safe z-50">
          <NavLink to="/" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </NavLink>
          <NavLink to="/images" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Image className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Images</span>
          </NavLink>
          <NavLink to="/videos" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Video className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Videos</span>
          </NavLink>
          <NavLink to="/documents" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Docs</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Layout;

