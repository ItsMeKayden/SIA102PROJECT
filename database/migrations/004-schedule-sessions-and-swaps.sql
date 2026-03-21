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
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON subsystem2.schedule_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requested_by ON subsystem2.schedule_swap_requests(requested_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_from_schedule ON subsystem2.schedule_swap_requests(from_schedule_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_to_schedule ON subsystem2.schedule_swap_requests(to_schedule_id);

ALTER TABLE subsystem2.schedule_swap_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for schedule_swap_requests" ON subsystem2.schedule_swap_requests;
CREATE POLICY "Enable all operations for schedule_swap_requests" ON subsystem2.schedule_swap_requests FOR ALL USING (true);
