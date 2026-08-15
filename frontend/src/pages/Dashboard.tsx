import React, { useState, useEffect } from 'react';
import { Image, Video, FileText, UploadCloud, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface DashboardData {
  totalAssets: number;
  imagesCount: number;
  videosCount: number;
  documentsCount: number;
  recentUploads: any[];
  recentActivity: any[];
}

const categoryIcon: Record<string, React.ReactNode> = {
  images: <Image className="w-4 h-4 text-emerald-500" />,
  videos: <Video className="w-4 h-4 text-purple-500" />,
  documents: <FileText className="w-4 h-4 text-orange-500" />,
};

const formatDate = (dateObj: any) => {
  if (!dateObj) return 'Unknown date';
  const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
  return isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        const token = await currentUser.getIdToken();
        const response = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [currentUser]);

  const stats = [
    { label: 'Total Assets', value: data?.totalAssets ?? 0, icon: UploadCloud, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Images', value: data?.imagesCount ?? 0, icon: Image, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Videos', value: data?.videosCount ?? 0, icon: Video, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Documents', value: data?.documentsCount ?? 0, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              {isLoading ? (
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Uploads */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Uploads</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.recentUploads && data.recentUploads.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.recentUploads.map((asset) => (
                <div key={asset.assetId} className="flex items-center space-x-3 py-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {categoryIcon[asset.category] ?? <FileText className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.originalFileName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(asset.uploadDate)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 capitalize">
                    {asset.category}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <UploadCloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recent uploads found.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" /> Recent Activity
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.action || 'File uploaded'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{log.fileName || log.assetId}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No activity recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

