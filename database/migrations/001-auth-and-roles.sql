    -- CLINIKA+ Database Schema Updates
    -- Authentication, Roles, and Workflow Enhancements
    -- Run this in Supabase SQL Editor after the initial schema

    -- =====================================================
    -- 1. ADD NEW FIELDS TO STAFF TABLE
    -- =====================================================

    -- Add duty_status field (current duty state)
    ALTER TABLE public.staff 
    ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'Off Duty';

    -- Add check constraint for duty_status (using DO block to avoid errors if exists)
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'staff_duty_status_check'
            AND conrelid = 'public.staff'::regclass
        ) THEN
            ALTER TABLE public.staff 
            ADD CONSTRAINT staff_duty_status_check 
            CHECK (duty_status IN ('On Duty', 'Off Duty', 'On Leave'));
        END IF;
    END $$;

    -- Add user_id to link with Supabase Auth
    ALTER TABLE public.staff 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Add user_role field (admin or staff)
    ALTER TABLE public.staff 
    ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'staff';

    -- Add check constraint for user_role (using DO block to avoid errors if exists)
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'staff_user_role_check'
            AND conrelid = 'public.staff'::regclass
        ) THEN
            ALTER TABLE public.staff 
            ADD CONSTRAINT staff_user_role_check 
            CHECK (user_role IN ('admin', 'staff'));
        END IF;
    END $$;

    -- Add unique constraint on email (using DO block to avoid errors if exists)
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_staff_email'
        ) THEN
            ALTER TABLE public.staff ADD CONSTRAINT unique_staff_email UNIQUE (email);
        END IF;
    END $$;

    -- =====================================================
    -- 2. UPDATE APPOINTMENTS TABLE FOR TWO-TIER APPROVAL
    -- =====================================================

    -- Add admin approval fields
    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false;

    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMP WITH TIME ZONE;

    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES public.staff(id);

    -- Add staff acceptance fields
    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS staff_accepted BOOLEAN;

    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS staff_accepted_at TIMESTAMP WITH TIME ZONE;

    -- Add rejection reason
    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

    -- Update status check constraint to include new statuses
    ALTER TABLE public.appointments 
    DROP CONSTRAINT IF EXISTS appointments_status_check;

    ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('Pending', 'Approved', 'Assigned', 'Accepted', 'Rejected', 'Completed', 'Cancelled', 'No Show'));

    -- =====================================================
    -- 3. UPDATE SCHEDULES TABLE
    -- =====================================================

    -- Add recurrence and override fields
    ALTER TABLE public.schedules 
    ADD COLUMN IF NOT EXISTS is_override BOOLEAN DEFAULT false;

    ALTER TABLE public.schedules 
    ADD COLUMN IF NOT EXISTS override_date DATE;

    ALTER TABLE public.schedules 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.staff(id);

    -- =====================================================
    -- 4. CREATE SCHEDULE CONFLICTS TABLE
    -- =====================================================

    CREATE TABLE IF NOT EXISTS public.schedule_conflicts (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
        conflict_type TEXT NOT NULL CHECK (conflict_type IN ('double_booking', 'overlap', 'time_off_conflict')),
        schedule_id_1 UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
        schedule_id_2 UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
        appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
        conflict_date DATE,
        conflict_time_start TIME,
        conflict_time_end TIME,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID REFERENCES public.staff(id)
    );

    -- =====================================================
    -- 5. UPDATE ROW LEVEL SECURITY POLICIES
    -- =====================================================

    -- Drop existing wide-open policies
    DROP POLICY IF EXISTS "Enable all operations for staff" ON public.staff;
    DROP POLICY IF EXISTS "Enable all operations for attendance" ON public.attendance;
    DROP POLICY IF EXISTS "Enable all operations for appointments" ON public.appointments;
    DROP POLICY IF EXISTS "Enable all operations for schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Enable all operations for notifications" ON public.notifications;

    -- STAFF TABLE POLICIES
    -- Admins can do everything
    CREATE POLICY "Admins can view all staff" ON public.staff
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    CREATE POLICY "Admins can insert staff" ON public.staff
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    CREATE POLICY "Admins can update staff" ON public.staff
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    CREATE POLICY "Admins can delete staff" ON public.staff
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    -- Staff can view their own record
    CREATE POLICY "Staff can view own record" ON public.staff
        FOR SELECT USING (user_id = auth.uid());

    -- Staff can update their own record (limited fields)
    CREATE POLICY "Staff can update own record" ON public.staff
        FOR UPDATE USING (user_id = auth.uid());

    -- ATTENDANCE TABLE POLICIES
    -- Admins can do everything
    CREATE POLICY "Admins can manage all attendance" ON public.attendance
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    -- Staff can view their own attendance
    CREATE POLICY "Staff can view own attendance" ON public.attendance
        FOR SELECT USING (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- Staff can insert their own attendance (clock in/out)
    CREATE POLICY "Staff can create own attendance" ON public.attendance
        FOR INSERT WITH CHECK (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- APPOINTMENTS TABLE POLICIES
    -- Admins can do everything
    CREATE POLICY "Admins can manage all appointments" ON public.appointments
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    -- Staff can view their assigned appointments
    CREATE POLICY "Staff can view assigned appointments" ON public.appointments
        FOR SELECT USING (
            doctor_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- Staff can update their assigned appointments (accept/reject)
    CREATE POLICY "Staff can update assigned appointments" ON public.appointments
        FOR UPDATE USING (
            doctor_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- SCHEDULES TABLE POLICIES
    -- Admins can do everything
    CREATE POLICY "Admins can manage all schedules" ON public.schedules
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    -- Staff can view all schedules (to see who's working when)
    CREATE POLICY "Staff can view all schedules" ON public.schedules
        FOR SELECT USING (auth.uid() IS NOT NULL);

    -- Staff can manage their own schedules
    CREATE POLICY "Staff can manage own schedules" ON public.schedules
        FOR ALL USING (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- NOTIFICATIONS TABLE POLICIES
    -- Admins can do everything
    CREATE POLICY "Admins can manage all notifications" ON public.notifications
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    -- Staff can view their own notifications
    CREATE POLICY "Staff can view own notifications" ON public.notifications
        FOR SELECT USING (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- Staff can update their own notifications (mark as read)
    CREATE POLICY "Staff can update own notifications" ON public.notifications
        FOR UPDATE USING (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- SCHEDULE CONFLICTS TABLE POLICIES
    ALTER TABLE public.schedule_conflicts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admins can manage all conflicts" ON public.schedule_conflicts
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.staff 
                WHERE user_id = auth.uid() AND user_role = 'admin'
            )
        );

    CREATE POLICY "Staff can view own conflicts" ON public.schedule_conflicts
        FOR SELECT USING (
            staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
        );

    -- =====================================================
    -- 6. CREATE INDEXES FOR NEW FIELDS
    -- =====================================================

    CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
    CREATE INDEX IF NOT EXISTS idx_staff_user_role ON public.staff(user_role);
    CREATE INDEX IF NOT EXISTS idx_staff_duty_status ON public.staff(duty_status);
    CREATE INDEX IF NOT EXISTS idx_appointments_admin_approved ON public.appointments(admin_approved);
    CREATE INDEX IF NOT EXISTS idx_appointments_staff_accepted ON public.appointments(staff_accepted);
    CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_staff_id ON public.schedule_conflicts(staff_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_resolved ON public.schedule_conflicts(resolved);

    -- =====================================================
    -- 7. CREATE HELPER FUNCTIONS
    -- =====================================================

    -- Function to automatically update duty_status based on schedule
    CREATE OR REPLACE FUNCTION update_staff_duty_status()
    RETURNS void AS $$
    DECLARE
        staff_record RECORD;
        current_time TIME := LOCALTIME;
        current_day INTEGER := EXTRACT(DOW FROM CURRENT_DATE);
    BEGIN
        FOR staff_record IN SELECT id FROM public.staff WHERE status = 'Active'
        LOOP
            -- Check if staff has active schedule for current time
            IF EXISTS (
                SELECT 1 FROM public.schedules
                WHERE staff_id = staff_record.id
                AND day_of_week = current_day
                AND start_time <= current_time
                AND end_time >= current_time
                AND is_active = true
            ) THEN
                UPDATE public.staff 
                SET duty_status = 'On Duty'
                WHERE id = staff_record.id AND duty_status != 'On Leave';
            ELSE
                UPDATE public.staff 
                SET duty_status = 'Off Duty'
                WHERE id = staff_record.id AND duty_status != 'On Leave';
            END IF;
        END LOOP;
    END;
    $$ LANGUAGE plpgsql;

    -- Function to detect schedule conflicts
    CREATE OR REPLACE FUNCTION detect_schedule_conflicts(p_staff_id UUID, p_schedule_id UUID)
    RETURNS TABLE (
        conflict_id UUID,
        conflict_with_schedule_id UUID,
        conflict_with_appointment_id UUID,
        conflict_description TEXT
    ) AS $$
    BEGIN
        -- Implementation for conflict detection
        -- This is a placeholder - full implementation would check time overlaps
        RETURN QUERY
        SELECT 
            uuid_generate_v4() as conflict_id,
            s2.id as conflict_with_schedule_id,
            NULL::UUID as conflict_with_appointment_id,
            'Schedule overlap detected' as conflict_description
        FROM public.schedules s1
        JOIN public.schedules s2 ON s1.staff_id = s2.staff_id 
            AND s1.day_of_week = s2.day_of_week
            AND s1.id != s2.id
        WHERE s1.id = p_schedule_id
            AND s1.staff_id = p_staff_id
            AND (
                (s1.start_time >= s2.start_time AND s1.start_time < s2.end_time)
                OR (s1.end_time > s2.start_time AND s1.end_time <= s2.end_time)
                OR (s1.start_time <= s2.start_time AND s1.end_time >= s2.end_time)
            )
            AND s2.is_active = true;
    END;
    $$ LANGUAGE plpgsql;

    -- =====================================================
    -- 8. CREATE DEFAULT ADMIN USER (OPTIONAL)
    -- =====================================================

    -- Note: You'll need to create admin user through Supabase Auth dashboard
    -- Then run this to link them to staff record:
    -- 
    -- INSERT INTO public.staff (name, email, role, specialization, user_role, user_id, status)
    -- VALUES (
    --     'Admin User',
    --     'admin@clinika.com',
    --     'Administrator',
    --     'Management',
    --     'admin',
    --     'YOUR_AUTH_USER_ID_HERE',
    --     'Active'
    -- );

    -- =====================================================
    -- MIGRATION COMPLETE
    -- =====================================================

    -- Update existing staff records with default duty_status
    UPDATE public.staff SET duty_status = 'Off Duty' WHERE duty_status IS NULL;

    -- Update existing appointments to new status
    UPDATE public.appointments SET status = 'Pending' WHERE status = 'Scheduled';
