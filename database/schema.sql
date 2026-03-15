-- CLINIKA+ Database Schema
-- Consolidated schema for Subsystem2
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Subsystem2 schema
CREATE SCHEMA IF NOT EXISTS Subsystem2;

-- =====================================================
-- 1. CREATE STAFF TABLE WITH ALL FIELDS
-- =====================================================
CREATE TABLE IF NOT EXISTS Subsystem2.staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialization TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role TEXT DEFAULT 'staff' CHECK (user_role IN ('admin', 'staff')),
    department TEXT CHECK (
        department IS NULL OR department IN (
            'Pharmacy',
            'Emergency',
            'Surgery',
            'Radiology',
            'Cardiology',
            'Pediatrics',
            'General'
        )
    ),
    duty_status TEXT DEFAULT 'Off Duty' CHECK (duty_status IN ('On Duty', 'Off Duty', 'On Leave'))
);

-- =====================================================
-- 2. CREATE ATTENDANCE TABLE
-- =====================================================
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

-- =====================================================
-- 3. CREATE APPOINTMENTS TABLE WITH ALL FIELDS
-- =====================================================
CREATE TABLE IF NOT EXISTS Subsystem2.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    patient_name TEXT NOT NULL,
    patient_contact TEXT NOT NULL,
    doctor_id UUID REFERENCES Subsystem2.staff(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Assigned', 'Accepted', 'Rejected', 'Completed', 'Cancelled', 'No Show')),
    notes TEXT,
    department TEXT,
    specialization TEXT,
    service_id UUID,
    service_name TEXT,
    admin_approved BOOLEAN DEFAULT false,
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_approved_by UUID REFERENCES Subsystem2.staff(id),
    staff_accepted BOOLEAN,
    staff_accepted_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

-- =====================================================
-- 4. CREATE SCHEDULES TABLE WITH ALL FIELDS
-- =====================================================
CREATE TABLE IF NOT EXISTS Subsystem2.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT,
    is_override BOOLEAN DEFAULT false,
    override_date DATE,
    created_by UUID REFERENCES Subsystem2.staff(id)
);

-- =====================================================
-- 5. CREATE NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS Subsystem2.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false NOT NULL
);

-- =====================================================
-- 6. CREATE SERVICES TABLE WITH ALL FIELDS
-- =====================================================
CREATE TABLE IF NOT EXISTS Subsystem2.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    duration TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    downpayment NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Available',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    department TEXT,
    specialization TEXT
);

-- =====================================================
-- 7. CREATE SCHEDULE CONFLICTS TABLE
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
-- 8. CREATE REFERENCE TABLES
-- =====================================================
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
-- 9. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON Subsystem2.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON Subsystem2.staff(email);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON Subsystem2.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON Subsystem2.attendance(date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON Subsystem2.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON Subsystem2.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON Subsystem2.schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON Subsystem2.schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON Subsystem2.notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON Subsystem2.notifications(is_read);

-- =====================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE Subsystem2.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subsystem2.schedule_conflicts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. CREATE RLS POLICIES FOR STAFF
-- =====================================================
CREATE POLICY "Enable all operations for staff" ON Subsystem2.staff FOR ALL USING (true);
CREATE POLICY "Staff can view department" ON Subsystem2.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can update department" ON Subsystem2.staff FOR UPDATE TO authenticated 
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
CREATE POLICY "Only admins can insert staff" ON Subsystem2.staff FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );
CREATE POLICY "Only admins can delete staff" ON Subsystem2.staff FOR DELETE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );

-- =====================================================
-- 12. CREATE RLS POLICIES FOR ATTENDANCE
-- =====================================================
CREATE POLICY "Enable all operations for attendance" ON Subsystem2.attendance FOR ALL USING (true);

-- =====================================================
-- 13. CREATE RLS POLICIES FOR APPOINTMENTS
-- =====================================================
CREATE POLICY "Enable all operations for appointments" ON Subsystem2.appointments FOR ALL USING (true);
CREATE POLICY "Staff can insert appointments" ON Subsystem2.appointments FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 14. GRANT ACCESS RIGHTS TO AUTHENTICATED/ANON ROLES
-- =====================================================
-- This ensures the Supabase client can query tables in the subsystem2 schema.
GRANT USAGE ON SCHEMA subsystem2 TO authenticated;
GRANT USAGE ON SCHEMA subsystem2 TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA subsystem2
  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA subsystem2
  TO anon;

-- Ensure future tables in the schema also get the same privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA subsystem2
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA subsystem2
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

