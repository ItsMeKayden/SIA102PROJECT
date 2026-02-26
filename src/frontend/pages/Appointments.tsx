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

  // ── Create ──────────────────────────────────────────────────────────────────
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

  // ── Admin approves staff-submitted (Pending → Approved) ─────────────────
  const handleAdminApprove = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a)),
    );
    const { error } = await approveAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment approved', 'success');
    fetchData();
  };

  // ── Admin rejects staff-submitted (Pending → Rejected) ──────────────────
  const handleAdminReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a)),
    );
    const { error } = await rejectAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment rejected', 'success');
    fetchData();
  };

  // ── Doctor accepts admin-assigned (Assigned → Approved) ─────────────────
  const handleDoctorAccept = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a)),
    );
    const { error } = await acceptAssignedAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment accepted', 'success');
    fetchData();
  };

  // ── Doctor rejects admin-assigned (Assigned → Rejected) ─────────────────
  const handleDoctorReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a)),
    );
    const { error } = await rejectAssignedAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment rejected', 'success');
    fetchData();
  };

  // ── Start (Approved → Accepted + doctor On Duty) ──────────────────────────
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

  // ── No Show ───────────────────────────────────────────────────────────────
  const handleNoShow = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'No Show' } : a)),
    );
    const { error } = await noShowAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Marked as No Show', 'success');
    fetchData();
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelled' } : a)),
    );
    const { error } = await cancelAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment cancelled', 'success');
    fetchData();
  };

  // ── Reschedule ────────────────────────────────────────────────────────────
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

  // ── Complete ──────────────────────────────────────────────────────────────
  const handleComplete = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Completed' } : a)),
    );
    const { error } = await completeAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment completed', 'success');
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

  // Action buttons for Approved / Accepted appointments
  const renderDoctorActions = (appt: Appointment) => {
    const canAct = isAdmin || appt.doctor_id === staffProfile?.id;
    if (!canAct) return null;

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
            onClick={() => handleComplete(appt.id)}
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
            onClick={() => handleComplete(appt.id)}
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
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          },
          {
            label: 'Pending',
            value: stats.pending,
            bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          },
          {
            label: 'Active',
            value: stats.scheduled,
            bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          },
          {
            label: 'Completed',
            value: stats.completed,
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          },
          {
            label: 'Cancelled',
            value: stats.cancelled,
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          },
        ].map((card) => (
          <Card key={card.label} sx={{ background: card.bg }}>
            <CardContent sx={{ py: '12px !important' }}>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.9)', mb: 0.5 }}
              >
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Admin: staff-submitted Pending queue ── */}
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
              overflowX: 'auto',
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#fef3c7' }}>
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
                      sx={{ fontWeight: 600, fontSize: '12px' }}
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

      {/* ── Staff/Doctor: admin-assigned queue ── */}
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
              overflowX: 'auto',
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#ede9fe' }}>
                <TableRow>
                  {['Patient', 'Date', 'Time', 'Notes', 'Actions'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{ fontWeight: 600, fontSize: '12px' }}
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

      {/* ── Main appointments table ── */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: '#374151', mb: 1 }}
      >
        {isAdmin ? 'All Appointments' : 'My Appointments'}
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: '12px', overflowX: 'auto' }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f9fafb' }}>
            <TableRow>
              {['Patient', 'Doctor', 'Date', 'Time', 'Status', 'Actions'].map(
                (h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, fontSize: '12px' }}>
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {mainTableRows.map((appt) => {
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
                  <TableCell sx={{ minWidth: 280 }}>
                    {renderDoctorActions(appt)}
                  </TableCell>
                </TableRow>
              );
            })}
            {mainTableRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 4, color: '#9ca3af' }}
                >
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
              label="Patient Contact"
              fullWidth
              value={formData.patient_contact}
              onChange={(e) =>
                setFormData({ ...formData, patient_contact: e.target.value })
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
              slotProps={{ inputLabel: { shrink: true } }}
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
              slotProps={{ inputLabel: { shrink: true } }}
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
