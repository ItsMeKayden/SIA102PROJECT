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
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

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
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [activeStaff, setActiveStaff] = useState<number | null>(null);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);

  // Table pagination state
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const monthLabel =
    MONTHS.find((m) => m.value === selectedMonth)?.label ?? 'Month';
  const totalRows = attendanceData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage;
  const endRow = Math.min(currentPage * rowsPerPage, totalRows);
  const visibleRows = attendanceData.slice(startRow, endRow);

  // Reset to page 1 whenever rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStaff, selectedMonth, selectedYear, rowsPerPage]);

  // Fetch doctors when the website is reloaded
  useEffect(() => {
    async function loadDoctors() {
      setLoadingStaff(true);
      const doctors = await fetchDoctors();
      setStaffList(doctors);
      if (doctors.length > 0) setActiveStaff(doctors[0].doctorID);
      setLoadingStaff(false);
    }
    loadDoctors();
  }, []);

  // Refresh data whenever something in the filter changes (activeStaff, month, year)
  useEffect(() => {
    if (activeStaff === null) return;
    async function loadAttendance() {
      setLoadingAttendance(true);
      const records = await fetchAttendanceRecords(
        activeStaff!,
        selectedMonth,
        selectedYear,
      );
      setAttendanceData(records);
      setLoadingAttendance(false);
    }
    loadAttendance();
  }, [activeStaff, selectedMonth, selectedYear]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        p: 2,
        background: '#f0f4ff',
        minHeight: '100vh',
      }}
    >
      {/*Top Filter Row*/}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 1,
          flexWrap: 'nowrap',
        }}
      >
        {/*Month pill*/}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            background: '#fff',
            border: '1px solid #d1d9f0',
            borderRadius: 1.5,
            px: 1.5,
            py: 0.6,
            flexShrink: 0,
            width: 'fit-content',
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 500,
              color: '#374151',
              whiteSpace: 'nowrap',
            }}
          >
            Month – {monthLabel}
          </Typography>
          <CalendarTodayIcon sx={{ fontSize: 13, color: '#6b7280' }} />
        </Box>

        {/*Month & Year dropdowns*/}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            size="small"
            MenuProps={MENU_PROPS}
            sx={{
              fontSize: 12,
              background: '#fff',
              borderRadius: 1.5,
              width: 110,
              height: 30,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d9f0' },
              '& .MuiSelect-select': { py: 0.4, px: 1.25, fontSize: 12 },
            }}
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
            MenuProps={MENU_PROPS}
            sx={{
              fontSize: 12,
              background: '#fff',
              borderRadius: 1.5,
              width: 90,
              height: 30,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d9f0' },
              '& .MuiSelect-select': { py: 0.4, px: 1.25, fontSize: 12 },
            }}
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
    <>
      {/* Staff Activity Overview */}
      <h2 className="activityTitle">Staff Activity Overview</h2>
      <Box className="activityOverview" sx={{ gap: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {cardData.map((card, index) => (
          <Card
            key={index}
            sx={{
              flex: '1 1 160px',
              minWidth: '160px',
              maxWidth: '200px',
              height: 100,
              backgroundColor: card.bgColor,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
      <TableContainer component={Paper} sx={{ mt: 4, width: '100%' }}>
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
            {attendanceData.map((row, index) => (
              <TableRow key={index}>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.date}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.timeIn}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.timeOut}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.shift}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.hours}</TableCell>
                <TableCell align="center" sx={{ fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.status}</TableCell>
              </TableRow>
            ))}
          </Select>
        </Box>
      </Box>

      {/*Staff Cards*/}
      <Box
        sx={{
          background: '#dce5ff',
          borderRadius: 3,
          p: 1.5,
          mb: 1,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {loadingStaff ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#2563eb' }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                width: '100%',
                pb: 0.5,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': {
                  background: '#b0bfea',
                  borderRadius: 2,
                },
              }}
            >
              {staffList.map((staff) => {
                const isActive = activeStaff === staff.doctorID;
                return (
                  <Card
                    key={staff.doctorID}
                    onClick={() => setActiveStaff(staff.doctorID)}
                    elevation={0}
                    sx={{
                      minWidth: 'calc(20% - 10px)',
                      maxWidth: 'calc(20% - 10px)',
                      flexShrink: 0,
                      borderRadius: 2.5,
                      background: isActive ? '#2563eb' : '#fff',
                      boxShadow: isActive
                        ? '0 4px 14px rgba(37,99,235,0.3)'
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <CardContent
                      sx={{
                        p: '12px !important',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          mb: 0.5,
                        }}
                      >
                        <MoreVertIcon
                          sx={{
                            fontSize: 15,
                            color: isActive
                              ? 'rgba(255,255,255,0.5)'
                              : '#c4cad8',
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isActive ? '#22c55e' : '#dce5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 0.75,
                          mx: 'auto',
                        }}
                      >
                        <PersonOutlineIcon
                          sx={{
                            fontSize: 23,
                            color: isActive ? '#fff' : '#2563eb',
                          }}
                        />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: isActive ? '#fff' : '#111827',
                          textAlign: 'center',
                          lineHeight: 1.3,
                          mb: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          px: 0.5,
                        }}
                      >
                        {staff.doctor_name}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: isActive ? 'rgba(255,255,255,0.7)' : '#6b7280',
                          textAlign: 'center',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          px: 0.5,
                        }}
                      >
                        {staff.department}
                      </Typography>

                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: 10,
                          fontWeight: 600,
                          borderRadius: 1.25,
                          textTransform: 'none',
                          py: 0.5,
                          color: '#2563eb',
                          background: isActive ? '#fff' : 'transparent',
                          borderColor: isActive ? '#fff' : '#2563eb',
                          mx: 'auto',
                          display: 'block',
                          '&:hover': {
                            background: '#eef2ff',
                            borderColor: isActive ? '#fff' : '#2563eb',
                          },
                        }}
                      >
                        See Profile
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {/*Card scroll indicator*/}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 0.5,
                mt: 1,
              }}
            >
              <IconButton
                size="small"
                sx={{
                  background: '#fff',
                  border: '1px solid #c8d3f0',
                  borderRadius: 1,
                  width: 22,
                  height: 22,
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 13 }} />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  background: '#2563eb',
                  borderRadius: 1,
                  width: 22,
                  height: 22,
                  '&:hover': { background: '#1d4ed8' },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 13, color: '#fff' }} />
              </IconButton>
              <Typography sx={{ fontSize: 10, color: '#6b7280' }}>
                {`1-${Math.min(5, staffList.length)} of ${staffList.length}`}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/*Attendance Table*/}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid #e4eaff',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow sx={{ background: '#f8faff' }}>
              {[
                { label: 'Staff Name', width: '20%' },
                { label: 'Department', width: '18%' },
                { label: 'Date', width: '14%' },
                { label: 'Check In Time', width: '15%' },
                { label: 'Check Out Time', width: '15%' },
                { label: 'Details', width: '10%' },
              ].map((col) => (
                <TableCell
                  key={col.label}
                  sx={{
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: 12,
                    py: 1.5,
                    width: col.width,
                    borderBottom: '1px solid #e4eaff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingAttendance ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#2563eb' }} />
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
            </Select>
          </Box>

          {/* Page navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              sx={{
                background: '#fff',
                border: '1px solid #c8d3f0',
                borderRadius: 1,
                width: 22,
                height: 22,
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 13 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalRows === 0}
              sx={{
                background: '#2563eb',
                borderRadius: 1,
                width: 22,
                height: 22,
                '&:hover': { background: '#1d4ed8' },
                '&.Mui-disabled': { opacity: 0.4, background: '#2563eb' },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 13, color: '#fff' }} />
            </IconButton>
            <Typography sx={{ fontSize: 10, color: '#6b7280' }}>
              {totalRows === 0
                ? '0 of 0'
                : `${startRow + 1}-${endRow} of ${totalRows}`}
            </Typography>
          </Box>
        </Box>
      </TableContainer>
    </Box>
  );
}

export default Attendance;
