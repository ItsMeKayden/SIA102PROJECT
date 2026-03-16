-- =====================================================
-- QR Code Tracking Table for Daily Unique QR Codes
-- =====================================================

CREATE TABLE IF NOT EXISTS Subsystem2.qr_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    staff_id UUID REFERENCES Subsystem2.staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    qr_value TEXT NOT NULL UNIQUE,
    scan_count INTEGER DEFAULT 0 NOT NULL CHECK (scan_count >= 0 AND scan_count <= 2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalid')),
    UNIQUE(staff_id, date)
);

-- =====================================================
-- Index for QR Code queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_qr_codes_staff_id_date ON Subsystem2.qr_codes(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_value ON Subsystem2.qr_codes(qr_value);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status ON Subsystem2.qr_codes(status);

-- =====================================================
-- Enable RLS for QR Codes
-- =====================================================
ALTER TABLE Subsystem2.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for qr_codes" ON Subsystem2.qr_codes FOR ALL USING (true);

-- =====================================================
-- Grant access rights
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON Subsystem2.qr_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON Subsystem2.qr_codes TO anon;
