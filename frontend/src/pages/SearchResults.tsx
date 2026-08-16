import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Image as ImageIcon, Video, Lock, ShieldCheck, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { decryptBlob } from '../utils/crypto';

const SearchResults = () => {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>() || { searchQuery: '' };
  const { currentUser, vaultKey } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = (category: string) => {
    switch (category) {
      case 'images': return <ImageIcon className="w-8 h-8 text-emerald-500" />;
      case 'videos': return <Video className="w-8 h-8 text-purple-500" />;
      default: return <FileText className="w-8 h-8 text-orange-500" />;
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  };

  const handlePreview = async (assetId: string, originalFileName: string, originalMimeType: string) => {
    if (!currentUser || !vaultKey) return;
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`<html style="background:#111;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><body><h2>Decrypting file securely...</h2></body></html>`);
    }
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_BASE_URL}/api/assets/download/${assetId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob',
      });
      // Decrypt downloaded file in browser
      const decryptedBlob = await decryptBlob(response.data, vaultKey, originalMimeType || 'application/octet-stream');
      const fileURL = URL.createObjectURL(decryptedBlob);
      const contentType = originalMimeType || 'application/octet-stream';
      if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
        if (newTab) newTab.location.href = fileURL;
      } else if (contentType.startsWith('video/')) {
        if (newTab) newTab.document.body.innerHTML = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#111;"><video src="${fileURL}" controls autoplay style="max-width:90%;max-height:80%;border-radius:8px;"></video></div>`;
      } else {
        if (newTab) newTab.close();
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
    } catch (error) {
      if (newTab) newTab.document.body.innerHTML = '<h2 style="color:#ef4444;">Failed to decrypt or download file.</h2>';
    }
  };

  useEffect(() => {
    if (!currentUser || !searchQuery || searchQuery.trim() === '') {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Search Results
        </h1>
        {searchQuery && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Showing results for: <span className="font-medium text-blue-600 dark:text-blue-400">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {!searchQuery || searchQuery.trim() === '' ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Start typing to search</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Search across filenames, AI tags, and document text.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Try a different keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((asset) => (
            <div key={asset.assetId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group">
              <div 
                className="h-48 bg-gray-100 dark:bg-gray-900 rounded-t-xl overflow-hidden flex items-center justify-center relative cursor-pointer"
                onClick={() => handlePreview(asset.assetId, asset.originalFileName, asset.fileType)}
              >
                {getIcon(asset.category)}
                {asset.encryptedAtRest && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-emerald-500/90 text-white text-xs px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex md:hidden group-hover:flex items-center justify-center transition-all z-0 pointer-events-none">
                  <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm shadow-lg pointer-events-auto">
                    Preview
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={asset.originalFileName}>
                  {asset.originalFileName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(asset.uploadDate)}</p>
                {asset.encryptionAlgo && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {asset.encryptionAlgo}
                  </p>
                )}
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 capitalize">
                    {asset.category}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {asset.tags && asset.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
