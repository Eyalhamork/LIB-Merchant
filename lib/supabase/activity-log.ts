// lib/supabase/activity-log.ts
import { createClient } from '@/lib/supabase/client';
import type { ActivityLog, ActivityType } from '@/types';

/**
 * Log an activity
 */
export async function logActivity(
  activityType: ActivityType,
  description: string,
  options?: {
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's profile to get shop_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Insert activity log
    const { error } = await supabase.from('activity_logs').insert({
      shop_id: profile.shop_id,
      user_id: user.id,
      activity_type: activityType,
      description,
      reference_type: options?.referenceType,
      reference_id: options?.referenceId,
      metadata: options?.metadata || {},
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not block operations
  }
}

/**
 * Get activity logs for shop
 */
export async function getActivityLogs(options?: {
  limit?: number;
  activityTypes?: ActivityType[];
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supabase = createClient();

    // Get current user's shop
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Build query
    let query = supabase
      .from('activity_logs')
      .select(
        `
        *,
        profiles!activity_logs_user_id_fkey(name)
      `
      )
      .eq('shop_id', profile.shop_id)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.activityTypes && options.activityTypes.length > 0) {
      query = query.in('activity_type', options.activityTypes);
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as ActivityLog[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Get recent activities (last 24 hours)
 */
export async function getRecentActivities(limit: number = 20) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return getActivityLogs({
    limit,
    startDate: oneDayAgo.toISOString(),
  });
}

/**
 * Get user-specific activities
 */
export async function getUserActivities(userId: string, limit: number = 50) {
  return getActivityLogs({
    userId,
    limit,
  });
}

/**
 * Search activity logs
 */
export async function searchActivityLogs(
  searchTerm: string,
  options?: {
    limit?: number;
    activityTypes?: ActivityType[];
  }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    let query = supabase
      .from('activity_logs')
      .select(
        `
        *,
        profiles!activity_logs_user_id_fkey(name)
      `
      )
      .eq('shop_id', profile.shop_id)
      .ilike('description', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.activityTypes && options.activityTypes.length > 0) {
      query = query.in('activity_type', options.activityTypes);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as ActivityLog[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Delete old activity logs (cleanup)
 */
export async function cleanupOldActivityLogs(daysToKeep: number = 90) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'owner') {
      throw new Error('Only owners can cleanup activity logs');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('shop_id', profile.shop_id)
      .lt('created_at', cutoffDate.toISOString());

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}
