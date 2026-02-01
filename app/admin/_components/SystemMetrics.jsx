/**
 * SystemMetrics Component
 * Displays system performance metrics with charts
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SystemMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('24h');

  const periods = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/metrics?period=${period}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
        setSummary(data.summary);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toFixed(2);
  };

  const getStatusColor = (value, type) => {
    if (type === 'cpu' || type === 'memory') {
      if (value > 80) return 'destructive';
      if (value > 60) return 'warning';
      return 'success';
    }
    if (type === 'response') {
      if (value > 1000) return 'destructive';
      if (value > 500) return 'warning';
      return 'success';
    }
    return 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Metrics</CardTitle>
          <div className="flex gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Avg Response Time"
              value={`${formatNumber(summary.avgResponseTime)}ms`}
              status={getStatusColor(summary.avgResponseTime, 'response')}
            />
            <MetricCard
              title="Avg CPU Usage"
              value={`${formatNumber(summary.avgCpuUsage)}%`}
              status={getStatusColor(summary.avgCpuUsage, 'cpu')}
            />
            <MetricCard
              title="Avg Memory Usage"
              value={`${formatNumber(summary.avgMemoryUsage)}%`}
              status={getStatusColor(summary.avgMemoryUsage, 'memory')}
            />
            <MetricCard
              title="Total Requests"
              value={summary.totalRequests}
              status="default"
            />
          </div>
        )}

        {metrics.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Recent Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Timestamp</th>
                    <th className="text-left py-2 px-3">Response Time</th>
                    <th className="text-left py-2 px-3">CPU</th>
                    <th className="text-left py-2 px-3">Memory</th>
                    <th className="text-left py-2 px-3">Requests</th>
                    <th className="text-left py-2 px-3">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(-10).reverse().map((metric) => (
                    <tr key={metric.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {new Date(metric.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">
                        {formatNumber(metric.response_time)}ms
                      </td>
                      <td className="py-2 px-3">
                        {formatNumber(metric.cpu_usage)}%
                      </td>
                      <td className="py-2 px-3">
                        {formatNumber(metric.memory_usage)}%
                      </td>
                      <td className="py-2 px-3">
                        {metric.requests || 0}
                      </td>
                      <td className="py-2 px-3">
                        {metric.errors || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No metrics available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, status }) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <Badge className={statusColors[status] || statusColors.default}>
          {status}
        </Badge>
      </div>
    </div>
  );
}
