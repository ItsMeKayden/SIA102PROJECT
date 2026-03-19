import '../styles/Pages.css';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Snackbar,
  Card,
  CardContent,
} from '@mui/material';
import { FiClock, FiX } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { QRScanner } from '../components/scanner/QRScanner';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllAttendance,
  clockIn,
  clockOut,
  isStaffClockedIn,
} from '../../backend/services/attendanceService';
import { recordQRCodeScan, validateQRCode, getDailyQRCode } from '../../backend/services/qrCodeService';
import { getAllStaff } from '../../backend/services/staffService';
import type { Attendance as AttendanceType, AttendanceWithStaff, Staff } from '../../types';

// Main Component
function Attendance() {
  const { userRole } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualStaffId, setManualStaffId] = useState<string>('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    onCall: 0,
  });
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [generateQRModalOpen, setGenerateQRModalOpen] = useState(false);
  const [selectedStaffForQR, setSelectedStaffForQR] = useState<Staff | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{
    qrValue: string;
    scanCount: number;
    status: 'active' | 'invalid';
  } | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching attendance data...');

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 8000)
      );

      const fetchPromise = getAllAttendance();
      const { data: attendanceRecords, error: attendanceError } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as { data: AttendanceType[] | null; error: string | null };

      console.log('Attendance records fetched:', attendanceRecords);

      if (attendanceError) {
        console.error('Attendance error:', attendanceError);
        setError(attendanceError);
        setLoading(false);
        return;
      }

      const records = attendanceRecords || [];
      setAttendanceData(records);
      console.log('Set attendance data, count:', records.length);

      if (records.length > 0) {
        const present = records.filter(
          (a: AttendanceType) => a.status === 'Present',
        ).length;
        const late = records.filter(
          (a: AttendanceType) => a.status === 'Late',
        ).length;
        const absent = records.filter(
          (a: AttendanceType) => a.status === 'Absent',
        ).length;
        const onCall = records.filter(
          (a: AttendanceType) => a.status === 'On Call',
        ).length;

        setStats({
          present,
          late,
          absent,
          onCall,
        });
      } else {
        setStats({
          present: 0,
          late: 0,
          absent: 0,
          onCall: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle clock in/out
  const handleClockInOut = useCallback(
    async (staffId: string) => {
      if (!staffId.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid staff ID',
          severity: 'error',
        });
        return;
      }

      try {
        // Check if staff is already clocked in
        const { isClockedIn: isCurrentlyClockedIn, error: checkError } = await isStaffClockedIn(staffId);

        if (checkError) {
          setSnackbar({
            open: true,
            message: checkError,
            severity: 'error',
          });
          return;
        }

        if (isCurrentlyClockedIn) {
          // Clock out
          const { error } = await clockOut(staffId);
          if (error) {
            setSnackbar({
              open: true,
              message: error,
              severity: 'error',
            });
          } else {
            setSnackbar({
              open: true,
              message: `Clocked out successfully at ${new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}`,
              severity: 'success',
            });
            setManualStaffId('');
            setManualEntryOpen(false);
            setQrScannerOpen(false);
            fetchAttendanceData(); // Refresh attendance data
          }
        } else {
          // Clock in
          const { error } = await clockIn(staffId);
          if (error) {
            setSnackbar({
              open: true,
              message: error,
              severity: 'error',
            });
          } else {
            setSnackbar({
              open: true,
              message: `Clocked in successfully at ${new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}`,
              severity: 'success',
            });
            setManualStaffId('');
            setManualEntryOpen(false);
            setQrScannerOpen(false);
            fetchAttendanceData(); // Refresh attendance data
          }
        }
      } catch (error) {
        console.error('Error during clock in/out:', error);
        const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: 'error',
        });
      }
    },
    [fetchAttendanceData]
  );

  useEffect(() => {
    fetchAttendanceData();
    // Fetch staff list for QR code generation (excluding admin users)
    const fetchStaffList = async () => {
      try {
        const { data, error } = await getAllStaff();
        if (error) {
          console.error('Error fetching staff:', error);
        } else {
          // Filter out admin users
          const nonAdminStaff = data?.filter(staff => staff.user_role !== 'admin') || [];
          setStaffList(nonAdminStaff);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      }
    };
    fetchStaffList();
  }, [fetchAttendanceData]);

  const handleGenerateQRCode = async (staff: Staff) => {
    setQrCodeLoading(true);
    try {
      const { data, error } = await getDailyQRCode(staff.id);
      if (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error}`,
          severity: 'error',
        });
        setQrCodeLoading(false);
      } else if (data && data.qr_value) {
        setQrCodeData({
          qrValue: data.qr_value,
          scanCount: data.scan_count,
          status: data.status,
        });
        setSelectedStaffForQR(staff);
        setQrCodeLoading(false);
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to generate QR code',
          severity: 'error',
        });
        setQrCodeLoading(false);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error',
      });
      setQrCodeLoading(false);
    }
  };


  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateHours = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn || !timeOut) return 'N/A';

    const start = new Date(`2000-01-01T${timeIn}`);
    const end = new Date(`2000-01-01T${timeOut}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return `${hours.toFixed(1)} Hours`;
  };

  const handleScannerClose = () => {
    setManualEntryOpen(false);
    setManualStaffId('');
  };

  const handleQRScan = (code: string) => {
    console.log('QR Code scanned - Raw value:', code);
    console.log('QR Code length:', code.length);
    console.log('QR Code character analysis:', code.split('').map((c, i) => `${i}: ${c} (${c.charCodeAt(0)})`).join(', '));
    
    const trimmedCode = code.trim();
    console.log('QR Code after trim:', trimmedCode);
    
    // Extract staff ID from QR value
    // The QR code contains the full UUID at the beginning, followed by date and token
    // Format: staffId-date-token or staffId_date_token
    
    let staffId: string | null = null;
    
    // Try to extract UUID pattern (8-4-4-4-12 hex digit groups)
    // This is a UUID in standard format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidMatch = trimmedCode.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
    
    console.log('UUID Regex Match Result:', uuidMatch);
    
    if (uuidMatch && uuidMatch[1]) {
      staffId = uuidMatch[1];
      console.log('✓ Successfully extracted staff ID from QR code:', staffId);
    } else {
      console.error('✗ Could not extract UUID from QR code');
      console.error('  Full QR value:', trimmedCode);
      console.error('  First 50 chars:', trimmedCode.substring(0, 50));
      setSnackbar({
        open: true,
        message: 'Invalid QR code format. Could not extract staff ID.',
        severity: 'error',
      });
      return;
    }

    // Validate QR code before recording
    validateQRCode(trimmedCode).then((validation) => {
      if (!validation.isValid) {
        console.error('QR code validation failed:', validation.message);
        setSnackbar({
          open: true,
          message: validation.message,
          severity: 'error',
        });
        return;
      }

      // Record the QR code scan
      recordQRCodeScan(trimmedCode).then((result) => {
        if (result.error) {
          console.error('QR code scan recording failed:', result.error);
          setSnackbar({
            open: true,
            message: result.error,
            severity: 'error',
          });
          return;
        }

        // Proceed with clock in/out using the extracted full staff ID
        console.log('✓ QR code scan successful, proceeding with clock in/out for staff:', staffId);
        setManualStaffId(staffId!);
        handleClockInOut(staffId!);
      });
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '500px',
          width: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto', width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: '20px',
                  color: '#1a202c',
                }}
              >
                Attendance Tracking
              </Typography>
              {userRole === 'admin' && (
                <Button
                  variant="contained"
                  onClick={() => setGenerateQRModalOpen(true)}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: '#3b82f6',
                    fontWeight: 600,
                    fontSize: '13px',
                    '&:hover': { backgroundColor: '#2563eb' },
                  }}
                >
                  Generate QR Code
                </Button>
              )}
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 2,
                mt: 2,
                width: '100%',
              }}
            >
              {[
                {
                  label: 'Present',
                  value: stats.present,
                  bg: '#d1fae5',
                  border: '#4caf50',
                  color: '#16a34a',
                },
                {
                  label: 'Late',
                  value: stats.late,
                  bg: '#fffbeb',
                  border: '#f59e0b',
                  color: '#d97706',
                },
                {
                  label: 'Absent',
                  value: stats.absent,
                  bg: '#fecaca',
                  border: '#fa0707',
                  color: '#dc2626',
                },
                {
                  label: 'On-Call',
                  value: stats.onCall,
                  bg: '#dbeafe',
                  border: '#1d7ff8',
                  color: '#3b82f6',
                },
              ].map((card) => (
                <Card
                  key={card.label}
                  sx={{
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    borderRadius: '16px',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ py: '8px !important', px: '16px !important' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#374151',
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: '12px',
                      }}
                    >
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: card.color, fontWeight: 700, fontSize: '28px' }}
                    >
                      {card.value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {userRole !== 'admin' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<FiClock size={16} />}
                  onClick={() => setQrScannerOpen(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    backgroundColor: '#10b981',
                    '&:hover': {
                      backgroundColor: '#059669',
                    },
                    '&:active': {
                      backgroundColor: '#10b981',
                    },
                  }}
                >
                  Scan QR Code
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setManualEntryOpen(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#eff6ff',
                    },
                  }}
                >
                  Manual Entry
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Attendance Table */}
      <Box sx={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1f2937',
              }}
            >
              Attendance Log
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                fontSize: '13px',
              }}
            >
              Latest attendance records
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Staff Name
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Time In
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Time Out
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Hours Worked
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary" sx={{ fontSize: '14px' }}>
                      No attendance records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendanceData.slice(0, 15).map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      borderBottom: '1px solid #e5e7eb',
                      '&:hover': {
                        backgroundColor: '#f9fafb',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {formatDate(row.date)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {row.staff_name || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        {formatTime(row.time_in)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        {formatTime(row.time_out)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {calculateHours(row.time_in, row.time_out)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '11px',
                          backgroundColor:
                            row.status === 'Present'
                              ? '#d1fae5'
                              : row.status === 'Late'
                                ? '#fee2e2'
                                : row.status === 'Absent'
                                  ? '#fecaca'
                                  : '#fef3c7',
                          color:
                            row.status === 'Present'
                              ? '#065f46'
                              : row.status === 'Late'
                                ? '#991b1b'
                                : row.status === 'Absent'
                                  ? '#7f1d1d'
                                  : '#92400e',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Camera Scanner Modal */}
      <QRScanner open={qrScannerOpen} onClose={() => setQrScannerOpen(false)} onScan={handleQRScan} />

      {/* Manual Entry Dialog */}
      <Dialog
        key="manual-entry-dialog"
        open={manualEntryOpen}
        onClose={handleScannerClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            margin: '16px',
            width: 'calc(100% - 32px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          Manual Entry - Clock In/Out
          <IconButton onClick={handleScannerClose} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <TextField
              autoFocus
              label="Staff ID"
              type="text"
              fullWidth
              value={manualStaffId}
              onChange={(e) => setManualStaffId(e.target.value)}
              placeholder="Enter your staff ID"
              variant="outlined"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && manualStaffId.trim()) {
                  handleClockInOut(manualStaffId.trim());
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
              Enter your staff ID to clock in or out. The system will automatically determine whether to clock in or out based on your current status.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            gap: 1,
            padding: 2,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Button
            onClick={handleScannerClose}
            variant="outlined"
            sx={{
              textTransform: 'none',
              color: '#6b7280',
              borderColor: '#d1d5db',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (manualStaffId.trim()) {
                handleClockInOut(manualStaffId.trim());
              }
            }}
            variant="contained"
            disabled={!manualStaffId.trim()}
            sx={{
              textTransform: 'none',
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': { backgroundColor: '#d1d5db', color: '#9ca3af' },
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate QR Code Modal */}
      <Dialog
        open={generateQRModalOpen}
        onClose={() => {
          if (!qrCodeLoading) {
            setGenerateQRModalOpen(false);
            setSelectedStaffForQR(null);
            setQrCodeData(null);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            margin: '16px',
            width: 'calc(100% - 32px)',
          },
        }}
        disableEscapeKeyDown={qrCodeLoading}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {selectedStaffForQR ? 'QR Code' : 'Select Staff'}
          <IconButton
            onClick={() => {
              if (!qrCodeLoading) {
                setGenerateQRModalOpen(false);
                setSelectedStaffForQR(null);
                setQrCodeData(null);
              }
            }}
            size="small"
            disabled={qrCodeLoading}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {!selectedStaffForQR ? (
            // Staff Selection
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '400px', overflow: 'auto' }}>
              {staffList.length === 0 ? (
                <Typography sx={{ color: '#6b7280', textAlign: 'center', py: 2 }}>
                  No staff members available
                </Typography>
              ) : (
                staffList.map((staff) => (
                  <Button
                    key={staff.id}
                    onClick={() => handleGenerateQRCode(staff)}
                    disabled={qrCodeLoading}
                    fullWidth
                    sx={{
                      textAlign: 'left',
                      p: 2,
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#1f2937',
                      backgroundColor: '#f9fafb',
                      '&:hover': {
                        backgroundColor: '#f3f4f6',
                        borderColor: '#d1d5db',
                      },
                      '&:disabled': {
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      justifyContent: 'flex-start',
                    }}
                  >
                    {qrCodeLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography>Loading...</Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                          {staff.name}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>
                          {staff.role} • {staff.department || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Button>
                ))
              )}
            </Box>
          ) : (
            // QR Code Display
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {qrCodeData ? (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                    }}
                  >
                    <QRCodeSVG
                      value={qrCodeData.qrValue}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontSize: '14px',
                        color: '#1f2937',
                        fontWeight: 600,
                      }}
                    >
                      {selectedStaffForQR.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Status: ${qrCodeData.status === 'active' ? 'Active' : 'Invalid'}`}
                        color={qrCodeData.status === 'active' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Scans: ${qrCodeData.scanCount}/2`}
                        color={qrCodeData.scanCount >= 2 ? 'error' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        color: '#6b7280',
                        wordBreak: 'break-all',
                        p: 1,
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {qrCodeData.qrValue}
                    </Typography>
                  </Box>
                </>
              ) : (
                <CircularProgress />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {selectedStaffForQR && (
            <Button
              onClick={() => {
                setSelectedStaffForQR(null);
                setQrCodeData(null);
              }}
              variant="outlined"
              sx={{
                textTransform: 'none',
                color: '#6b7280',
                borderColor: '#d1d5db',
              }}
            >
              Select Different Staff
            </Button>
          )}
          <Button
            onClick={() => {
              setGenerateQRModalOpen(false);
              setSelectedStaffForQR(null);
              setQrCodeData(null);
            }}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Attendance;
