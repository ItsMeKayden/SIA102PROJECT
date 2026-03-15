import '../styles/Pages.css';
import { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { FiClock, FiX } from 'react-icons/fi';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  getAllAttendance,
  clockIn,
  clockOut,
  isStaffClockedIn,
} from '../../backend/services/attendanceService';
import type { Attendance as AttendanceType } from '../../types';

// Main Component
function Attendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualStaffId, setManualStaffId] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    overtime: 0,
    compliance: 'Loading...',
  });

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // Initialize QR code scanner when modal opens
  useEffect(() => {
    if (scannerOpen && scannerRef.current === null) {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-scanner',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false,
        );

        const onScanSuccess = (decodedText: string) => {
          console.log('QR Code scanned:', decodedText);
          setManualStaffId(decodedText);
          scanner.clear();
          setScannerOpen(false);
          scannerRef.current = null;
        };

        const onScanError = () => {
          // Silent fail - continue scanning
        };

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
      } catch (error) {
        console.error('Failed to initialize scanner:', error);
      }
    }

    return () => {
      if (scannerRef.current !== null) {
        scannerRef.current.clear().catch((err: unknown) => {
          console.error('Error clearing scanner:', err);
        });
        scannerRef.current = null;
      }
    };
  }, [scannerOpen]);

  const fetchAttendanceData = async () => {
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

        const overtime = records.filter((a: AttendanceType) => {
          if (!a.time_in || !a.time_out) return false;
          const start = new Date(`2000-01-01T${a.time_in}`);
          const end = new Date(`2000-01-01T${a.time_out}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return hours > 8;
        }).length;

        setStats({
          present,
          late,
          overtime,
          compliance: late === 0 ? 'Compliant' : 'Needs Review',
        });
      } else {
        setStats({
          present: 0,
          late: 0,
          overtime: 0,
          compliance: 'No Data',
        });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateHours = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn || !timeOut) return 'N/A';

    const start = new Date(`2000-01-01T${timeIn}`);
    const end = new Date(`2000-01-01T${timeOut}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return `${hours.toFixed(1)} Hours`;
  };

  const handleClockInOut = async (staffId: string) => {
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
          setIsClockedIn(false);
          setManualStaffId('');
          handleScannerClose();
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
          setIsClockedIn(true);
          setManualStaffId('');
          handleScannerClose();
          fetchAttendanceData(); // Refresh attendance data
        }
      }
    } catch (error) {
      console.error('Error during clock in/out:', error);
      setSnackbar({
        open: true,
        message: 'An unexpected error occurred',
        severity: 'error',
      });
    }
  }

  const handleScannerClose = () => {
    if (scannerRef.current !== null) {
      scannerRef.current.clear().catch((err: unknown) => {
        console.error('Error clearing scanner:', err);
      });
      scannerRef.current = null;
    }
    setScannerOpen(false);
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: '20px',
                color: '#1a202c',
              }}
            >
              Attendance Tracking
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                {attendanceData.length} records total
              </Typography>
              <Typography sx={{ color: '#d1d5db' }}>·</Typography>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: '#10b981',
                  fontWeight: 500,
                }}
              >
                {stats.present} present
              </Typography>
              <Typography sx={{ color: '#d1d5db' }}>·</Typography>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: '#f59e0b',
                  fontWeight: 500,
                }}
              >
                {stats.late} late
              </Typography>
              <Typography sx={{ color: '#d1d5db' }}>·</Typography>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: '#3b82f6',
                  fontWeight: 500,
                }}
              >
                {stats.overtime} overtime
              </Typography>
              <Typography sx={{ color: '#d1d5db' }}>·</Typography>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: '#6366f1',
                  fontWeight: 500,
                }}
              >
                {stats.compliance}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<FiClock size={16} />}
            onClick={() => setScannerOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              backgroundColor: isClockedIn ? '#ef4444' : '#10b981',
              '&:hover': {
                backgroundColor: isClockedIn ? '#dc2626' : '#059669',
              },
            }}
          >
            Clock In/Clock Out
          </Button>
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
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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

      {/* QR Code Scanner Modal */}
      <Dialog
        open={scannerOpen}
        onClose={handleScannerClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            margin: '16px',
            width: 'calc(100% - 32px)',
            maxWidth: '500px',
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
          Scan Staff QR Code
          <IconButton onClick={handleScannerClose} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box
              id="qr-scanner"
              sx={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid #e5e7eb',
              }}
            />
            <Typography
              sx={{
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Point your camera at a staff QR code to scan it
            </Typography>
            <TextField
              fullWidth
              placeholder="Or enter staff ID manually"
              value={manualStaffId}
              onChange={(e) => setManualStaffId(e.target.value)}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleScannerClose}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleClockInOut(manualStaffId)}
            variant="contained"
            disabled={!manualStaffId}
            sx={{
              textTransform: 'none',
              backgroundColor: '#3b82f6',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            Clock In/Out
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
