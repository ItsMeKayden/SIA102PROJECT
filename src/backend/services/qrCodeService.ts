import { supabase, handleSupabaseError } from '../../lib/supabase-client';

/**
 * Get today's date in local timezone (not UTC)
 * Fixes timezone issues where UTC date may be one day behind local date
 */
const getTodayDateString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface QRCode {
  id: string;
  staff_id: string;
  date: string;
  qr_value: string;
  scan_count: number;
  status: 'active' | 'invalid';
  created_at: string;
}

/**
 * Generate a compact, QR-scanner-friendly token
 * Uses only alphanumeric characters
 */
const generateRandomToken = (): string => {
  const timestamp = Date.now().toString(36); // e.g., "1a2b3c"
  const random = Math.random().toString(36).substring(2, 10); // e.g., "def4ghi5"
  return `${timestamp}${random}`;
};

/**
 * Generate a unique QR code value optimized for scanning
 * Format: staffId-date-token (all alphanumeric with minimal hyphens)
 * Example: 9ed1d076e5f6g7h8i9j0-20260316-1a2b3cdef4ghi5
 * Keeps full staff UUID for proper database lookups
 */
const generateQRValue = (staffId: string, date: string): string => {
  const randomToken = generateRandomToken();
  // Remove hyphens from date (YYYY-MM-DD becomes YYYYMMDD)
  const compactDate = date.replace(/-/g, '');
  // Keep staffId as is (UUID), it's safer for lookups
  // Use hyphens as separators, they work well in QR codes
  return `${staffId}-${compactDate}-${randomToken}`;
};

/**
 * Generate or retrieve today's QR code for a staff member
 * If a QR code already exists for today, return it
 * If no QR code exists, create a new one
 */
export const getDailyQRCode = async (
  staffId: string
): Promise<{ data: QRCode | null; error: string | null }> => {
  try {
    const today = getTodayDateString();
    console.log('Fetching QR code for staff:', staffId, 'date:', today);

    // Check if QR code already exists for today
    const { data: existingQR, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('staff_id', staffId)
      .eq('date', today)
      .single();

    console.log('Existing QR fetch result:', { existingQR, fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's okay
      console.error('Error fetching existing QR code:', fetchError);
      throw fetchError;
    }

    // If QR code exists for today, return it
    if (existingQR) {
      console.log('Existing QR code found:', existingQR);
      return { data: existingQR, error: null };
    }

    // Create new QR code for today
    const qrValue = generateQRValue(staffId, today);
    console.log('Creating new QR code with value:', qrValue);

    const { data: newQR, error: createError } = await supabase
      .from('qr_codes')
      .insert({
        staff_id: staffId,
        date: today,
        qr_value: qrValue,
        scan_count: 0,
        status: 'active',
      })
      .select()
      .single();

    console.log('New QR creation result:', { newQR, createError });

    if (createError) {
      console.error('Error creating QR code:', createError);
      throw createError;
    }

    if (!newQR) {
      console.error('QR code created but no data returned');
      return { data: null, error: 'QR code was created but no data was returned. Please refresh and try again.' };
    }

    console.log('New QR code created successfully:', newQR);
    return { data: newQR, error: null };
  } catch (error) {
    console.error('getDailyQRCode error:', error);
    const errorMsg = handleSupabaseError(error);
    console.error('Processed error message:', errorMsg);
    return { data: null, error: errorMsg };
  }
};

/**
 * Increment scan count for a QR code and mark as invalid if scanned twice
 */
export const recordQRCodeScan = async (
  qrValue: string
): Promise<{ data: QRCode | null; error: string | null }> => {
  try {
    console.log('Recording QR code scan:', qrValue);
    
    // Fetch current QR code
    const { data: qrCode, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_value', qrValue)
      .single();

    if (fetchError || !qrCode) {
      console.error('QR code not found:', { qrValue, fetchError });
      return { data: null, error: 'QR code not found in database' };
    }

    // Check if already invalid
    if (qrCode.status === 'invalid') {
      return { data: null, error: 'QR code has already been scanned twice and is now invalid' };
    }

    // Check if scanned today (verify date)
    const today = getTodayDateString();
    if (qrCode.date !== today) {
      console.log('QR code is not from today:', { qrCodeDate: qrCode.date, today });
      return { data: null, error: 'QR code is from a different day and cannot be used' };
    }

    // Increment scan count
    const newScanCount = qrCode.scan_count + 1;
    const newStatus = newScanCount >= 2 ? 'invalid' : 'active';

    console.log('Updating QR code scan count:', { qrId: qrCode.id, newScanCount, newStatus });

    const { data: updatedQR, error: updateError } = await supabase
      .from('qr_codes')
      .update({ scan_count: newScanCount, status: newStatus })
      .eq('id', qrCode.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating QR code:', updateError);
      throw updateError;
    }

    console.log('QR code scan recorded successfully:', { newScanCount, newStatus });
    return { data: updatedQR, error: null };
  } catch (error) {
    console.error('recordQRCodeScan error:', error);
    const errorMsg = handleSupabaseError(error);
    return { data: null, error: errorMsg };
  }
};

/**
 * Validate a QR code (check if it's active and from today)
 */
export const validateQRCode = async (
  qrValue: string
): Promise<{ isValid: boolean; message: string }> => {
  try {
    const { data: qrCode, error: fetchError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_value', qrValue)
      .single();

    if (fetchError || !qrCode) {
      console.error('QR code not found in database:', { qrValue, fetchError });
      return { isValid: false, message: 'QR code not found or invalid' };
    }

    const today = getTodayDateString();

    if (qrCode.date !== today) {
      console.log('QR code date mismatch:', { qrCodeDate: qrCode.date, today });
      return { isValid: false, message: 'QR code is from a different day and cannot be used' };
    }

    if (qrCode.status === 'invalid') {
      return { isValid: false, message: 'QR code has been scanned twice and is now invalid' };
    }

    if (qrCode.scan_count >= 2) {
      return { isValid: false, message: 'QR code has exceeded allowed scans' };
    }

    return { isValid: true, message: 'QR code is valid' };
  } catch (error) {
    console.error('Error validating QR code:', error);
    return { isValid: false, message: 'Error validating QR code: ' + handleSupabaseError(error) };
  }
};

/**
 * Get QR code details by value
 */
export const getQRCodeByValue = async (
  qrValue: string
): Promise<{ data: QRCode | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_value', qrValue)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get all QR codes for a staff member (useful for history/debugging)
 */
export const getQRCodesByStaffId = async (
  staffId: string
): Promise<{ data: QRCode[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('staff_id', staffId)
      .order('date', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};
