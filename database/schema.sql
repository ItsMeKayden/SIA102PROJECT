-- CLINIKA+ Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
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
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Half Day')),
    notes TEXT
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    patient_name TEXT NOT NULL,
    patient_contact TEXT NOT NULL,
    doctor_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
    notes TEXT
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    notes TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON public.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff_id ON public.schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON public.notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - customize based on your auth needs)
CREATE POLICY "Enable all operations for staff" ON public.staff FOR ALL USING (true);
CREATE POLICY "Enable all operations for attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Enable all operations for appointments" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Enable all operations for schedules" ON public.schedules FOR ALL USING (true);
CREATE POLICY "Enable all operations for notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Enable all operations for services" ON public.services FOR ALL USING (true);


-- Drop and recreate
DROP TABLE public.services CASCADE;

CREATE TABLE public.services (
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
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Only admins can SELECT
CREATE POLICY "Admin can view services"
  ON public.services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid()
      AND staff.user_role = 'admin'
    )
  );

-- Only admins can INSERT
CREATE POLICY "Admin can add services"
  ON public.services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid()
      AND staff.user_role = 'admin'
    )
  );

-- Only admins can UPDATE
CREATE POLICY "Admin can edit services"
  ON public.services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid()
      AND staff.user_role = 'admin'
    )
  );

-- Only admins can DELETE
CREATE POLICY "Admin can delete services"
  ON public.services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid()
      AND staff.user_role = 'admin'
    )
  );


  ALTER TABLE staff
ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE staff
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
ON staff
FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to update department
CREATE POLICY "Only admins can update department"
ON staff
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

-- Allow only admins to insert staff with department
CREATE POLICY "Only admins can insert staff"
ON staff
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

-- Allow only admins to delete staff
CREATE POLICY "Only admins can delete staff"
ON staff
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE id = auth.uid()
    AND user_role = 'admin'
  )
);

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS department TEXT;


ALTER POLICY "Staff can view assigned appointments"
ON public.appointments
USING (
  (doctor_id IN (SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()))
  OR
  (
    doctor_id IS NULL
    AND status = 'Assigned'
    AND department = (SELECT staff.department FROM staff WHERE staff.user_id = auth.uid())
  )
);

ALTER POLICY "Staff can update assigned appointments"
ON public.appointments
USING (
  (doctor_id IN (SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()))
  OR
  (doctor_id IS NULL AND status = 'Assigned')
);

ALTER POLICY "Staff can insert appointments"
ON public.appointments
WITH CHECK (
  -- Doctors inserting their own appointments (doctor flow)
  (doctor_id IN (SELECT staff.id FROM staff WHERE staff.user_id = auth.uid()))
  OR
  -- Admin inserting unassigned appointments (admin flow)
  (doctor_id IS NULL)
);

DROP POLICY "Staff can insert appointments" ON public.appointments;

CREATE POLICY "Staff can insert appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  (
    doctor_id IN (SELECT staff.id FROM staff WHERE staff.user_id = auth.uid())
  )
  OR
  (
    doctor_id IS NULL
  )
);

alter table public.appointments
  add column if not exists specialization text null,
  add column if not exists service_id uuid null references public.services("serviceID"),
  add column if not exists service_name text null;

alter table public.services
  add column if not exists department text null;

  update public.services set department = category where department is null;

  -- Copy category values to department where department is null
update public.services set department = category where department is null;

-- Drop the category column
alter table public.services drop column category;

alter table public.services
  add column if not exists specialization text null;

-- Pre-fill specialization from department for existing services
update public.services set specialization = department where specialization is null;

CREATE POLICY "Doctors can view services"
ON services
FOR SELECT
TO authenticated
USING (true);

CREATE TABLE departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE specializations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  department_name text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

NOTIFY pgrst, 'reload schema';