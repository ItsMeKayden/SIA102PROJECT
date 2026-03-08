-- CLINIKA+ Database Fixes
-- Run this in Supabase SQL Editor after 001-auth-and-roles.sql

-- =====================================================
-- 1. FIX APPOINTMENTS RLS: Allow staff to INSERT appointments
-- =====================================================

-- Staff currently has no INSERT policy on appointments, which causes the
-- "new row violates row-level security policy" error when staff tries to add one.
CREATE POLICY "Staff can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.staff
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 2. FIX NOTIFICATIONS RLS: Allow staff to see global notifications
-- =====================================================

-- Drop the old staff notification select policy that excluded global (NULL staff_id) notifications
DROP POLICY IF EXISTS "Staff can view own notifications" ON public.notifications;

-- Re-create it to include global notifications (staff_id IS NULL) as well
CREATE POLICY "Staff can view own notifications" ON public.notifications
    FOR SELECT USING (
        staff_id IS NULL  -- global notifications visible to all authenticated staff
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
    );

-- Also allow staff to mark global notifications as read (update)
DROP POLICY IF EXISTS "Staff can update own notifications" ON public.notifications;

CREATE POLICY "Staff can update own notifications" ON public.notifications
    FOR UPDATE USING (
        staff_id IS NULL
        OR staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
    );

-- =====================================================
-- 3. CREATE delete_auth_user RPC (for deleting staff auth accounts)
-- =====================================================

-- This function runs with SECURITY DEFINER so it can access auth.users.
-- It validates that the caller is an admin before deleting.
CREATE OR REPLACE FUNCTION delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins to invoke this function
    IF NOT EXISTS (
        SELECT 1 FROM public.staff
        WHERE user_id = auth.uid() AND user_role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Allow authenticated users to call this function (the body enforces admin-only)
REVOKE ALL ON FUNCTION delete_auth_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
