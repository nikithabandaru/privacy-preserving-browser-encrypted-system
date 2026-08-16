import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Video, MoreVertical, Search, Filter, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { encryptFile, decryptBlob } from '../utils/crypto';

const Assets = ({ type }: { type: 'images' | 'videos' | 'documents' }) => {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, vaultKey } = useAuth();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>() || { searchQuery: '' };
  
  const getIcon = () => {
    switch (type) {
      case 'images': return <ImageIcon className="w-8 h-8 text-emerald-500" />;
      case 'videos': return <Video className="w-8 h-8 text-purple-500" />;
      case 'documents': return <FileText className="w-8 h-8 text-orange-500" />;
    }
  };

  const fetchAssets = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const token = await currentUser.getIdToken();
      let url = `${API_BASE_URL}/api/assets?category=${type}`;
      if (searchQuery && searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add a slight debounce for search
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [type, currentUser, searchQuery]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !vaultKey) return;

    try {
      setIsUploading(true);
      const token = await currentUser.getIdToken();

      // Encrypt the file on client side using the vault key
      const encryptedBlob = await encryptFile(file, vaultKey);
      const encryptedFile = new File([encryptedBlob], file.name, { type: 'application/octet-stream' });

      const formData = new FormData();
      formData.append('file', encryptedFile);
      formData.append('originalType', file.type);

      await axios.post(`${API_BASE_URL}/api/assets/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('File encrypted locally and uploaded securely!');
      fetchAssets();
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

  const handlePreview = async (assetId: string, originalFileName: string, originalMimeType: string) => {
    if (!currentUser || !vaultKey) return;
    
    // Open tab IMMEDIATELY on click to bypass popup blockers
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`
        <html style="background: #111; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <body><h2>Decrypting file securely...</h2></body>
        </html>
      `);
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE_URL}/api/assets/download/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Decrypt the downloaded file in the browser
      const decryptedBlob = await decryptBlob(response.data, vaultKey, originalMimeType || 'application/octet-stream');
      const fileURL = URL.createObjectURL(decryptedBlob);
      
      // Extract filename
      let filename = originalFileName || 'downloaded_file';
      const contentType = originalMimeType || 'application/octet-stream';

      if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
        if (newTab) {
          // Preview in the new tab we opened earlier
          newTab.location.href = fileURL;
        }
      } else if (contentType.startsWith('video/')) {
        if (newTab) {
          // Render video directly in the tab
          newTab.document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #111;">
              <video src="${fileURL}" controls autoplay style="max-width: 90%; max-height: 80%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></video>
              <a href="${fileURL}" download="${filename}" style="margin-top: 20px; color: #3b82f6; text-decoration: none; font-family: sans-serif;">Download Video</a>
            </div>
          `;
        }
      } else {
        // Close the tab and force download for unsupported types (like .docx)
        if (newTab) newTab.close();
        
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000); // keep URL alive for a bit
      
    } catch (error: any) {
      console.error('Failed to preview asset:', error);
      if (newTab) {
        let errorMessage = "Unknown error occurred";
        if (error?.response?.data instanceof Blob) {
           errorMessage = "Server returned an error blob (likely file not found in MongoDB)";
        } else if (error?.response?.data?.error) {
           errorMessage = error.response.data.error;
        } else if (error?.message) {
           errorMessage = error.message;
        } else if (typeof error === 'object') {
           errorMessage = "DOMException: Decryption strictly failed (Wrong Vault Passphrase entered)";
        }

        newTab.document.body.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#111; color:white; font-family:sans-serif;">
            <h2 style="color: #ef4444;">Failed to decrypt or download file.</h2>
            <p style="color: #9ca3af; margin-top: 10px; max-width: 600px; text-align: center;">Error details: ${errorMessage}</p>
            <p style="color: #9ca3af; margin-top: 10px; max-width: 600px; text-align: center; font-size: 14px;">If this is a decryption error, make sure you are using the exact same Vault Passphrase that was used to upload this file.</p>
          </div>
        `;
      }
      alert('Could not preview this file: ' + (error?.message || ""));
    }
  };

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (assetId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`${API_BASE_URL}/api/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file.');
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return 'Unknown date';
    // Handle Firestore Timestamp object or direct string/Date
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{type}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and organize your {type}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept={type === 'images' ? 'image/*' : type === 'videos' ? 'video/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'} 
          />
          
          <button 
            onClick={handleUploadClick} 
            disabled={isUploading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{isUploading ? 'Uploading...' : `Upload ${type}`}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            {getIcon()}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No {type} found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Get started by uploading a new file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {assets.map((asset) => (
            <div key={asset.assetId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-visible hover:shadow-lg transition-shadow group">
              <div 
                className="h-48 bg-gray-100 dark:bg-gray-900 rounded-t-xl overflow-hidden flex items-center justify-center relative cursor-pointer"
                onClick={() => handlePreview(asset.assetId, asset.originalFileName, asset.fileType)}
              >
                {getIcon()}
                {asset.encryptedAtRest && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-emerald-500/90 text-white text-xs px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 hidden md:group-hover:flex items-center justify-center transition-all z-0 pointer-events-none">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm shadow-lg pointer-events-auto">
                    Preview
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between relative">
                  <div className="w-full pr-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-full" title={asset.originalFileName}>
                      {asset.originalFileName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(asset.uploadDate)}
                    </p>
                    {asset.encryptionAlgo && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {asset.encryptionAlgo}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === asset.assetId ? null : asset.assetId);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mr-2 p-1"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenuId === asset.assetId && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                        <button 
                          onClick={() => alert(`Details:\\nFile: ${asset.originalFileName}\\nSize: ${asset.fileSize} bytes\\nType: ${asset.fileType}\\nStatus: ${asset.status}`)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handlePreview(asset.assetId, asset.originalFileName, asset.fileType)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Download
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.assetId)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asset.tags && asset.tags.length > 0 ? (
                    asset.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-md font-medium">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assets;
