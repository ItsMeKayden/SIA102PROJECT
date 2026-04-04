-- Add service_type column to services table
ALTER TABLE Subsystem2.services
ADD COLUMN service_type TEXT DEFAULT 'Consultation' CHECK (service_type IN ('Consultation', 'Laboratory', 'Procedure'));
