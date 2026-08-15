import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, FileText, Download, Filter, X, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  creationTimestamp: number;
  lastSignInTimestamp: number;
}

interface AssetData {
  assetId: string;
  originalFileName: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  category: string;
  fileType: string;
}

const AdminDashboard = () => {
  const { currentUser, isAdmin, vaultKey } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'files'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && currentUser) {
      fetchData();
    }
  }, [isAdmin, currentUser, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      if (activeTab === 'users') {
        const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } else {
        const response = await axios.get(`${API_BASE_URL}/api/admin/assets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssets(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEncrypted = async (assetId: string, originalFileName: string, uploadedBy: string, fileType: string) => {
    if (uploadedBy === currentUser?.uid) {
      // The admin is trying to view their OWN file. Allow normal decryption.
      if (!vaultKey) {
        alert("Your vault is locked. Please refresh and unlock your Vault to view your own files.");
        return;
      }
      
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`
          <html style="background: #111; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <body><h2>Decrypting your file securely...</h2></body>
          </html>
        `);
      }

      try {
        const { decryptBlob } = await import('../utils/crypto');
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/assets/download/${assetId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          responseType: 'blob'
        });
        
        const decryptedBlob = await decryptBlob(response.data, vaultKey, fileType || 'application/octet-stream');
        const fileURL = URL.createObjectURL(decryptedBlob);
        
        let filename = originalFileName || 'downloaded_file';
        const contentType = fileType || 'application/octet-stream';

        if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
          if (newTab) newTab.location.href = fileURL;
        } else if (contentType.startsWith('video/')) {
          if (newTab) {
            newTab.document.body.innerHTML = `
              <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #111;">
                <video src="${fileURL}" controls autoplay style="max-width: 90%; max-height: 80%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></video>
                <a href="${fileURL}" download="${filename}" style="margin-top: 20px; color: #3b82f6; text-decoration: none; font-family: sans-serif;">Download Video</a>
              </div>
            `;
          }
        } else {
          if (newTab) newTab.close();
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
      } catch (error) {
        console.error('Failed to decrypt your asset:', error);
        if (newTab) newTab.document.body.innerHTML = '<h2 style="color: #ef4444;">Failed to decrypt your file.</h2>';
        alert('Could not preview this file.');
      }
      return;
    }

    // Otherwise, this is another user's file. The admin can only download the encrypted blob.
    alert("SECURITY NOTICE: You are downloading another user's raw encrypted blob. Because of Zero-Knowledge encryption, you as an admin do not have their Vault Passphrase and cannot view the contents of this file.");
    
    try {
      const token = await currentUser?.getIdToken();
      const response = await axios.get(`${API_BASE_URL}/api/assets/download/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/octet-stream' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = originalFileName + ".enc";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
    } catch (error) {
      console.error('Failed to download asset:', error);
      alert('Could not download this file.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isAdmin) {
    return <div className="p-8"><h1 className="text-2xl font-bold text-red-600">Access Denied. Admins only.</h1></div>;
  }

  const displayedAssets = selectedUserFilter 
    ? assets.filter(a => a.uploadedBy === selectedUserFilter) 
    : assets;

  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Admin Dashboard</h1>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users className="w-4 h-4 mr-2" />
          All Users
        </button>
        <button
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'files' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('files')}
        >
          <FileText className="w-4 h-4 mr-2" />
          All Files
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : activeTab === 'users' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">UID</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{u.email}</td>
                  <td className="p-4 text-gray-500 text-sm font-mono">{u.uid}</td>
                  <td className="p-4 text-gray-500">{u.creationTimestamp ? new Date(u.creationTimestamp).toLocaleDateString() : 'Unknown'}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedUserFilter(u.uid);
                        setActiveTab('files');
                      }}
                      className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center justify-end ml-auto"
                    >
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      View Files
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            {selectedUserFilter && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 flex items-center justify-between border-b border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                  <Filter className="w-4 h-4 mr-2" />
                  Showing files specifically for user ID: <span className="font-mono ml-2 bg-indigo-100 dark:bg-indigo-800/50 px-2 py-0.5 rounded">{selectedUserFilter}</span>
                </div>
                <button 
                  onClick={() => setSelectedUserFilter(null)}
                  className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear Filter
                </button>
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">File Name</th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Uploaded By</th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Size</th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAssets.map(a => {
                  const isOwnFile = a.uploadedBy === currentUser?.uid;
                  return (
                    <tr key={a.assetId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{a.originalFileName}</td>
                      <td className="p-4 text-gray-500 text-sm font-mono truncate max-w-xs" title={a.uploadedBy}>{a.uploadedBy}</td>
                      <td className="p-4 text-gray-500">{formatBytes(a.fileSize)}</td>
                      <td className="p-4 text-gray-500">{a.uploadDate ? new Date(a.uploadDate).toLocaleDateString() : 'Unknown'}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDownloadEncrypted(a.assetId, a.originalFileName, a.uploadedBy, a.fileType)} 
                          className={`p-2 rounded-lg transition-colors ${isOwnFile ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50' : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/50'}`}
                          title={isOwnFile ? "View Your File" : "Download Encrypted Blob"}
                        >
                          {isOwnFile ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {displayedAssets.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No files found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
