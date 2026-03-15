import '../styles/Pages.css';
import { useState, useEffect } from 'react';
import {
  getAllDepartments,
  getSpecializations,
} from '../../backend/services/serviceServices';
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
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiPlay,
  FiSearch,
  FiArrowRight,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiEdit2,
  FiBriefcase,
  FiTag,
} from 'react-icons/fi';
import type { Appointment, Staff } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllAppointments,
  createAppointment,
  completeAppointment,
  cancelAppointment,
  deleteAppointment,
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
import {
  getAllServices,
  type Service,
} from '../../backend/services/serviceServices';

// ── Styles ────────────────────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
};
const selectSx = {
  borderRadius: '10px',
  fontSize: '14px',
  backgroundColor: '#fff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
};
const labelSx = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  mb: '6px',
};

function FieldLabel({
  icon,
  text,
  required,
  optional,
}: {
  icon: React.ReactNode;
  text: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <Box sx={labelSx}>
      <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {text}
      {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      {optional && (
        <span
          style={{
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 0,
            color: '#9ca3af',
          }}
        >
          (optional)
        </span>
      )}
    </Box>
  );
}

function MiniCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (d: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const toISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayISO = toISO(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Box
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        p: 2,
        backgroundColor: '#fff',
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <IconButton
          size="small"
          onClick={prevMonth}
          sx={{ color: '#6b7280', fontSize: '18px', width: 28, height: 28 }}
        >
          ‹
        </IconButton>
        <Typography
          sx={{ fontWeight: 600, fontSize: '14px', color: '#1a202c' }}
        >
          {monthNames[viewMonth]}{' '}
          <span style={{ color: '#3b82f6' }}>{viewYear}</span>
        </Typography>
        <IconButton
          size="small"
          onClick={nextMonth}
          sx={{ color: '#6b7280', fontSize: '18px', width: 28, height: 28 }}
        >
          ›
        </IconButton>
      </Box>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <Typography
            key={d}
            sx={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#9ca3af',
              pb: 0.5,
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <Box key={i} />;
          const iso = toISO(viewYear, viewMonth, day);
          const isToday = iso === todayISO;
          const isSelected = iso === value;
          const isPast = iso < todayISO;
          return (
            <Box
              key={i}
              onClick={() => !isPast && onChange(iso)}
              sx={{
                textAlign: 'center',
                py: '5px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: isPast ? 'default' : 'pointer',
                color: isPast
                  ? '#d1d5db'
                  : isSelected
                    ? '#fff'
                    : isToday
                      ? '#3b82f6'
                      : '#374151',
                backgroundColor: isSelected
                  ? '#3b82f6'
                  : isToday && !isSelected
                    ? '#eff6ff'
                    : 'transparent',
                fontWeight: isToday || isSelected ? 600 : 400,
                '&:hover': !isPast
                  ? { backgroundColor: isSelected ? '#2563eb' : '#f3f4f6' }
                  : {},
              }}
            >
              {day}
            </Box>
          );
        })}
      </Box>
      {!value && (
        <Typography
          sx={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
            mt: 1.5,
          }}
        >
          Select your preferred date
        </Typography>
      )}
    </Box>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function Appointments() {
  const { isAdmin, staffProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
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
    department: '',
    specialization: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const departments = [
    ...new Set(doctors.map((d) => d.department).filter(Boolean)),
  ] as string[];

  const availableSpecializations = [
    ...new Set(
      doctors
        .filter((d) => d.department === formData.department)
        .map((d) => d.specialization)
        .filter(Boolean),
    ),
  ] as string[];

  const availableServices = services.filter((s) => {
    if (s.status !== 'Available') return false;
    if (!formData.department) return false;
    const deptMatch =
      !s.department ||
      s.department.toLowerCase() === formData.department.toLowerCase();
    const specMatch =
      !s.specialization ||
      !formData.specialization ||
      s.specialization.toLowerCase() === formData.specialization.toLowerCase();
    return deptMatch && specMatch;
  });

  console.log('isAdmin:', isAdmin);
  console.log('formData.department:', formData.department);
  console.log('formData.specialization:', formData.specialization);
  console.log('services count:', services.length);
  console.log(
    'services:',
    services.map(
      (s) =>
        `${s.name} | dept:${s.department} | spec:${s.specialization} | status:${s.status}`,
    ),
  );
  console.log(
    'availableServices:',
    availableServices.map((s) => s.name),
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAdmin && staffProfile?.department && staffProfile?.specialization) {
      setFormData((prev) => ({
        ...prev,
        department: staffProfile.department ?? '',
        specialization: staffProfile.specialization ?? '',
      }));
    }
  }, [staffProfile?.department, staffProfile?.specialization, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointData, staffData, statsData, servicesRes] =
        await Promise.all([
          getAllAppointments(),
          getAllStaff(),
          getAppointmentStats(),
          getAllServices(),
        ]);
      if (appointData.data) setAppointments(appointData.data);
      if (staffData.data)
        setDoctors(
          staffData.data.filter((s) => s.role?.toLowerCase() === 'doctor'),
        );
      if (servicesRes.data) setServices(servicesRes.data);
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

  const isValidPHPhone = (v: string) => /^(09\d{9}|\+639\d{9})$/.test(v.trim());

  const handleSubmit = async () => {
    if (
      !formData.patient_name ||
      !formData.department ||
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
      const parseTime = (t: string) => {
        const [time, period] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      if (parseTime(formData.appointment_time) <= nowMinutes) {
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

    if (isAdmin) {
      const matchingDoctors = doctors.filter(
        (d) =>
          d.department === formData.department &&
          (!formData.specialization ||
            d.specialization === formData.specialization),
      );
      if (matchingDoctors.length === 0) {
        showSnackbar(
          'No doctors available for this department and specialization',
          'error',
        );
        return;
      }
    }

    const selectedService = services.find((s) => s.id === formData.service_id);
    const status = isAdmin ? 'Assigned' : 'Pending';

    const { error } = await createAppointment({
      patient_name: formData.patient_name,
      patient_contact: formData.patient_contact || 'N/A',
      doctor_id: isAdmin ? null : (staffProfile?.id ?? null),
      department: formData.department,
      specialization: formData.specialization || formData.department,
      service_id: formData.service_id || null,
      service_name: selectedService?.name || null,
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
      const matchingDoctors = doctors.filter(
        (d) =>
          d.department === formData.department &&
          (!formData.specialization ||
            d.specialization === formData.specialization),
      );
      await Promise.all(
        matchingDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: 'New Appointment Available — First to Accept',
            message: `A new appointment is available in the ${formData.department} department (${formData.specialization || 'any specialization'}) for patient "${formData.patient_name}" on ${formData.appointment_date} at ${formData.appointment_time}. First doctor to accept will be assigned.`,
            type: 'info',
          }),
        ),
      );
      showSnackbar(
        `Appointment sent to ${formData.department} doctors — first to accept is assigned`,
        'success',
      );
    } else {
      await createNotification({
        staff_id: null,
        title: 'New Appointment Pending Approval',
        message: `${staffProfile?.name ?? 'A staff member'} submitted an appointment for patient "${formData.patient_name}" in the ${formData.department} department on ${formData.appointment_date} at ${formData.appointment_time}.`,
        type: 'info',
      });
      showSnackbar('Appointment submitted for admin approval', 'success');
    }

    fetchData();
    setFormData({
      patient_name: '',
      patient_contact: '',
      department: !isAdmin ? formData.department : '',
      specialization: !isAdmin ? (staffProfile?.specialization ?? '') : '',
      service_id: '',
      appointment_date: '',
      appointment_time: '',
      notes: '',
    });
  };

  const handleAdminApprove = async (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Assigned' } : a)),
    );
    const { error } = await approveAppointment(id);
    if (error) {
      showSnackbar(error, 'error');
      fetchData();
      return;
    }
    if (appt?.department) {
      const matchingDoctors = doctors.filter(
        (d) =>
          d.department === appt.department &&
          (!(appt as any).specialization ||
            d.specialization === (appt as any).specialization),
      );
      await Promise.all(
        matchingDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: 'New Appointment Available — First to Accept',
            message: `A new appointment is available in the ${appt.department} department for patient "${appt.patient_name}" on ${appt.appointment_date} at ${appt.appointment_time}. First doctor to accept will be assigned.`,
            type: 'info',
          }),
        ),
      );
    }
    showSnackbar(
      'Appointment approved and sent to matching doctors',
      'success',
    );
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
    if (!staffProfile?.id) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'Approved', doctor_id: staffProfile.id }
          : a,
      ),
    );
    const { error } = await acceptAssignedAppointment(id, staffProfile.id);
    if (error) {
      showSnackbar(error, 'error');
      fetchData();
      return;
    }
    const appt = appointments.find((a) => a.id === id);
    if (appt?.department) {
      const otherDoctors = doctors.filter(
        (d) => d.department === appt.department && d.id !== staffProfile.id,
      );
      await Promise.all(
        otherDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: 'Appointment Claimed',
            message: `The appointment for patient "${appt.patient_name}" on ${appt.appointment_date} at ${appt.appointment_time} has already been accepted by another doctor.`,
            type: 'info',
          }),
        ),
      );
    }
    showSnackbar('Appointment accepted — you are now assigned', 'success');
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

  const handleDelete = async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    const { error } = await deleteAppointment(id);
    if (error) showSnackbar(error, 'error');
    else showSnackbar('Appointment deleted', 'success');
    fetchData();
  };

  const handleRescheduleOpen = (appt: Appointment) =>
    setRescheduleModal({
      open: true,
      id: appt.id,
      date: appt.appointment_date,
      time: appt.appointment_time,
    });

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

  const renderStaffActions = (appt: Appointment) => {
    if (isAdmin || appt.doctor_id !== staffProfile?.id) return null;
    if (appt.status === 'Approved')
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
    if (appt.status === 'Accepted')
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
    return null;
  };

  const adminPendingQueue = appointments.filter((a) => a.status === 'Pending');
  const doctorAssignedQueue = isAdmin
    ? []
    : appointments.filter(
        (a) =>
          a.status === 'Assigned' &&
          a.doctor_id === null &&
          a.department === staffProfile?.department,
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
      appt.appointment_date.includes(q) ||
      (appt.department ?? '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'pending_all'
        ? appt.status === 'Pending' || appt.status === 'Assigned'
        : appt.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (loading)
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

  const submitLabel = isAdmin ? 'Assign to Department' : 'Submit for Approval';
  const submitSubtitle = isAdmin
    ? 'Will be sent to doctors matching department & specialization — first to accept is assigned'
    : 'Will be submitted to admin for approval';
  const submitSubtitleColor = isAdmin ? '#7c3aed' : '#d97706';

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
      {/* ── NEW APPOINTMENT FORM ── */}
      <Paper
        elevation={0}
        sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', p: 3, mb: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{ fontWeight: 700, color: '#1a202c', fontSize: '20px' }}
            >
              New Appointment
            </Typography>
            <Typography
              sx={{ fontSize: '13px', color: submitSubtitleColor, mt: 0.25 }}
            >
              {submitSubtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              px: 1.5,
              py: 0.75,
            }}
          >
            <FiCalendar size={13} color="#9ca3af" />
            <Typography
              sx={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          {/* Calendar */}
          <Box>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <FiCalendar size={12} /> Select Date
            </Typography>
            <MiniCalendar
              value={formData.appointment_date}
              onChange={(d) =>
                setFormData({ ...formData, appointment_date: d })
              }
            />
          </Box>

          {/* Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ height: '21px' }} />

            {/* Row 1 */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <FieldLabel
                  icon={<FiUser size={11} />}
                  text="Patient Name"
                  required
                />
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Juan dela Cruz"
                  value={formData.patient_name}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_name: e.target.value })
                  }
                  sx={fieldSx}
                />
              </Box>
              <Box>
                <FieldLabel
                  icon={<FiPhone size={11} />}
                  text="Patient Contact"
                />
                <TextField
                  size="small"
                  fullWidth
                  placeholder="09XXXXXXXXX"
                  value={formData.patient_contact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patient_contact: e.target.value.replace(/[^0-9+]/g, ''),
                    })
                  }
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
                  sx={fieldSx}
                />
              </Box>
            </Box>

            {/* Row 2 */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <FieldLabel
                  icon={<FiUser size={11} />}
                  text="Department"
                  required
                />
                <FormControl fullWidth size="small" disabled={!isAdmin}>
                  <Select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        specialization: '',
                        service_id: '',
                      })
                    }
                    displayEmpty
                    renderValue={(selected) =>
                      selected ? (
                        selected
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                          Select a department…
                        </span>
                      )
                    }
                    sx={selectSx}
                  >
                    <MenuItem value="" disabled>
                      Select a department…
                    </MenuItem>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <MenuItem
                          key={dept}
                          value={dept}
                          sx={{ fontSize: '14px' }}
                        >
                          {dept}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem
                        disabled
                        sx={{ fontSize: '13px', color: '#9ca3af' }}
                      >
                        No departments available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FieldLabel
                  icon={<FiBriefcase size={11} />}
                  text="Specialization"
                  required={isAdmin}
                />
                {isAdmin ? (
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!formData.department}
                  >
                    <Select
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                          service_id: '',
                        })
                      }
                      displayEmpty
                      renderValue={(selected) =>
                        selected ? (
                          selected
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                            {formData.department
                              ? 'Select a specialization…'
                              : 'Select department first'}
                          </span>
                        )
                      }
                      sx={selectSx}
                    >
                      <MenuItem value="" disabled>
                        Select a specialization…
                      </MenuItem>
                      {availableSpecializations.length > 0 ? (
                        availableSpecializations.map((spec) => (
                          <MenuItem
                            key={spec}
                            value={spec}
                            sx={{ fontSize: '14px' }}
                          >
                            {spec}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem
                          disabled
                          sx={{ fontSize: '13px', color: '#9ca3af' }}
                        >
                          No specializations found
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    value={formData.specialization || ''}
                    disabled
                    placeholder="Auto-filled from your profile"
                    sx={{
                      ...fieldSx,
                      '& .MuiOutlinedInput-root': {
                        ...fieldSx['& .MuiOutlinedInput-root'],
                        backgroundColor: '#f9fafb',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Row 3 */}
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}
            >
              <Box>
                <FieldLabel
                  icon={<FiTag size={11} />}
                  text="Service"
                  optional
                />
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.service_id}
                    onChange={(e) =>
                      setFormData({ ...formData, service_id: e.target.value })
                    }
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected)
                        return (
                          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                            Select a service…
                          </span>
                        );
                      const svc = services.find((s) => s.id === selected);
                      return svc ? svc.name : selected;
                    }}
                    sx={selectSx}
                  >
                    <MenuItem
                      value=""
                      sx={{ fontSize: '14px', color: '#9ca3af' }}
                    >
                      No service selected
                    </MenuItem>
                    {availableServices.length > 0 ? (
                      availableServices.map((svc) => (
                        <MenuItem
                          key={svc.id}
                          value={svc.id}
                          sx={{ fontSize: '14px' }}
                        >
                          <Box>
                            <Typography
                              sx={{ fontSize: '13px', fontWeight: 500 }}
                            >
                              {svc.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '11px', color: '#6b7280' }}
                            >
                              ₱{svc.price.toLocaleString()} · {svc.duration}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem
                        disabled
                        sx={{ fontSize: '13px', color: '#9ca3af' }}
                      >
                        {!formData.department
                          ? isAdmin
                            ? 'Select a department first'
                            : 'Loading your department…'
                          : isAdmin && !formData.specialization
                            ? 'Select a specialization first'
                            : 'No services available for your department'}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FieldLabel
                  icon={<FiClock size={11} />}
                  text="Time Slot"
                  required
                />
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.appointment_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appointment_time: e.target.value,
                      })
                    }
                    displayEmpty
                    renderValue={(selected) =>
                      selected ? (
                        selected
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                          Select a time…
                        </span>
                      )
                    }
                    sx={selectSx}
                  >
                    <MenuItem value="" disabled>
                      Select a time…
                    </MenuItem>
                    {[
                      '7:00 AM',
                      '7:30 AM',
                      '8:00 AM',
                      '8:30 AM',
                      '9:00 AM',
                      '9:30 AM',
                      '10:00 AM',
                      '10:30 AM',
                      '11:00 AM',
                      '11:30 AM',
                      '12:00 PM',
                      '12:30 PM',
                      '1:00 PM',
                      '1:30 PM',
                      '2:00 PM',
                      '2:30 PM',
                      '3:00 PM',
                      '3:30 PM',
                      '4:00 PM',
                      '4:30 PM',
                      '5:00 PM',
                    ].map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: '14px' }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 4: Notes */}
            <Box>
              <FieldLabel icon={<FiEdit2 size={11} />} text="Notes" optional />
              <TextField
                size="small"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any specific concerns or requirements…"
                sx={fieldSx}
              />
            </Box>

            {/* Doctor info banner */}
            {!isAdmin && staffProfile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  px: 2,
                  py: 1.25,
                }}
              >
                <FiUser size={14} color="#3b82f6" />
                <Typography sx={{ fontSize: '13px', color: '#1d4ed8' }}>
                  Appointment will be assigned to{' '}
                  <strong>{staffProfile.name}</strong> ·{' '}
                  <strong>{staffProfile.department}</strong> ·{' '}
                  <strong>{staffProfile.specialization}</strong>
                </Typography>
              </Box>
            )}

            {/* Submit */}
            <Button
              variant="contained"
              endIcon={<FiArrowRight />}
              onClick={handleSubmit}
              fullWidth
              sx={{
                backgroundColor: '#3b82f6',
                textTransform: 'none',
                borderRadius: '10px',
                py: 1.25,
                fontSize: '14px',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#2563eb' },
              }}
            >
              {submitLabel}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── ADMIN PENDING QUEUE ── */}
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
            <FiAlertCircle /> Pending Request that needs your Approval (
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
                    'Requested By',
                    'Department',
                    'Specialization',
                    'Service',
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
                  const requestedBy =
                    doctors.find((d) => d.id === appt.doctor_id) ?? null;
                  const svc = services.find(
                    (s) => s.id === (appt as any).service_id,
                  );
                  return (
                    <TableRow
                      key={appt.id}
                      sx={{ '&:hover': { backgroundColor: '#fffbeb' } }}
                    >
                      <TableCell sx={{ fontSize: '12px' }}>
                        {appt.patient_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {requestedBy ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: '#dbeafe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FiUser size={11} color="#3b82f6" />
                            </Box>
                            <Typography
                              sx={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#1f2937',
                              }}
                            >
                              {requestedBy.name}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography
                            sx={{ fontSize: '12px', color: '#9ca3af' }}
                          >
                            Unknown
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        <Chip
                          label={appt.department ?? '—'}
                          size="small"
                          sx={{
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            fontSize: '11px',
                            fontWeight: 500,
                            height: '22px',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: '#374151' }}>
                        {(appt as any).specialization ?? appt.department ?? '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {svc ? (
                          <Box>
                            <Typography
                              sx={{ fontSize: '12px', fontWeight: 500 }}
                            >
                              {svc.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '11px', color: '#6b7280' }}
                            >
                              ₱{svc.price.toLocaleString()}
                            </Typography>
                          </Box>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
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

      {/* ── DOCTOR ASSIGNED QUEUE ── */}
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
            <FiAlertCircle /> Pending Appointment Request Available in Your
            Department ({doctorAssignedQueue.length})
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
                  {[
                    'Patient',
                    'Department',
                    'Specialization',
                    'Service',
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
                        backgroundColor: '#ede9fe',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {doctorAssignedQueue.map((appt) => {
                  const svc = services.find(
                    (s) => s.id === (appt as any).service_id,
                  );
                  return (
                    <TableRow
                      key={appt.id}
                      sx={{ '&:hover': { backgroundColor: '#f5f3ff' } }}
                    >
                      <TableCell sx={{ fontSize: '12px' }}>
                        {appt.patient_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        <Chip
                          label={appt.department ?? '—'}
                          size="small"
                          sx={{
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            fontSize: '11px',
                            fontWeight: 500,
                            height: '22px',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: '12px',
                          color: '#374151',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(appt as any).specialization ?? '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {svc ? (
                          <Box>
                            <Typography
                              sx={{ fontSize: '12px', fontWeight: 500 }}
                            >
                              {svc.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: '11px', color: '#6b7280' }}
                            >
                              ₱{svc.price.toLocaleString()}
                            </Typography>
                          </Box>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ mt: 3, mb: 3 }} />
        </Box>
      )}

      {/* ── MAIN APPOINTMENTS TABLE ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: '1px solid #f3f4f6' }}
        >
          {(() => {
            const tabCounts = {
              all: mainTableRows.length,
              pending: mainTableRows.filter(
                (a) => a.status === 'Pending' || a.status === 'Assigned',
              ).length,
              confirmed: mainTableRows.filter((a) => a.status === 'Approved')
                .length,
              inProgress: mainTableRows.filter((a) => a.status === 'Accepted')
                .length,
              noShow: mainTableRows.filter((a) => a.status === 'No Show')
                .length,
              rejected: mainTableRows.filter((a) => a.status === 'Rejected')
                .length,
              cancelled: mainTableRows.filter((a) => a.status === 'Cancelled')
                .length,
              completed: mainTableRows.filter((a) => a.status === 'Completed')
                .length,
            };
            const tabs = [
              { label: 'All', value: '', count: tabCounts.all },
              {
                label: 'Pending',
                value: 'pending_all',
                count: tabCounts.pending,
              },
              {
                label: 'Confirmed',
                value: 'Approved',
                count: tabCounts.confirmed,
              },
              {
                label: 'In Progress',
                value: 'Accepted',
                count: tabCounts.inProgress,
              },
              { label: 'No Show', value: 'No Show', count: tabCounts.noShow },
              {
                label: 'Rejected',
                value: 'Rejected',
                count: tabCounts.rejected,
              },
              {
                label: 'Cancelled',
                value: 'Cancelled',
                count: tabCounts.cancelled,
              },
              {
                label: 'Completed',
                value: 'Completed',
                count: tabCounts.completed,
              },
            ];
            return (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#1a202c',
                        fontSize: '20px',
                      }}
                    >
                      Your Appointments
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mt: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
                        {tabCounts.all} requests total
                      </Typography>
                      {tabCounts.pending > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#d97706',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.pending} pending
                          </Typography>
                        </>
                      )}
                      {tabCounts.confirmed > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#3b82f6',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.confirmed} confirmed
                          </Typography>
                        </>
                      )}
                      {tabCounts.inProgress > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#0891b2',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.inProgress} in progress
                          </Typography>
                        </>
                      )}
                      {tabCounts.noShow > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#ea580c',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.noShow} no show
                          </Typography>
                        </>
                      )}
                      {tabCounts.rejected > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#dc2626',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.rejected} rejected
                          </Typography>
                        </>
                      )}
                      {tabCounts.cancelled > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#ef4444',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.cancelled} cancelled
                          </Typography>
                        </>
                      )}
                      {tabCounts.completed > 0 && (
                        <>
                          <Typography sx={{ color: '#d1d5db' }}>·</Typography>
                          <Typography
                            sx={{
                              fontSize: '13px',
                              color: '#10b981',
                              fontWeight: 500,
                            }}
                          >
                            {tabCounts.completed} completed
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FiRefreshCw size={13} />}
                    onClick={fetchData}
                    sx={{
                      textTransform: 'none',
                      fontSize: '13px',
                      borderRadius: '10px',
                      borderColor: '#e5e7eb',
                      color: '#374151',
                      '&:hover': {
                        backgroundColor: '#f9fafb',
                        borderColor: '#d1d5db',
                      },
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      size="small"
                      onClick={() => setStatusFilter(tab.value)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '13px',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        minWidth: 0,
                        backgroundColor:
                          statusFilter === tab.value
                            ? '#1a202c'
                            : 'transparent',
                        color: statusFilter === tab.value ? '#fff' : '#6b7280',
                        border: '1px solid',
                        borderColor:
                          statusFilter === tab.value ? '#1a202c' : '#e5e7eb',
                        '&:hover': {
                          backgroundColor:
                            statusFilter === tab.value ? '#111827' : '#f9fafb',
                        },
                      }}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span style={{ marginLeft: 5, opacity: 0.7 }}>
                          {tab.count}
                        </span>
                      )}
                    </Button>
                  ))}
                </Box>
              </>
            );
          })()}
        </Box>

        {/* Search */}
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
            backgroundColor: '#fafafa',
          }}
        >
          <TextField
            size="small"
            placeholder="Search patient, doctor or department…"
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
                backgroundColor: '#fff',
                '& fieldset': { borderColor: '#e5e7eb' },
              },
            }}
          />
          <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>
            {filteredRows.length} of {mainTableRows.length} appointments
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer
          sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto' }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Patient',
                  'Department',
                  'Specialization',
                  'Service',
                  'Doctor',
                  'Date',
                  'Time',
                  'Status',
                  'Actions',
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
                const doctor =
                  doctors.find((d) => d.id === appt.doctor_id) ??
                  (appt.doctor_id === staffProfile?.id ? staffProfile : null);
                const svc = services.find(
                  (s) => s.id === (appt as any).service_id,
                );
                return (
                  <TableRow
                    key={appt.id}
                    sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}
                  >
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.patient_name}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.department ? (
                        <Chip
                          label={appt.department}
                          size="small"
                          sx={{
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            fontSize: '11px',
                            fontWeight: 500,
                            height: '22px',
                          }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', color: '#374151' }}>
                      {(appt as any).specialization ?? appt.department ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {svc ? (
                        <Box>
                          <Typography
                            sx={{ fontSize: '12px', fontWeight: 500 }}
                          >
                            {svc.name}
                          </Typography>
                          <Typography
                            sx={{ fontSize: '11px', color: '#6b7280' }}
                          >
                            ₱{svc.price.toLocaleString()}
                          </Typography>
                        </Box>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '12px',
                        color: doctor ? '#1f2937' : '#9ca3af',
                      }}
                    >
                      {doctor?.name ??
                        (appt.status === 'Assigned'
                          ? 'Awaiting claim…'
                          : 'Unassigned')}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {new Date(appt.appointment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>
                      {appt.appointment_time}
                    </TableCell>
                    <TableCell>{getStatusChip(appt.status)}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {isAdmin ? (
                        appt.status === 'Assigned' && !appt.doctor_id ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(appt.id)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '10px',
                              px: 1,
                            }}
                          >
                            Delete
                          </Button>
                        ) : null
                      ) : (
                        renderStaffActions(appt)
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
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

      {/* ── RESCHEDULE MODAL ── */}
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
