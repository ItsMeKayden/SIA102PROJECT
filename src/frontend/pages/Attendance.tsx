import { useState, useEffect } from 'react';
import '../styles/Attendance.css';
import '../styles/Pages.css';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Select,
  MenuItem,
  Button,
  IconButton,
} from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { getAllAttendance } from '../../backend/services/attendanceService';
import type { Attendance as AttendanceRecord } from '../../types';

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function Attendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    overtime: 0,
    compliance: 'Loading...',
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const { data: attendanceRecords, error: attendanceError } = await getAllAttendance();
      
      if (attendanceError) {
        setError(attendanceError);
        return;
      }

      setAttendanceData(attendanceRecords || []);

      if (attendanceRecords && attendanceRecords.length > 0) {
        const present = attendanceRecords.filter(a => a.status === 'Present').length;
        const late = attendanceRecords.filter(a => a.status === 'Late').length;
        
        const overtime = attendanceRecords.filter(a => {
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
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
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

  if (loading) {
    return (
      <div className="attendance-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-container">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || '';
  
  const cardData = [
    { label: 'Present', value: stats.present, color: '#10b981', bgColor: '#ecfdf5' },
    { label: 'Late', value: stats.late, color: '#f59e0b', bgColor: '#fffbeb' },
    { label: 'Overtime', value: stats.overtime, color: '#3b82f6', bgColor: '#eff6ff' },
    { label: 'Compliance', value: stats.compliance, color: '#6366f1', bgColor: '#eef2ff' },
  ];

  const filteredData = attendanceData.filter(a => {
    const aDate = new Date(a.date);
    return aDate.getMonth() + 1 === selectedMonth && aDate.getFullYear() === selectedYear;
  });

  const startIndex = currentPage * rowsPerPage;
  const visibleRows = filteredData.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="attendance-container">
      {/* Staff Activity Overview */}
      <h2 className="activityTitle">Staff Activity Overview</h2>
      <Box className="activityOverview" sx={{ gap: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}>
        {cardData.map((card, index) => (
          <Card
            key={index}
            sx={{
              flex: '1 1 160px',
              minWidth: '160px',
              maxWidth: '220px',
              height: 100,
              backgroundColor: card.bgColor,
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CardContent sx={{ padding: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: card.color }}>
                {card.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: card.color }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Date Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Filter by date:</Typography>
        <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          size="small"
          sx={{ width: 120 }}
        >
          {MONTHS.map((m) => (
            <MenuItem key={m.value} value={m.value}>
              {m.label}
            </MenuItem>
          ))}
        </Select>
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          size="small"
          sx={{ width: 100 }}
        >
          {YEARS.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Attendance Table */}
      <h2 className="tableTitle">Attendance Log for {monthLabel} {selectedYear}</h2>
      <TableContainer component={Paper} sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead sx={{ backgroundColor: '#f9fafb' }}>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '15%' }}>
                Staff ID
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '15%' }}>
                Date
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '12%' }}>
                Check In
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '12%' }}>
                Check Out
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '12%' }}>
                Status
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px', width: '12%' }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#9ca3af' }}>
                  No attendance records found for {monthLabel} {selectedYear}.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    background: index % 2 === 0 ? '#fff' : '#f8faff',
                    '&:hover': { backgroundColor: '#f3f4f6' },
                  }}
                >
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    {row.staff_id || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    {new Date(row.date).toLocaleDateString('en-US')}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    {formatTime(row.time_in)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    {formatTime(row.time_out)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: row.status === 'Present' ? '#d1fae5' : row.status === 'Late' ? '#fef3c7' : '#fee2e2',
                        color: row.status === 'Present' ? '#065f46' : row.status === 'Late' ? '#92400e' : '#991b1b',
                        fontWeight: 500,
                        fontSize: '11px',
                      }}
                    >
                      {row.status}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', padding: '10px 8px' }}>
                    <Button size="small" variant="outlined" sx={{ fontSize: '11px' }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            size="small"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="caption">
            Page {currentPage + 1} of {Math.ceil(filteredData.length / rowsPerPage)}
          </Typography>
          <IconButton
            size="small"
            disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage) - 1}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption">Rows per page:</Typography>
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(0);
            }}
            size="small"
            sx={{ width: 60 }}
          >
            {[5, 10, 25].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>
    </div>
  );
}

export default Attendance;