-- =====================================================
-- 14. CREATE RLS POLICIES FOR SCHEDULES
-- =====================================================
CREATE POLICY "Enable all operations for schedules" ON Subsystem2.schedules FOR ALL USING (true);

-- =====================================================
-- 15. CREATE RLS POLICIES FOR NOTIFICATIONS
-- =====================================================
CREATE POLICY "Enable all operations for notifications" ON Subsystem2.notifications FOR ALL USING (true);
CREATE POLICY "Staff can view own notifications" ON Subsystem2.notifications FOR SELECT USING (
    staff_id IS NULL OR staff_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid())
);
CREATE POLICY "Staff can update own notifications" ON Subsystem2.notifications FOR UPDATE USING (
    staff_id IS NULL OR staff_id IN (SELECT id FROM Subsystem2.staff WHERE user_id = auth.uid())
);

-- =====================================================
-- 16. CREATE RLS POLICIES FOR SERVICES (Admin-Only Access)
-- =====================================================
CREATE POLICY "Admin can view services" ON Subsystem2.services FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE Subsystem2.staff.id = auth.uid()
            AND Subsystem2.staff.user_role = 'admin'
        )
    );
CREATE POLICY "Admin can add services" ON Subsystem2.services FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE Subsystem2.staff.id = auth.uid()
            AND Subsystem2.staff.user_role = 'admin'
        )
    );
CREATE POLICY "Admin can edit services" ON Subsystem2.services FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE Subsystem2.staff.id = auth.uid()
            AND Subsystem2.staff.user_role = 'admin'
        )
    );
CREATE POLICY "Admin can delete services" ON Subsystem2.services FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM Subsystem2.staff
            WHERE Subsystem2.staff.id = auth.uid()
            AND Subsystem2.staff.user_role = 'admin'
        )
    );
CREATE POLICY "Doctors can view services" ON Subsystem2.services FOR SELECT TO authenticated USING (true);

-- =====================================================
-- 17. CREATE RLS POLICIES FOR SCHEDULE CONFLICTS
-- =====================================================
CREATE POLICY "Enable all operations for schedule_conflicts" ON Subsystem2.schedule_conflicts FOR ALL USING (true);

-- =====================================================
-- 18. CREATE FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION Subsystem2.delete_auth_user(target_user_id UUID)
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
REVOKE ALL ON FUNCTION Subsystem2.delete_auth_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION Subsystem2.delete_auth_user(UUID) TO authenticated;

-- =====================================================
-- 18b. CREATE TRIGGER FOR AUTOMATIC STAFF PROFILE CREATION
-- =====================================================

-- Function to create a staff profile when a user signs up
CREATE OR REPLACE FUNCTION Subsystem2.create_staff_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO Subsystem2.staff (
        id,
        user_id,
        name,
        role,
        email,
        user_role,
        status,
        duty_status
    ) VALUES (
        gen_random_uuid(),
        NEW.id,
        COALESCE(NEW.user_metadata->>'name', NEW.email, 'New Staff'),
        'Staff',
        NEW.email,
        'staff',
        'Active',
        'Off Duty'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error creating staff profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = Subsystem2;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION Subsystem2.create_staff_profile_on_signup();

-- =====================================================
-- 19. ENABLE REALTIME REPLICATION
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE Subsystem2.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE Subsystem2.appointments;

-- =====================================================
-- 20. INSERT DEFAULT ADMIN ACCOUNT (OPTIONAL)
-- =====================================================
-- Uncomment and modify the following to create a default admin account
-- Note: Create the auth user first in Supabase Dashboard, then uncomment this

-- INSERT INTO Subsystem2.staff (
--     id,
--     user_id,
--     name,
--     role,
--     email,
--     user_role,
--     status,
--     duty_status,
--     created_at,
--     updated_at
-- ) VALUES (
--     gen_random_uuid(),
--     (SELECT id FROM auth.users WHERE email = 'admin@acowis.com' LIMIT 1),
--     'Admin User',
--     'Admin',
--     'admin@acowis.com',
--     'admin',
--     'Active',
--     'Off Duty',
--     NOW(),
--     NOW()
-- )
-- ON CONFLICT (email) DO NOTHING;

-- Alternative: Insert without linking to auth user yet (can be linked later)
-- INSERT INTO Subsystem2.staff (
--     id,
--     name,
--     role,
--     email,
--     user_role,
--     status,
--     duty_status
-- ) VALUES (
--     gen_random_uuid(),
--     'Admin User',
--     'Admin',
--     'admin@acowis.com',
--     'admin',
--     'Active',
--     'Off Duty'
-- )
-- ON CONFLICT (email) DO NOTHING;