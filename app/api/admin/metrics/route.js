/**
 * Admin API - System Metrics
 * GET /api/admin/metrics - Fetch system metrics
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';

    // Calculate time range
    const now = new Date();
    let startTime;
    
    switch (period) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    // Fetch metrics from database
    const { data: metrics, error } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      total: metrics?.length || 0,
      avgResponseTime: metrics?.reduce((sum, m) => sum + (m.response_time || 0), 0) / (metrics?.length || 1),
      avgCpuUsage: metrics?.reduce((sum, m) => sum + (m.cpu_usage || 0), 0) / (metrics?.length || 1),
      avgMemoryUsage: metrics?.reduce((sum, m) => sum + (m.memory_usage || 0), 0) / (metrics?.length || 1),
      totalRequests: metrics?.reduce((sum, m) => sum + (m.requests || 0), 0) || 0,
      totalErrors: metrics?.reduce((sum, m) => sum + (m.errors || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      metrics: metrics || [],
      summary,
    });
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
