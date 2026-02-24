import { useState, useEffect } from 'react';
import '../styles/Pages.css';
import {
  Box, Card, CardContent, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, InputAdornment,
  CircularProgress, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, Select, MenuItem, IconButton, Snackbar, Alert,
} from '@mui/material';
import { FiSearch, FiCalendar, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { getAllSchedules, getSchedulesByStaffId, createSchedule, deleteSchedule } from '../../backend/services/scheduleService';
import { getAllStaff } from '../../backend/services/staffService';
import { useAuth } from '../../contexts/AuthContext';
import type { Schedule, Staff } from '../../types';

interface ScheduleWithStaff extends Schedule {
  staff?: Staff;
}

function Schedule() {
  const { isAdmin, staffProfile } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleWithStaff[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    staff_id: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '17:00',
    notes: '',
  });

  useEffect(() => { fetchData(); }, [staffProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let schedulesPromise;
      if (isAdmin) {
        schedulesPromise = getAllSchedules();
      } else if (staffProfile) {
        schedulesPromise = getSchedulesByStaffId(staffProfile.id);
      } else {
        schedulesPromise = Promise.resolve({ data: [], error: null });
      }
      const [staffResult, schedulesResult] = await Promise.all([
        getAllStaff(),
        schedulesPromise,
      ]);
      const allStaff = staffResult.data ?? [];
      setStaff(allStaff);
      if (schedulesResult.data) {
        const merged = schedulesResult.data.map(s => ({
          ...s,
          staff: allStaff.find(st => st.id === s.staff_id),
        }));
        setSchedules(merged);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (msg: string, sev: 'success' | 'error') => setSnackbar({ open: true, message: msg, severity: sev });

  const handleOpenModal = () => {
    setFormData({
      staff_id: isAdmin ? '' : (staffProfile?.id ?? ''),
      day_of_week: 1,
      start_time: '08:00',
      end_time: '17:00',
      notes: '',
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    const targetStaffId = isAdmin ? formData.staff_id : staffProfile?.id;
    if (!targetStaffId) { showSnackbar('No staff selected', 'error'); return; }
    if (!formData.start_time || !formData.end_time) { showSnackbar('Please fill in start and end time', 'error'); return; }
    if (formData.start_time >= formData.end_time) { showSnackbar('End time must be after start time', 'error'); return; }

    const { error } = await createSchedule({
      staff_id: targetStaffId,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      notes: formData.notes || null,
      is_active: true,
    });

    if (error) { showSnackbar(error, 'error'); }
    else {
      showSnackbar('Schedule added successfully', 'success');
      setOpenModal(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    const { error } = await deleteSchedule(id);
    if (error) { showSnackbar(error, 'error'); fetchData(); }
    else showSnackbar('Schedule removed', 'success');
  };

  // Calculate summary statistics
  const totalStaff = staff.filter(s => s.status === 'Active').length;
  const activeSchedules = schedules.filter(s => s.is_active).length;
  const todaySchedules = schedules.filter(s => 
    s.is_active && s.day_of_week === new Date().getDay()
  ).length;

  const summaryCards = [
    { 
      title: 'Active Staff', 
      value: totalStaff.toString(), 
      bgColor: '#f0fdf4',
      textColor: '#166534',
      borderColor: '#bbf7d0'
    },
    { 
      title: 'Shifts Today', 
      value: todaySchedules.toString(), 
      bgColor: '#eff6ff',
      textColor: '#1e40af',
      borderColor: '#bfdbfe'
    },
    { 
      title: 'Total Schedules', 
      value: activeSchedules.toString(), 
      bgColor: '#fef2f2',
      textColor: '#991b1b',
      borderColor: '#fecaca'
    },
    { 
      title: 'Staff Scheduled', 
      value: new Set(schedules.filter(s => s.is_active).map(s => s.staff_id)).size.toString(), 
      bgColor: '#fff7ed',
      textColor: '#9a3412',
      borderColor: '#fed7aa'
    }
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group schedules by day and time
  const groupedSchedules: Record<number, ScheduleWithStaff[]> = {};
  schedules.filter(s => s.is_active).forEach(schedule => {
    if (!groupedSchedules[schedule.day_of_week]) {
      groupedSchedules[schedule.day_of_week] = [];
    }
    groupedSchedules[schedule.day_of_week].push(schedule);
  });

  // Filter schedules based on search
  const filteredSchedules = searchTerm
    ? schedules.filter(s => 
        s.staff?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staff?.role.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : schedules;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* Top Header Bar */}
      <Box sx={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#111827' }}>
            {isAdmin ? 'Schedule Management' : 'My Schedule'}
          </Typography>
          {!isAdmin && (
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              Manage your personal work schedule
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search staff or role..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              width: '100%',
              maxWidth: '280px',
              backgroundColor: 'white',
              borderRadius: '6px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '6px',
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch style={{ color: '#6b7280', fontSize: '16px' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={handleOpenModal}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      {/* Schedule Summary Cards */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            color: '#374151',
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          Schedule Summary
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '14px' 
        }}>
          {summaryCards.map((card) => (
            <Card 
              key={card.title}
              sx={{ 
                backgroundColor: card.bgColor,
                borderRadius: '10px',
                boxShadow: 'none',
                border: `1px solid ${card.borderColor}`
              }}
            >
              <CardContent sx={{ padding: '18px !important' }}>
                <Typography 
                  sx={{ 
                    fontSize: '12px', 
                    fontWeight: 500,
                    color: card.textColor,
                    marginBottom: '8px',
                    opacity: 0.85
                  }}
                >
                  {card.title}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: '28px', 
                    fontWeight: 700,
                    color: card.textColor,
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Weekly Schedule */}
      <Box sx={{ marginBottom: '24px', width: '100%' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            textAlign: 'center',
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <FiCalendar />
          Weekly Schedule
        </Typography>
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: '8px',
            boxShadow: 'none',
            border: '1px solid #e5e7eb',
            width: '100%',
            overflowX: 'auto'
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day, idx) => (
                  <TableCell 
                    key={day}
                    align="center"
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: idx === 0 ? '#fee2e2' : '#f9fafb',
                      color: '#374151',
                      width: '14.28%',
                      fontSize: '11px',
                      padding: '8px 4px'
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDays.map((day, idx) => {
                  const daySchedules = groupedSchedules[idx] || [];
                  return (
                    <TableCell 
                      key={`${day}-cell`}
                      sx={{ 
                        backgroundColor: idx === 0 ? '#fef2f2' : 'white',
                        padding: '8px',
                        verticalAlign: 'top',
                        minHeight: '200px'
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {daySchedules.length === 0 ? (
                          <Typography sx={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', mt: 2 }}>
                            No schedules
                          </Typography>
                        ) : (
                          daySchedules.map((schedule) => (
                            <Box 
                              key={schedule.id}
                              sx={{
                                backgroundColor: '#fef9c3',
                                padding: '6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                lineHeight: '1.3',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: '#713f12', marginBottom: '2px' }}>
                                {schedule.staff?.name || 'Unknown'}
                              </div>
                              <div style={{ color: '#92400e', fontSize: '8px' }}>
                                {schedule.staff?.role || 'N/A'}
                              </div>
                              <div style={{ color: '#92400e', fontSize: '8px', marginTop: '2px' }}>
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </div>
                              {schedule.notes && (
                                <div style={{ color: '#92400e', fontSize: '7px', marginTop: '2px', fontStyle: 'italic' }}>
                                  {schedule.notes}
                                </div>
                              )}
                            </Box>
                          ))
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* All Schedules Table */}
      <Box sx={{ width: '100%' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          All Schedules
        </Typography>
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: '8px',
            boxShadow: 'none',
            border: '1px solid #e5e7eb',
            width: '100%',
            overflowX: 'auto'
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '20%', padding: '8px 6px' }}>Staff</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '15%', padding: '8px 6px' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '10%', padding: '8px 6px' }}>Day</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '25%', padding: '8px 6px' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '20%', padding: '8px 6px' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '10%', padding: '8px 6px' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '11px', width: '6%', padding: '8px 6px' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                    No schedules found. Create schedules to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow 
                    key={schedule.id}
                    sx={{ 
                      '&:hover': { backgroundColor: '#f9fafb' },
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <TableCell sx={{ color: '#1f2937', fontWeight: 500, fontSize: '11px', padding: '8px 6px' }}>
                      {schedule.staff?.name || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '11px', padding: '8px 6px' }}>
                      {schedule.staff?.role || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '11px', padding: '8px 6px' }}>
                      {weekDays[schedule.day_of_week]}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '11px', padding: '8px 6px' }}>
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '10px', padding: '8px 6px' }}>
                      {schedule.notes || '-'}
                    </TableCell>
                    <TableCell sx={{ padding: '8px 6px' }}>
                      <Box 
                        sx={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: schedule.is_active ? '#d1fae5' : '#fee2e2',
                          color: schedule.is_active ? '#065f46' : '#991b1b'
                        }}
                      >
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: '8px 6px' }}>
                      {(isAdmin || schedule.staff_id === staffProfile?.id) && (
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(schedule.id)}
                          sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}
                        >
                          <FiTrash2 size={14} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* Add Schedule Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Add Schedule</Typography>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {isAdmin && (
              <FormControl fullWidth size="small">
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: '#374151' }}>Staff Member</Typography>
                <Select
                  value={formData.staff_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value }))}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Select staff…</MenuItem>
                  {staff.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name} — {s.role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth size="small">
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: '#374151' }}>Day of Week</Typography>
              <Select
                value={formData.day_of_week}
                onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
              >
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((day, i) => (
                  <MenuItem key={day} value={i}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: '#374151', display: 'block' }}>Start Time</Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: '#374151', display: 'block' }}>End Time</Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: '#374151', display: 'block' }}>Notes (optional)</Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Any additional notes…"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ textTransform: 'none', backgroundColor: '#2563eb', '&:hover': { backgroundColor: '#1d4ed8' } }}
          >
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Schedule;
