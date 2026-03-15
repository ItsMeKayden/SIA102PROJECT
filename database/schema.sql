-- CLINIKA+ Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Subsystem2 schema
CREATE SCHEMA IF NOT EXISTS Subsystem2;

-- Create staff table
CREATE TABLE IF NOT EXISTS Subsystem2.staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialization TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    email TEXT NOT NULL,
    phone TEXT
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS Subsystem2.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Half Day')),
    notes TEXT
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS Subsystem2.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    patient_name TEXT NOT NULL,
    patient_contact TEXT NOT NULL,
    doctor_id UUID REFERENCES Subsystem2.staff(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
    notes TEXT
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS Subsystem2.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS Subsystem2.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON Subsystem2.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON Subsystem2.attendance(date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON Subsystem2.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON Subsystem2.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON Subsystem2.schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON Subsystem2.schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON Subsystem2.notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON Subsystem2.notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE Subsystem2.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.services ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - customize based on your auth needs)
CREATE POLICY "Enable all operations for staff" ON Subsystem2.staff FOR ALL USING (true);
CREATE POLICY "Enable all operations for attendance" ON Subsystem2.attendance FOR ALL USING (true);
CREATE POLICY "Enable all operations for appointments" ON Subsystem2.appointments FOR ALL USING (true);
CREATE POLICY "Enable all operations for schedules" ON Subsystem2.schedules FOR ALL USING (true);
CREATE POLICY "Enable all operations for notifications" ON Subsystem2.notifications FOR ALL USING (true);
CREATE POLICY "Enable all operations for services" ON Subsystem2.services FOR ALL USING (true);


-- Drop and recreate
DROP TABLE IF EXISTS Subsystem2.services CASCADE;

CREATE TABLE Subsystem2.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  downpayment NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Available',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE Subsystem2.services ENABLE ROW LEVEL SECURITY;

-- Only admins can SELECT
CREATE POLICY "Admin can view services"
  ON Subsystem2.services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM Subsystem2.staff
      WHERE Subsystem2.staff.id = auth.uid()
      AND Subsystem2.staff.user_role = 'admin'
    )
  );

-- Only admins can INSERT
CREATE POLICY "Admin can add services"
  ON Subsystem2.services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM Subsystem2.staff
      WHERE Subsystem2.staff.id = auth.uid()
      AND Subsystem2.staff.user_role = 'admin'
    )
  );

-- Only admins can UPDATE
CREATE POLICY "Admin can edit services"
  ON Subsystem2.services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM Subsystem2.staff
      WHERE Subsystem2.staff.id = auth.uid()
      AND Subsystem2.staff.user_role = 'admin'
    )
  );

-- Only admins can DELETE
CREATE POLICY "Admin can delete services"
  ON Subsystem2.services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM Subsystem2.staff
      WHERE Subsystem2.staff.id = auth.uid()
      AND Subsystem2.staff.user_role = 'admin'
    )
  );


  ALTER TABLE Subsystem2.staff
ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE Subsystem2.staff
ADD CONSTRAINT staff_department_check
CHECK (
  department IS NULL OR department IN (
    'Pharmacy',
    'Emergency',
    'Surgery',
    'Radiology',
    'Cardiology',
    'Pediatrics',
    'General'
  )
);

-- Allow authenticated users to read department field (SELECT)
CREATE POLICY "Staff can view department"
ON Subsystem2.staff
FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to update department
CREATE POLICY "Only admins can update department"
ON Subsystem2.staff
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM Subsystem2.staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM Subsystem2.staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

-- Allow only admins to insert staff with department
CREATE POLICY "Only admins can insert staff"
ON Subsystem2.staff
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM Subsystem2.staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

-- Allow only admins to delete staff
CREATE POLICY "Only admins can delete staff"
ON Subsystem2.staff
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM Subsystem2.staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

ALTER TABLE Subsystem2.appointments
ADD COLUMN IF NOT EXISTS department TEXT;


ALTER POLICY "Staff can view assigned appointments"
ON Subsystem2.appointments
USING (
  (doctor_id IN (SELECT Subsystem2.staff.id FROM Subsystem2.staff WHERE Subsystem2.staff.user_id = auth.uid()))
  OR
  (
    doctor_id IS NULL
    AND status = 'Assigned'
    AND department = (SELECT Subsystem2.staff.department FROM Subsystem2.staff WHERE Subsystem2.staff.user_id = auth.uid())
  )
);

ALTER POLICY "Staff can update assigned appointments"
ON Subsystem2.appointments
USING (
  (doctor_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid()))
  OR
  (doctor_id IS NULL AND status = 'Assigned')
);

ALTER POLICY "Staff can insert appointments"
ON Subsystem2.appointments
WITH CHECK (
  -- Doctors inserting their own appointments (doctor flow)
  (doctor_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid()))
  OR
  -- Admin inserting unassigned appointments (admin flow)
  (doctor_id IS NULL)
);

DROP POLICY IF EXISTS "Staff can insert appointments" ON Subsystem2.appointments;

CREATE POLICY "Staff can insert appointments"
ON Subsystem2.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  (
    doctor_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid())
  )
  OR
  (
    doctor_id IS NULL
  )
);

alter table Subsystem2.appointments
  add column if not exists specialization text null,
  add column if not exists service_id uuid null references Subsystem2.services(id),
  add column if not exists service_name text null;

alter table Subsystem2.services
  add column if not exists department text null,
  add column if not exists specialization text null;

-- Copy category values to department where department is null
update Subsystem2.services set department = category where department is null;

-- Pre-fill specialization from department for existing services
update Subsystem2.services set specialization = department where specialization is null;

