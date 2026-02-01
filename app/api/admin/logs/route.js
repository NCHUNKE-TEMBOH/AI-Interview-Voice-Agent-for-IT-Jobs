/**
 * Admin API - System Logs
 * GET /api/admin/logs - Fetch system logs
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
    const limit = parseInt(searchParams.get('limit')) || 100;
    const level = searchParams.get('level');

    // Build query
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by level if specified
    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
    });
  } catch (error) {
    console.error('Error in logs API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
