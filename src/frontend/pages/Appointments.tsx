import '../styles/Pages.css';
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  FiPlus,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiPlay,
  FiSearch,
} from 'react-icons/fi';
import type { Appointment, Staff } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllAppointments,
  createAppointment,
  completeAppointment,
  cancelAppointment,
  approveAppointment,
  rejectAppointment,
  acceptAssignedAppointment,
  rejectAssignedAppointment,
  startAppointment,
  noShowAppointment,
  rescheduleAppointment,
  getAppointmentStats,
} from '../../backend/services/appointmentService';
import {
  getAllStaff,
  updateDutyStatus,
} from '../../backend/services/staffService';
import { createNotification } from '../../backend/services/notificationService';

function Appointments() {
  const { isAdmin, staffProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    id: '',
    date: '',
    time: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_contact: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointData, staffData, statsData] = await Promise.all([
        getAllAppointments(),
        getAllStaff(),
        getAppointmentStats(),
      ]);
      if (appointData.data) setAppointments(appointData.data);
      if (staffData.data)
        setDoctors(
          staffData.data.filter(
            (s) => s.role === 'Doctor' || s.role === 'doctor',
          ),
        );
      if (statsData.data) {
        const pending =
          appointData.data?.filter(
            (a) => a.status === 'Pending' || a.status === 'Assigned',
          ).length ?? 0;
        setStats({ ...statsData.data, pending });
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (msg: string, sev: 'success' | 'error') =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const today = new Date().toISOString().split('T')[0];

  const isValidPHPhone = (v: string) => /^(09\d{9}|\+639\d{9})$/.test(v.trim());

  // ── Create ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (
      !formData.patient_name ||
      !formData.doctor_id ||
      !formData.appointment_date ||
      !formData.appointment_time
    ) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    if (formData.appointment_date < today) {
      showSnackbar('Appointment date cannot be in the past', 'error');
      return;
    }
    if (formData.appointment_date === today) {
      const nowTime = new Date().toTimeString().slice(0, 5);
      if (formData.appointment_time < nowTime) {
        showSnackbar('Appointment time cannot be in the past', 'error');
        return;
      }
    }
    if (formData.patient_contact && !isValidPHPhone(formData.patient_contact)) {
      showSnackbar(
        'Enter a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX',
        'error',
      );
      return;
    }
    const selectedDoctor = doctors.find((d) => d.id === formData.doctor_id);
    const status = isAdmin ? 'Assigned' : 'Pending';
    const { error } = await createAppointment({
      patient_name: formData.patient_name,
      patient_contact: formData.patient_contact || 'N/A',
      doctor_id: formData.doctor_id,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      notes: formData.notes || null,
      status,
    });
    if (error) {
      showSnackbar(error, 'error');
      return;
    }
    if (isAdmin) {
      await createNotification({
        staff_id: formData.doctor_id,
        title: 'Appointment Assigned to You',
        message: `Admin assigned an appointment for patient "${formData.patient_name}" on ${formData.appointment_date} at ${formData.appointment_time}. Please accept or reject.`,
        type: 'info',
      });
      showSnackbar(
        'Appointment assigned — awaiting doctor approval',
        'success',
      );
    } else {
      await createNotification({
        staff_id: null,
        title: 'New Appointment Pending Approval',
        message: `${staffProfile?.name ?? 'A staff member'} submitted an appointment for patient "${formData.patient_name}" with ${selectedDoctor?.name ?? 'a doctor'} on ${formData.appointment_date} at ${formData.appointment_time}.`,
        type: 'info',
      });
      showSnackbar('Appointment submitted for admin approval', 'success');
    }
    setOpenModal(false);
    fetchData();
    setFormData({
      patient_name: '',
      patient_contact: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      notes: '',
    });
  };

  const handleAdminApprove = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a)),
    );
    const { error } = await approveAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment approved', 'success');
    fetchData();
  };

  const handleAdminReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a)),
    );
    const { error } = await rejectAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment rejected', 'success');
    fetchData();
  };

  const handleDoctorAccept = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a)),
    );
    const { error } = await acceptAssignedAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment accepted', 'success');
    fetchData();
  };

  const handleDoctorReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a)),
    );
    const { error } = await rejectAssignedAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment rejected', 'success');
    fetchData();
  };

  const handleStart = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: 'Accepted' } : a)),
    );
    const { error: startErr } = await startAppointment(appt.id);
    if (startErr) {
      showSnackbar(startErr, 'error');
      fetchData();
      return;
    }
    if (appt.doctor_id) await updateDutyStatus(appt.doctor_id, 'On Duty');
    showSnackbar('Appointment started — doctor is now On Duty', 'success');
    fetchData();
  };

  const handleNoShow = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'No Show' } : a)),
    );
    const { error } = await noShowAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Marked as No Show', 'success');
    fetchData();
  };

  const handleCancel = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a)),
    );
    const { error } = await cancelAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment cancelled', 'success');
    fetchData();
  };

  const handleRescheduleOpen = (appt: Appointment) => {
    setRescheduleModal({
      open: true,
      id: appt.id,
      date: appt.appointment_date,
      time: appt.appointment_time,
    });
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModal.date || !rescheduleModal.time) {
      showSnackbar('Please select a new date and time', 'error');
      return;
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleModal.id
          ? {
              ...a,
              appointment_date: rescheduleModal.date,
              appointment_time: rescheduleModal.time,
              status: 'Approved',
            }
          : a,
      ),
    );
    const { error } = await rescheduleAppointment(
      rescheduleModal.id,
      rescheduleModal.date,
      rescheduleModal.time,
    );
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment rescheduled', 'success');
    setRescheduleModal({ open: false, id: '', date: '', time: '' });
    fetchData();
  };

  const handleComplete = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: 'Completed' } : a)),
    );
    const { error } = await completeAppointment(appt.id);
    if (error) {
      showSnackbar(error, 'error');
    } else {
      if (appt.doctor_id) await updateDutyStatus(appt.doctor_id, 'Off Duty');
      showSnackbar('Appointment completed — doctor is now Off Duty', 'success');
    }
    fetchData();
  };

  // ── Status chip ───────────────────────────────────────────────────────────
  const statusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ReactNode; label: string }
  > = {
    Pending: {
      color: '#d97706',
      bg: '#fef3c7',
      icon: <FiAlertCircle size={12} />,
      label: 'Pending Admin Approval',
    },
    Assigned: {
      color: '#7c3aed',
      bg: '#ede9fe',
      icon: <FiAlertCircle size={12} />,
      label: 'Awaiting Doctor Approval',
    },
    Approved: {
      color: '#3b82f6',
      bg: '#dbeafe',
      icon: <FiClock size={12} />,
      label: 'Approved',
    },
    Accepted: {
      color: '#0891b2',
      bg: '#cffafe',
      icon: <FiPlay size={12} />,
      label: 'In Progress',
    },
    Rejected: {
      color: '#dc2626',
      bg: '#fee2e2',
      icon: <FiXCircle size={12} />,
      label: 'Rejected',
    },
    'No Show': {
      color: '#ea580c',
      bg: '#ffedd5',
      icon: <FiXCircle size={12} />,
      label: 'No Show',
    },
    Cancelled: {
      color: '#ef4444',
      bg: '#fee2e2',
      icon: <FiXCircle size={12} />,
      label: 'Cancelled',
    },
    Completed: {
      color: '#10b981',
      bg: '#d1fae5',
      icon: <FiCheckCircle size={12} />,
      label: 'Completed',
    },
  };

  const getStatusChip = (status: string) => {
    const s = statusConfig[status] ?? statusConfig['Approved'];
    return (
      <Chip
        label={s.label}
        size="small"
        icon={s.icon as React.ReactElement}
        sx={{
          backgroundColor: s.bg,
          color: s.color,
          fontWeight: 500,
          fontSize: '11px',
          height: '24px',
        }}
      />
    );
  };

  // ── Action buttons ────────────────────────────────────────────────────────
  const renderStaffActions = (appt: Appointment) => {
    if (isAdmin) return null;
    if (appt.doctor_id !== staffProfile?.id) return null;

    if (appt.status === 'Approved') {
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<FiPlay size={10} />}
            onClick={() => handleStart(appt)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            Start
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FiCalendar size={10} />}
            onClick={() => handleRescheduleOpen(appt)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            Reschedule
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => handleNoShow(appt.id)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            No Show
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleCancel(appt.id)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleComplete(appt)}
            sx={{
              textTransform: 'none',
              fontSize: '10px',
              px: 1,
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            Complete
          </Button>
        </Box>
      );
    }

    if (appt.status === 'Accepted') {
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => handleNoShow(appt.id)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            No Show
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleCancel(appt.id)}
            sx={{ textTransform: 'none', fontSize: '10px', px: 1 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleComplete(appt)}
            sx={{
              textTransform: 'none',
              fontSize: '10px',
              px: 1,
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
            }}
          >
            Complete
          </Button>
        </Box>
      );
    }

    return null;
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const adminPendingQueue = appointments.filter((a) => a.status === 'Pending');
  const doctorAssignedQueue = isAdmin
    ? []
    : appointments.filter(
        (a) => a.status === 'Assigned' && a.doctor_id === staffProfile?.id,
      );

  const mainTableRows = isAdmin
    ? appointments.filter((a) => a.status !== 'Pending')
    : appointments.filter((a) => a.doctor_id === staffProfile?.id);

  const filteredRows = mainTableRows.filter((appt) => {
    const doctor = doctors.find((d) => d.id === appt.doctor_id);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      appt.patient_name.toLowerCase().includes(q) ||
      (doctor?.name ?? '').toLowerCase().includes(q) ||
      appt.appointment_date.includes(q);
    const matchesStatus = statusFilter === '' || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a202c' }}>
            Appointments
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
            {isAdmin
              ? 'Approve staff submissions · Assign appointments to doctors'
              : 'Submit appointments for admin approval · Manage your assigned schedule'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setOpenModal(true)}
          sx={{
            backgroundColor: '#3b82f6',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#2563eb' },
          }}
        >
          New Appointment
        </Button>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: 'Total',
            value: stats.total,
            bg: '#f0fdf4',
            border: '#4caf50',
            color: '#16a34a',
          },
          {
            label: 'Pending',
            value: stats.pending,
            bg: '#fffbeb',
            border: '#f59e0b',
            color: '#d97706',
          },
          {
            label: 'Active',
            value: stats.scheduled,
            bg: '#eff6ff',
            border: '#3b82f6',
            color: '#2563eb',
          },
          {
            label: 'Completed',
            value: stats.completed,
            bg: '#f0fdf4',
            border: '#10b981',
            color: '#059669',
          },
          {
            label: 'Cancelled',
            value: stats.cancelled,
            bg: '#fef2f2',
            border: '#ef4444',
            color: '#dc2626',
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

      {/* ── Admin: Pending queue ── */}
      {isAdmin && adminPendingQueue.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#92400e',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FiAlertCircle /> Staff Submissions — Pending Your Approval (
            {adminPendingQueue.length})
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '12px',
              border: '2px solid #fde68a',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    'Patient',
                    'Doctor',
                    'Date',
                    'Time',
                    'Notes',
                    'Actions',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 600,
                        fontSize: '12px',
                        backgroundColor: '#fef3c7',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {adminPendingQueue.map((appt) => {
                  const doctor = doctors.find((d) => d.id === appt.doctor_id);
                  return (
                    <TableRow
                      key={appt.id}
                      sx={{ '&:hover': { backgroundColor: '#fffbeb' } }}
                    >
                      <TableCell sx={{ fontSize: '12px' }}>
                        {appt.patient_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {doctor?.name ?? 'Unknown'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {new Date(appt.appointment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {appt.appointment_time}
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', fontSize: '11px' }}>
                        {appt.notes ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAdminApprove(appt.id)}
                            sx={{ textTransform: 'none', fontSize: '11px' }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleAdminReject(appt.id)}
                            sx={{ textTransform: 'none', fontSize: '11px' }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ mt: 3, mb: 3 }} />
        </Box>
      )}

      {/* ── Doctor: Assigned queue ── */}
      {!isAdmin && doctorAssignedQueue.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#5b21b6',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FiAlertCircle /> Assigned to You by Admin — Awaiting Your Approval
            ({doctorAssignedQueue.length})
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '12px',
              border: '2px solid #c4b5fd',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Patient', 'Date', 'Time', 'Notes', 'Actions'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 600,
                        fontSize: '12px',
                        backgroundColor: '#ede9fe',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {doctorAssignedQueue.map((appt) => (
                  <TableRow
                    key={appt.id}
                    sx={{ '&:hover': { backgroundColor: '#f5f3ff' } }}
                  >
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.patient_name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {new Date(appt.appointment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.appointment_time}
                    </TableCell>
                    <TableCell sx={{ color: '#6b7280', fontSize: '11px' }}>
                      {appt.notes ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleDoctorAccept(appt.id)}
                          sx={{ textTransform: 'none', fontSize: '11px' }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDoctorReject(appt.id)}
                          sx={{ textTransform: 'none', fontSize: '11px' }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ mt: 3, mb: 3 }} />
        </Box>
      )}

      {/* ── Main appointments table (with search + filter INSIDE the Paper) ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {/* Toolbar row — search left, filters right */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#fff',
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search patient or doctor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch size={15} color="#9ca3af" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <FiX size={13} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                fontSize: '13px',
                backgroundColor: '#f9fafb',
                '& fieldset': { borderColor: '#e5e7eb' },
              },
            }}
          />

          {/* Right side: title + filters */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#9ca3af', fontSize: '12px' }}
            >
              {filteredRows.length} of {mainTableRows.length} appointments
            </Typography>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              size="small"
              sx={{
                borderRadius: '10px',
                fontSize: '13px',
                backgroundColor: '#f9fafb',
                minWidth: 150,
                '& fieldset': { borderColor: '#e5e7eb' },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '13px' }}>
                All Statuses
              </MenuItem>
              <MenuItem value="Assigned" sx={{ fontSize: '13px' }}>
                Assigned
              </MenuItem>
              <MenuItem value="Approved" sx={{ fontSize: '13px' }}>
                Approved
              </MenuItem>
              <MenuItem value="Accepted" sx={{ fontSize: '13px' }}>
                In Progress
              </MenuItem>
              <MenuItem value="Completed" sx={{ fontSize: '13px' }}>
                Completed
              </MenuItem>
              <MenuItem value="Cancelled" sx={{ fontSize: '13px' }}>
                Cancelled
              </MenuItem>
              <MenuItem value="Rejected" sx={{ fontSize: '13px' }}>
                Rejected
              </MenuItem>
              <MenuItem value="No Show" sx={{ fontSize: '13px' }}>
                No Show
              </MenuItem>
            </Select>

            {/* Clear — only when a filter is active */}
            {(searchQuery || statusFilter) && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  color: '#6b7280',
                  minWidth: 0,
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* Table */}
        <TableContainer
          sx={{ maxHeight: 'calc(100vh - 380px)', overflow: 'auto' }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Patient',
                  'Doctor',
                  'Date',
                  'Time',
                  'Status',
                  ...(isAdmin ? [] : ['Actions']),
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600,
                      fontSize: '12px',
                      backgroundColor: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((appt) => {
                const doctor = doctors.find((d) => d.id === appt.doctor_id);
                return (
                  <TableRow
                    key={appt.id}
                    sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.patient_name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {doctor?.name ?? 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {new Date(appt.appointment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.appointment_time}
                    </TableCell>
                    <TableCell>{getStatusChip(appt.status)}</TableCell>
                    {!isAdmin && (
                      <TableCell sx={{ minWidth: 280 }}>
                        {renderStaffActions(appt)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 6}
                    align="center"
                    sx={{ py: 4, color: '#9ca3af' }}
                  >
                    {searchQuery || statusFilter
                      ? 'No appointments match your filters.'
                      : 'No appointments found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── New Appointment Modal ── */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            New Appointment
            <Typography
              variant="caption"
              sx={{ display: 'block', color: isAdmin ? '#7c3aed' : '#d97706' }}
            >
              {isAdmin
                ? 'Will be assigned to the doctor — awaits their acceptance'
                : 'Will be submitted to admin for approval'}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Patient Name *"
              fullWidth
              value={formData.patient_name}
              onChange={(e) =>
                setFormData({ ...formData, patient_name: e.target.value })
              }
            />
            <TextField
              label="Patient Contact (09XXXXXXXXX or +639XXXXXXXXX)"
              fullWidth
              value={formData.patient_contact}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9+]/g, '');
                setFormData({ ...formData, patient_contact: raw });
              }}
              inputProps={{ inputMode: 'tel', maxLength: 13 }}
              error={
                !!formData.patient_contact &&
                !isValidPHPhone(formData.patient_contact)
              }
              helperText={
                formData.patient_contact &&
                !isValidPHPhone(formData.patient_contact)
                  ? 'Format: 09XXXXXXXXX or +639XXXXXXXXX'
                  : ''
              }
            />
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                Doctor *
              </Typography>
              <Select
                value={formData.doctor_id}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_id: e.target.value })
                }
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select a doctor…
                </MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date *"
              type="date"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: today },
              }}
              value={formData.appointment_date}
              onChange={(e) =>
                setFormData({ ...formData, appointment_date: e.target.value })
              }
            />
            <TextField
              label="Time *"
              type="time"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={formData.appointment_time}
              onChange={(e) =>
                setFormData({ ...formData, appointment_time: e.target.value })
              }
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isAdmin ? 'Assign to Doctor' : 'Submit for Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reschedule Modal ── */}
      <Dialog
        open={rescheduleModal.open}
        onClose={() =>
          setRescheduleModal({ open: false, id: '', date: '', time: '' })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Reschedule Appointment
          <IconButton
            onClick={() =>
              setRescheduleModal({ open: false, id: '', date: '', time: '' })
            }
            size="small"
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="New Date *"
              type="date"
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: today },
              }}
              value={rescheduleModal.date}
              onChange={(e) =>
                setRescheduleModal((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
            />
            <TextField
              label="New Time *"
              type="time"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={rescheduleModal.time}
              onChange={(e) =>
                setRescheduleModal((prev) => ({
                  ...prev,
                  time: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setRescheduleModal({ open: false, id: '', date: '', time: '' })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRescheduleSubmit}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
            }}
          >
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Appointments;
