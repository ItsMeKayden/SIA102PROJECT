import {
  supabase,
  handleSupabaseError,
  withTimeout,
} from '../../lib/supabase-client';
import type { Notification, NotificationInsert } from '../../types';

// Notification Service
// Handles all notification-related database operations :)

// Get all notifications
export const getAllNotifications = async (
  staffId?: string,
): Promise<{ data: Notification[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (staffId) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { data, error } = await withTimeout(query, 5000);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get unread notifications
export const getUnreadNotifications = async (
  staffId?: string,
): Promise<{ data: Notification[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (staffId) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { data, error } = await withTimeout(query, 5000);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Get notification count
export const getUnreadNotificationCount = async (
  staffId?: string,
): Promise<{ data: number; error: string | null }> => {
  try {
    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('is_read', false);

    if (staffId) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { count, error } = await withTimeout(query, 5000);

    if (error) throw error;

    return { data: count || 0, error: null };
  } catch (error) {
    return { data: 0, error: handleSupabaseError(error) };
  }
};

// Create notification
export const createNotification = async (
  notificationData: NotificationInsert,
): Promise<{ data: Notification | null; error: string | null }> => {
  try {
    const { data, error } = await withTimeout(
      supabase.from('notifications').insert(notificationData).select().single(),
      5000,
    );

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  id: string,
): Promise<{ data: Notification | null; error: string | null }> => {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single(),
      5000,
    );

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  staffId?: string,
): Promise<{ error: string | null }> => {
  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (staffId) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { error } = await withTimeout(query, 5000);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Delete notification
export const deleteNotification = async (
  id: string,
): Promise<{ error: string | null }> => {
  try {
    const { error } = await withTimeout(
      supabase.from('notifications').delete().eq('id', id),
      5000,
    );

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (
  staffId?: string,
): Promise<{ error: string | null }> => {
  try {
    let query = supabase.from('notifications').delete().eq('is_read', true);

    if (staffId) {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { error } = await withTimeout(query, 5000);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: handleSupabaseError(error) };
  }
};
