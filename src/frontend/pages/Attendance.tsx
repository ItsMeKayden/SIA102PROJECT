import { useState, useEffect } from 'react';
import '../styles/Attendance.css';
import '../styles/Pages.css';
import { useEffect, useState } from 'react';
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
} from '@mui/material';
import { getAllAttendance } from '../../backend/services/attendanceService';
import type { Attendance } from '../../types';

import {
  fetchDoctors,
  fetchAttendanceRecords,
  type Staff,
  type AttendanceRecord,
} from '../../backend/services/attendanceService';

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

//Menuprops for all dropdowns
const MENU_PROPS = {
  PaperProps: {
    sx: {
      minWidth: 'unset !important',
      width: 'auto',
      '& .MuiMenuItem-root': {
        fontSize: 12,
        py: 0.6,
        px: 1.5,
        minHeight: 'unset',
      },
    },
  },
  anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
  transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
};

// Main Component
function Attendance() {
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    overtime: 0,
    compliance: 'Loading...',
  });

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // Fetch all attendance records
      const { data: attendanceRecords, error: attendanceError } = await getAllAttendance();
      
      if (attendanceError) {
        setError(attendanceError);
        return;
      }

      setAttendanceData(attendanceRecords || []);

      // Calculate stats from the data
      if (attendanceRecords && attendanceRecords.length > 0) {
        const present = attendanceRecords.filter(a => a.status === 'Present').length;
        const late = attendanceRecords.filter(a => a.status === 'Late').length;
        
        // Calculate overtime by checking hours worked
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
      hour: 'numeric',
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

  const cardData = [
    { title: 'Present', value: stats.present.toString(), bgColor: '#e3f2fd' },
    { title: 'Late', value: stats.late.toString(), bgColor: '#fff3e0' },
    { title: 'Overtime', value: `${stats.overtime}`, bgColor: '#f3e5f5' },
    { title: 'Compliance', value: stats.compliance, bgColor: '#e8f5e9' },
  ];

  const complianceAlerts = attendanceData
    .filter(a => {
      if (a.status === 'Late' || a.status === 'Absent') return true;
      // Check for overtime
      if (a.time_in && a.time_out) {
        const start = new Date(`2000-01-01T${a.time_in}`);
        const end = new Date(`2000-01-01T${a.time_out}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return hours > 8;
      }
      return false;
    })
    .slice(0, 5)
    .map(a => {
      let type = 'Late';
      if (a.status === 'Absent') type = 'Absent';
      else if (a.status === 'Late') type = 'Late';
      else if (a.time_in && a.time_out) {
        const start = new Date(`2000-01-01T${a.time_in}`);
        const end = new Date(`2000-01-01T${a.time_out}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (hours > 8) type = 'Overtime';
      }
      return {
        date: new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        type,
      };
    });

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
            }}
          >
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '13px' }}>
                {card.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  marginTop: 1,
                  fontSize: '24px'
                }}
              >
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Attendance Log Table */}
      <h2 className="tableTitle">Attendance Log Table</h2>
      <TableContainer component={Paper} sx={{ mt: 4, width: '100%', overflowX: 'auto' }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead sx={{ backgroundColor: 'blue' }}>
            <TableRow>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '12%' }}
              >
                Time
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '16%' }}
              >
                Time In
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '16%' }}
              >
                Time Out
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '18%' }}
              >
                Shift
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '20%' }}
              >
                Hours Worked
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold', fontSize: '12px', padding: '10px 8px', width: '18%' }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {attendanceData.slice(0, 10).map((row) => (
              <TableRow key={row.id}>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(row.date)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatTime(row.time_in)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatTime(row.time_out)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>N/A</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{calculateHours(row.time_in, row.time_out)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: row.status === 'Present' ? '#d1fae5' : row.status === 'Late' ? '#fee2e2' : row.status === 'Absent' ? '#fecaca' : '#fef3c7',
                    color: row.status === 'Present' ? '#065f46' : row.status === 'Late' ? '#991b1b' : row.status === 'Absent' ? '#7f1d1d' : '#92400e',
                  }}>
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 3, fontSize: 12, color: '#6b7280' }}
                >
                  No attendance records found for {monthLabel} {selectedYear}.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  sx={{
                    background: index % 2 === 0 ? '#fff' : '#f8faff',
                    '&:hover': { background: '#f0f4ff' },
                  }}
                >
                  <TableCell
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#111827',
                      py: 1.25,
                    }}
                  >
                    {row.doctor_name}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#374151', py: 1.25 }}>
                    {row.department}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#374151', py: 1.25 }}>
                    {row.date}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#374151', py: 1.25 }}>
                    {row.checkIn}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#374151', py: 1.25 }}>
                    {row.checkOut}
                  </TableCell>
                  <TableCell sx={{ py: 1.25 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 1,
                        textTransform: 'none',
                        px: 1.5,
                        py: 0.25,
                        color: '#2563eb',
                        borderColor: '#2563eb',
                        minWidth: 0,
                        boxShadow: 'none',
                        '&:hover': {
                          background: '#eef2ff',
                          borderColor: '#2563eb',
                        },
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/*Table Footer*/}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderTop: '1px solid #e4eaff',
            background: '#fff',
          }}
        >
          {/*Rows per page section*/}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
              Show
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              size="small"
              MenuProps={MENU_PROPS}
              sx={{
                fontSize: 11,
                height: 26,
                width: 55,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d9f0',
                },
                '& .MuiSelect-select': { py: 0.25, px: 0.75, fontSize: 11 },
              }}
            >
              {[5, 10, 25].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}

export default Attendance;
