/**
 * System Logs Component
 * View and filter system logs
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, error, warning, info

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">System Logs</h2>
          <p className="text-slate-400">
            {filteredLogs.length} entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'error' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setFilter('error')}
          >
            Errors
          </Button>
          <Button
            variant={filter === 'warning' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFilter('warning')}
          >
            Warnings
          </Button>
          <Button
            variant={filter === 'info' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('info')}
          >
            Info
          </Button>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading...</div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-8 bg-slate-800 border-slate-700">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">No logs found</p>
            <p className="text-sm">
              {filter === 'all'
                ? 'System logs will appear here'
                : `No ${filter} logs found`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card
              key={log.id}
              className="p-4 bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Badge className={getLevelColor(log.level)}>
                  {log.level.toUpperCase()}
                </Badge>
                <div className="flex-1">
                  <p className="text-white text-sm">{log.message}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-slate-500 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    {log.source && (
                      <span className="text-slate-500 text-xs">
                        Source: {log.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
