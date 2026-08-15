import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Upload, Download, Trash, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';
import { auth } from '../config/firebase';

interface ActivityLog {
  activityId: string;
  assetId: string;
  userId: string;
  fileName: string;
  action: string;
  timestamp: string;
}

const Activity = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const response = await axios.get('http://localhost:8080/api/activity', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const getIconForAction = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('upload')) return { icon: Upload, color: 'text-blue-500' };
    if (act.includes('download')) return { icon: Download, color: 'text-emerald-500' };
    if (act.includes('delete')) return { icon: Trash, color: 'text-red-500' };
    return { icon: RefreshCw, color: 'text-purple-500' };
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <ActivityIcon className="w-6 h-6 mr-2 text-blue-600" />
          Activity History
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No recent activity found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((log) => {
              const { icon: ActionIcon, color } = getIconForAction(log.action);
              return (
                <div key={log.activityId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-900 ${color}`}>
                      <ActionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        You performed a <span className="font-bold">{log.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Asset: {log.fileName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(log.timestamp)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
