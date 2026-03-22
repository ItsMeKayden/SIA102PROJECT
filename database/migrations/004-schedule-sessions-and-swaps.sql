-- =====================================================
-- Schedule Sessions (AM/PM) and Swap Requests
-- =====================================================

ALTER TABLE subsystem2.schedules
ADD COLUMN IF NOT EXISTS shift_session TEXT
CHECK (shift_session IN ('AM', 'PM'))
DEFAULT 'AM';

UPDATE subsystem2.schedules
SET shift_session = CASE
  WHEN start_time < TIME '12:00' THEN 'AM'
  ELSE 'PM'
END
WHERE shift_session IS NULL;

ALTER TABLE subsystem2.schedules
ALTER COLUMN shift_session SET NOT NULL;

CREATE TABLE IF NOT EXISTS subsystem2.schedule_swap_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  requested_by_staff_id UUID REFERENCES subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
  from_schedule_id UUID REFERENCES subsystem2.schedules(id) ON DELETE CASCADE NOT NULL,
  to_schedule_id UUID REFERENCES subsystem2.schedules(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  decision_notes TEXT,
  approved_by_staff_id UUID REFERENCES subsystem2.staff(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT schedule_swap_requests_unique_pair CHECK (from_schedule_id <> to_schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_shift_session ON subsystem2.schedules(shift_session);

CREATE TABLE IF NOT EXISTS subsystem2.session_settings (
  session_name TEXT PRIMARY KEY CHECK (session_name IN ('AM', 'PM')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT session_settings_time_order CHECK (start_time < end_time)
);

INSERT INTO subsystem2.session_settings (session_name, start_time, end_time)
VALUES
  ('AM', TIME '08:00', TIME '12:00'),
  ('PM', TIME '13:00', TIME '17:00')
ON CONFLICT (session_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_session_settings_updated_at ON subsystem2.session_settings(updated_at);

ALTER TABLE subsystem2.session_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for session_settings" ON subsystem2.session_settings;
CREATE POLICY "Enable all operations for session_settings" ON subsystem2.session_settings FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON subsystem2.schedule_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requested_by ON subsystem2.schedule_swap_requests(requested_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_from_schedule ON subsystem2.schedule_swap_requests(from_schedule_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_to_schedule ON subsystem2.schedule_swap_requests(to_schedule_id);

ALTER TABLE subsystem2.schedule_swap_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for schedule_swap_requests" ON subsystem2.schedule_swap_requests;
CREATE POLICY "Enable all operations for schedule_swap_requests" ON subsystem2.schedule_swap_requests FOR ALL USING (true);
