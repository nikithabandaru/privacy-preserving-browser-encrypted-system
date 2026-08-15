import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';

const Navbar = ({ onSearch }: { onSearch?: (q: string) => void }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSearchChange = (value: string) => {
    if (onSearch) onSearch(value);
    // Navigate to search page if not already there
    if (value.trim() !== '' && location.pathname !== '/search') {
      navigate('/search');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setIsUploading(true);
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      await axios.post('http://localhost:8080/api/assets/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('File uploaded successfully from Navbar!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search by filename, AI tags, or OCR text..."
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        />
        
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
        </button>
        
        <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-700 pl-4">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {currentUser?.displayName || 'User'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser?.email}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