-- Drop the category column if it exists
alter table Subsystem2.services drop column if exists category;

CREATE POLICY "Doctors can view services"
ON Subsystem2.services
FOR SELECT
TO authenticated
USING (true);

CREATE TABLE IF NOT EXISTS Subsystem2.departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS Subsystem2.specializations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INTEGRATION OF MIGRATION: 001-auth-and-roles.sql
-- =====================================================

-- =====================================================
-- 1. ADD NEW FIELDS TO STAFF TABLE
-- =====================================================

-- Add duty_status field (current duty state)
ALTER TABLE Subsystem2.staff 
ADD COLUMN IF NOT EXISTS duty_status TEXT DEFAULT 'Off Duty';

-- Add check constraint for duty_status (using DO block to avoid errors if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staff_duty_status_check'
        AND conrelid = 'Subsystem2.staff'::regclass
    ) THEN
        ALTER TABLE Subsystem2.staff 
        ADD CONSTRAINT staff_duty_status_check 
        CHECK (duty_status IN ('On Duty', 'Off Duty', 'On Leave'));
    END IF;
END $$;

-- Add user_id to link with Supabase Auth
ALTER TABLE Subsystem2.staff 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_role field (admin or staff)
ALTER TABLE Subsystem2.staff 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'staff';

-- Add unique constraint on email
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_staff_email'
    ) THEN
        ALTER TABLE Subsystem2.staff ADD CONSTRAINT unique_staff_email UNIQUE (email);
    END IF;
END $$;

-- =====================================================
-- 2. UPDATE APPOINTMENTS TABLE FOR TWO-TIER APPROVAL
-- =====================================================

-- Add admin approval fields
ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false;

ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES Subsystem2.staff(id);

-- Add staff acceptance fields
ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS staff_accepted BOOLEAN;

ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS staff_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add rejection reason
ALTER TABLE Subsystem2.appointments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status check constraint
ALTER TABLE Subsystem2.appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE Subsystem2.appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('Pending', 'Approved', 'Assigned', 'Accepted', 'Rejected', 'Completed', 'Cancelled', 'No Show'));

-- =====================================================
-- 3. UPDATE SCHEDULES TABLE
-- =====================================================

-- Add recurrence and override fields
ALTER TABLE Subsystem2.schedules 
ADD COLUMN IF NOT EXISTS is_override BOOLEAN DEFAULT false;

ALTER TABLE Subsystem2.schedules 
ADD COLUMN IF NOT EXISTS override_date DATE;

ALTER TABLE Subsystem2.schedules 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES Subsystem2.staff(id);

-- =====================================================
-- 4. CREATE SCHEDULE CONFLICTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS Subsystem2.schedule_conflicts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('double_booking', 'overlap', 'time_off_conflict')),
    schedule_id_1 UUID REFERENCES Subsystem2.schedules(id) ON DELETE CASCADE,
    schedule_id_2 UUID REFERENCES Subsystem2.schedules(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES Subsystem2.appointments(id) ON DELETE CASCADE,
    conflict_date DATE,
    conflict_time_start TIME,
    conflict_time_end TIME,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES Subsystem2.staff(id)
);

-- =====================================================
-- INTEGRATION OF MIGRATION: 002-fixes.sql
-- =====================================================

-- =====================================================
-- 1. FIX APPOINTMENTS RLS: Allow staff to INSERT appointments
-- =====================================================

CREATE POLICY IF NOT EXISTS "Staff can insert appointments for fixes" ON Subsystem2.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 2. FIX NOTIFICATIONS RLS: Allow staff to see global notifications
-- =====================================================

DROP POLICY IF EXISTS "Staff can view own notifications" ON Subsystem2.notifications;

CREATE POLICY "Staff can view own notifications" ON Subsystem2.notifications
    FOR SELECT USING (
        staff_id IS NULL  -- global notifications visible to all authenticated staff
        OR staff_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid())
    );

-- Also allow staff to mark notifications as read
DROP POLICY IF EXISTS "Staff can update own notifications" ON Subsystem2.notifications;

CREATE POLICY "Staff can update own notifications" ON Subsystem2.notifications
    FOR UPDATE USING (
        staff_id IS NULL
        OR staff_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid())
    );

-- =====================================================
-- 3. CREATE delete_auth_user RPC (for deleting staff auth accounts)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = Subsystem2
AS $$
BEGIN
    -- Only allow admins to invoke this function
    IF NOT EXISTS (
        SELECT 1 FROM Subsystem2.staff
        WHERE user_id = auth.uid() AND user_role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Allow authenticated users to call this function
REVOKE ALL ON FUNCTION delete_auth_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;

-- =====================================================
-- 4. ENABLE REALTIME REPLICATION FOR LIVE DASHBOARD UPDATES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS Subsystem2.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS Subsystem2.appointments;

-- =====================================================
-- CREATE PUBLIC VIEWS FOR BACKWARD COMPATIBILITY
-- =====================================================

CREATE OR REPLACE VIEW public.staff AS SELECT * FROM Subsystem2.staff;
CREATE OR REPLACE VIEW public.attendance AS SELECT * FROM Subsystem2.attendance;
CREATE OR REPLACE VIEW public.appointments AS SELECT * FROM Subsystem2.appointments;
CREATE OR REPLACE VIEW public.schedules AS SELECT * FROM Subsystem2.schedules;
CREATE OR REPLACE VIEW public.notifications AS SELECT * FROM Subsystem2.notifications;
CREATE OR REPLACE VIEW public.services AS SELECT * FROM Subsystem2.services;

-- Grant permissions on views
GRANT ALL ON public.staff TO authenticated;
GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.schedules TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.services TO authenticated;