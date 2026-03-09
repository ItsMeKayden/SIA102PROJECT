import { useState, useEffect, useCallback } from 'react';
import '../styles/Pages.css';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Avatar,
} from '@mui/material';
import { FiSearch, FiCalendar, FiPlus, FiTrash2, FiX, FiRefreshCw, FiAlertTriangle, FiAlertCircle, FiInfo, FiUsers, FiClock, FiList, FiUserCheck } from 'react-icons/fi';
import {
  getAllSchedules,
  getSchedulesByStaffId,
  createSchedule,
  deleteSchedule,
} from '../../backend/services/scheduleService';
import { getAllStaff } from '../../backend/services/staffService';
import { useAuth } from '../../contexts/AuthContext';
import type { Schedule as ScheduleRecord, Staff } from '../../types';

interface ScheduleWithStaff extends ScheduleRecord {
  staff?: Staff;
}

function Schedule() {
  const { isAdmin, staffProfile } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleWithStaff[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [formData, setFormData] = useState({
    staff_id: '',
    days_of_week: [1] as number[],
    start_time: '08:00',
    end_time: '17:00',
    notes: '',
  });
  const [generating] = useState(false);

  // Preview state for Generate Schedule
  type StaffEntry = {
    scheduleId: string;
    staffId: string;
    name: string;
    role: string;
    specialization: string | null;
    removed: boolean;
  };
  type DayChange = {
    day: number;
    before: number;
    after: number;
    entries: StaffEntry[];
  };
  type PreviewData = {
    toDeactivate: string[];
    target: number;
    dayChanges: DayChange[];
  };
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [applying, setApplying] = useState(false);

  const fetchData = useCallback(async () => {
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
        const merged = schedulesResult.data.map((s) => ({
          ...s,
          staff: allStaff.find((st) => st.id === s.staff_id),
        }));
        setSchedules(merged);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, staffProfile]);

  useEffect(() => { fetchData(); }, [staffProfile, fetchData]);

  const showSnackbar = (msg: string, sev: 'success' | 'error') =>
    setSnackbar({ open: true, message: msg, severity: sev });

  const handleOpenModal = () => {
    setFormData({
      staff_id: isAdmin ? '' : (staffProfile?.id ?? ''),
      days_of_week: [1],
      start_time: '08:00',
      end_time: '17:00',
      notes: '',
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    const targetStaffId = isAdmin ? formData.staff_id : staffProfile?.id;
    if (!targetStaffId) {
      showSnackbar('No staff selected', 'error');
      return;
    }
    if (formData.days_of_week.length === 0) {
      showSnackbar('Please select at least one day', 'error');
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      showSnackbar('Please fill in start and end time', 'error');
      return;
    }
    if (formData.start_time >= formData.end_time) {
      showSnackbar('End time must be after start time', 'error');
      return;
    }

    let hasError = false;
    for (const day of formData.days_of_week.sort()) {
      const { error } = await createSchedule({
        staff_id: targetStaffId,
        day_of_week: day,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes || null,
        is_active: true,
      });
      if (error) {
        showSnackbar(error, 'error');
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      showSnackbar(
        formData.days_of_week.length > 1
          ? `${formData.days_of_week.length} schedules added successfully`
          : 'Schedule added successfully',
        'success',
      );
      setOpenModal(false);
      fetchData();
    }
  };

  const handleGenerateSchedule = () => {
    // Compute what would change and open the preview modal — nothing is saved yet.
    const workDaySchedules = schedules.filter(
      (s) => s.is_active && s.day_of_week >= 1 && s.day_of_week <= 5,
    );

    if (workDaySchedules.length === 0) {
      showSnackbar(
        'No Mon–Fri schedules submitted yet. Staff need to add their schedules first.',
        'error',
      );
      return;
    }

    const workDays = [1, 2, 3, 4, 5];
    const byDay: Record<number, ScheduleWithStaff[]> = {};
    for (const s of workDaySchedules) {
      if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
      byDay[s.day_of_week].push(s);
    }

    const total = workDaySchedules.length;
    const target = Math.ceil(total / workDays.length);

    // How many days each staff member has submitted across the week
    const staffDayCount: Record<string, number> = {};
    for (const s of workDaySchedules) {
      staffDayCount[s.staff_id] = (staffDayCount[s.staff_id] ?? 0) + 1;
    }

    const toDeactivate: string[] = [];
    const dayChanges: PreviewData['dayChanges'] = [];

    for (const day of workDays) {
      const dayEntries = byDay[day] ?? [];
      const overflow = dayEntries.length - target;
      const removedIds = new Set<string>();

      if (overflow > 0) {
        // Build a specialization frequency map for this day so we know which
        // specializations are duplicated vs unique.
        const specCount = new Map<string, number>();
        for (const e of dayEntries) {
          const spec =
            e.staff?.specialization?.trim() ||
            e.staff?.role ||
            'General';
          specCount.set(spec, (specCount.get(spec) ?? 0) + 1);
        }

        // Sort candidates — most removable first:
        //  1. Has a duplicate specialization on this day (removing won't lose coverage)
        //  2. Covers more total days (still available on other days)
        const sorted = [...dayEntries].sort((a, b) => {
          const specA =
            a.staff?.specialization?.trim() || a.staff?.role || 'General';
          const specB =
            b.staff?.specialization?.trim() || b.staff?.role || 'General';
          const dupA = (specCount.get(specA) ?? 1) > 1 ? 0 : 1;
          const dupB = (specCount.get(specB) ?? 1) > 1 ? 0 : 1;
          // Prefer removing duplicates before unique specializations
          if (dupA !== dupB) return dupA - dupB;
          // Tie-break: more total days = more dispensable here
          return (
            (staffDayCount[b.staff_id] ?? 0) -
            (staffDayCount[a.staff_id] ?? 0)
          );
        });

        for (let i = 0; i < overflow; i++) {
          toDeactivate.push(sorted[i].id);
          removedIds.add(sorted[i].id);
        }
      }

      dayChanges.push({
        day,
        before: dayEntries.length,
        after: dayEntries.length - removedIds.size,
        entries: dayEntries.map((e) => ({
          scheduleId: e.id,
          staffId: e.staff_id,
          name: e.staff?.name ?? 'Unknown',
          role: e.staff?.role ?? 'N/A',
          specialization: e.staff?.specialization ?? null,
          removed: removedIds.has(e.id),
        })),
      });
    }

    setPreviewData({ toDeactivate, target, dayChanges });
    setPreviewOpen(true);
  };

  const handleApplyGenerate = async () => {
    if (!previewData || previewData.toDeactivate.length === 0) {
      setPreviewOpen(false);
      return;
    }
    setApplying(true);
    try {
      let deactivated = 0;
      for (const id of previewData.toDeactivate) {
        const { error } = await deleteSchedule(id);
        if (!error) deactivated++;
      }
      showSnackbar(
        `Schedule balanced — removed ${deactivated} excess entr${deactivated === 1 ? 'y' : 'ies'} from overloaded days. Each day now has at most ${previewData.target} staff.`,
        'success',
      );
      setPreviewOpen(false);
      fetchData();
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    const { error } = await deleteSchedule(id);
    if (error) {
      showSnackbar(error, 'error');
      fetchData();
    } else showSnackbar('Schedule removed', 'success');
  };

  // Calculate summary statistics
  const totalStaff = staff.filter((s) => s.status === 'Active').length;
  const activeSchedules = schedules.filter((s) => s.is_active).length;
  const todaySchedules = schedules.filter(
    (s) => s.is_active && s.day_of_week === new Date().getDay(),
  ).length;

  const summaryCards = [
    {
      title: 'Active Staff',
      value: totalStaff.toString(),
      icon: <FiUsers size={18} />,
      accent: '#2563eb',
      accentBg: '#eff6ff',
    },
    {
      title: 'Shifts Today',
      value: todaySchedules.toString(),
      icon: <FiClock size={18} />,
      accent: '#059669',
      accentBg: '#ecfdf5',
    },
    {
      title: 'Total Schedules',
      value: activeSchedules.toString(),
      icon: <FiList size={18} />,
      accent: '#7c3aed',
      accentBg: '#ede9fe',
    },
    {
      title: 'Staff Scheduled',
      value: new Set(
        schedules.filter((s) => s.is_active).map((s) => s.staff_id),
      ).size.toString(),
      icon: <FiUserCheck size={18} />,
      accent: '#d97706',
      accentBg: '#fffbeb',
    },
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Role → avatar colour palette
  const roleColor = (role: string): { bg: string; text: string; border: string } => {
    const r = role.toLowerCase();
    if (r.includes('doctor') || r.includes('physician'))
      return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
    if (r.includes('nurse'))
      return { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' };
    if (r.includes('admin'))
      return { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' };
    if (r.includes('receptionist') || r.includes('front'))
      return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
    if (r.includes('technician') || r.includes('tech'))
      return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
    return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  // ─── Operational Alerts ────────────────────────────────────────────────────
  type AlertSeverity = 'critical' | 'warning' | 'info';
  interface OperationalAlert {
    id: string;
    severity: AlertSeverity;
    title: string;
    message: string;
  }

  const operationalAlerts = (() => {
    const alerts: OperationalAlert[] = [];
    const workDays = [1, 2, 3, 4, 5];
    const activeSchedules = schedules.filter((s) => s.is_active);
    const activeStaff = staff.filter((s) => s.status === 'Active');
    const workDaySchedules = activeSchedules.filter(
      (s) => s.day_of_week >= 1 && s.day_of_week <= 5,
    );

    // 1. Short-staffed days (< 2 staff on a working day)
    for (const day of workDays) {
      const dayEntries = workDaySchedules.filter((s) => s.day_of_week === day);
      if (dayEntries.length === 0) {
        alerts.push({
          id: `no-staff-${day}`,
          severity: 'critical',
          title: 'No coverage',
          message: `${weekDaysFull[day]} has no staff scheduled — clinic may be unable to operate.`,
        });
      } else if (dayEntries.length === 1) {
        alerts.push({
          id: `short-${day}`,
          severity: 'critical',
          title: 'Critically short-staffed',
          message: `${weekDaysFull[day]} has only 1 staff member scheduled. Minimum recommended is 2.`,
        });
      }
    }

    // 2. Overloaded days (> target)
    const total = workDaySchedules.length;
    const target = total > 0 ? Math.ceil(total / workDays.length) : 0;
    for (const day of workDays) {
      const count = workDaySchedules.filter((s) => s.day_of_week === day).length;
      if (count > target + 1) {
        alerts.push({
          id: `overloaded-${day}`,
          severity: 'warning',
          title: 'Day overloaded',
          message: `${weekDaysFull[day]} has ${count} staff (target ≤ ${target}). Consider running Generate Schedule to rebalance.`,
        });
      }
    }

    // 3. Staff working too many days (all 5 working days = burnout risk)
    const staffDayCounts: Record<string, { name: string; count: number }> = {};
    for (const s of workDaySchedules) {
      if (!staffDayCounts[s.staff_id]) {
        staffDayCounts[s.staff_id] = { name: s.staff?.name ?? 'Unknown', count: 0 };
      }
      staffDayCounts[s.staff_id].count++;
    }
    for (const [, val] of Object.entries(staffDayCounts)) {
      if (val.count === 5) {
        alerts.push({
          id: `overwork-${val.name}`,
          severity: 'warning',
          title: 'Staff overloaded',
          message: `${val.name} is scheduled all 5 working days. Consider reducing their workload to prevent burnout.`,
        });
      }
    }

    // 4. No doctor on a working day
    for (const day of workDays) {
      const dayEntries = workDaySchedules.filter((s) => s.day_of_week === day);
      const hasDoctor = dayEntries.some(
        (s) => s.staff?.role?.toLowerCase().includes('doctor') ||
               s.staff?.role?.toLowerCase().includes('physician'),
      );
      if (dayEntries.length > 0 && !hasDoctor) {
        alerts.push({
          id: `no-doctor-${day}`,
          severity: 'warning',
          title: 'No doctor assigned',
          message: `${weekDaysFull[day]} has no doctor scheduled. Medical consultations may be unavailable.`,
        });
      }
    }

    // 5. Active staff with no schedule at all
    const scheduledStaffIds = new Set(activeSchedules.map((s) => s.staff_id));
    const unscheduled = activeStaff.filter((s) => !scheduledStaffIds.has(s.id));
    if (unscheduled.length > 0) {
      alerts.push({
        id: 'unscheduled-staff',
        severity: 'info',
        title: 'Unscheduled active staff',
        message: `${unscheduled.length} active staff member${unscheduled.length > 1 ? 's' : ''} (${unscheduled.slice(0, 3).map((s) => s.name).join(', ')}${unscheduled.length > 3 ? ', …' : ''}) have no schedule assigned.`,
      });
    }

    // 6. Duplicate specializations on same day with no opposing coverage
    const allSpecs = new Set(
      staff
        .filter((s) => s.specialization)
        .map((s) => s.specialization as string),
    );
    for (const spec of allSpecs) {
      const specStaffIds = new Set(
        staff.filter((s) => s.specialization === spec).map((s) => s.id),
      );
      const coveredDays = new Set(
        workDaySchedules
          .filter((s) => specStaffIds.has(s.staff_id))
          .map((s) => s.day_of_week),
      );
      const uncovered = workDays.filter((d) => !coveredDays.has(d));
      if (uncovered.length > 0 && uncovered.length <= 3) {
        alerts.push({
          id: `spec-gap-${spec}`,
          severity: 'info',
          title: 'Specialization gap',
          message: `No ${spec} specialist scheduled on ${uncovered.map((d) => weekDaysFull[d]).join(', ')}.`,
        });
      }
    }

    return alerts;
  })();

  const alertConfig: Record<AlertSeverity, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    critical: {
      color: '#991b1b',
      bg: '#fff5f5',
      border: '#fecaca',
      icon: <FiAlertCircle size={11} />,
    },
    warning: {
      color: '#92400e',
      bg: '#fffbeb',
      border: '#fde68a',
      icon: <FiAlertTriangle size={11} />,
    },
    info: {
      color: '#1e40af',
      bg: '#eff6ff',
      border: '#bfdbfe',
      icon: <FiInfo size={11} />,
    },
  };
  // ───────────────────────────────────────────────────────────────────────────
  // Group schedules by day
  const groupedSchedules: Record<number, ScheduleWithStaff[]> = {};
  schedules
    .filter((s) => s.is_active)
    .forEach((schedule) => {
      if (!groupedSchedules[schedule.day_of_week]) {
        groupedSchedules[schedule.day_of_week] = [];
      }
      groupedSchedules[schedule.day_of_week].push(schedule);
    });

  // Filter schedules based on search
  const filteredSchedules = searchTerm
    ? schedules.filter(
        (s) =>
          s.staff?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.staff?.role.toLowerCase().includes(searchTerm.toLowerCase()),
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
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
      {/* Top Header Bar */}
      <Box
        sx={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch style={{ color: '#6b7280', fontSize: '16px' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          {isAdmin && (
            <Tooltip title="Balance existing schedules so no day is overloaded" arrow>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<FiRefreshCw />}
                  onClick={handleGenerateSchedule}
                  disabled={generating}
                  sx={{
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    '&:hover': { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Generate Schedule
                </Button>
              </span>
            </Tooltip>
          )}
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

      {/* Summary + Alerts side by side */}
      <Box sx={{ display: 'flex', gap: '20px', alignItems: 'stretch', mb: '24px' }}>
        {/* Schedule Summary — left */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              borderRadius: '14px',
              border: '1.5px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2.5,
                py: 2,
                background: 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: '#dbeafe',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FiCalendar size={22} color="#2563eb" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                  Schedule Summary
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#6b7280', mt: 0.2 }}>
                  Overview of active staff, shifts, and schedule coverage
                </Typography>
              </Box>
            </Box>
            {/* Cards body */}
            <Box sx={{ p: 2, backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {summaryCards.map((card) => (
                <Box
                  key={card.title}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    px: '16px',
                    py: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      backgroundColor: card.accentBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.accent,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af', lineHeight: 1, mb: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {card.title}
                    </Typography>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Alerts & Operational Risks — right, admin only */}
        {isAdmin && (
        <Box sx={{ flex: 1.5, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            borderRadius: '14px',
            border: '1.5px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2.5,
              py: 2,
              background: 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {/* Bell icon block */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                backgroundColor: '#fee2e2',
                border: '1.5px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiAlertTriangle size={22} color="#ef4444" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                Alerts &amp; Operational Risks
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#6b7280', mt: 0.2 }}>
                Live analysis of schedule coverage, workload balance, and specialization gaps
              </Typography>
            </Box>
            {operationalAlerts.length > 0 && (
              <Chip
                label={`${operationalAlerts.length} alert${operationalAlerts.length > 1 ? 's' : ''}`}
                size="small"
                sx={{
                  ml: 'auto',
                  height: '22px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor:
                    operationalAlerts.some((a) => a.severity === 'critical')
                      ? '#fee2e2'
                      : '#fef3c7',
                  color:
                    operationalAlerts.some((a) => a.severity === 'critical')
                      ? '#b91c1c'
                      : '#b45309',
                  flexShrink: 0,
                }}
              />
            )}
          </Box>

          {/* Alert cards grid */}
          <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
            {operationalAlerts.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2, px: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FiInfo size={16} color="#065f46" />
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                  All clear — no operational risks detected for the current schedule.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '10px',
                }}
              >
                {operationalAlerts.map((alert) => {
                  const cfg = alertConfig[alert.severity];
                  return (
                    <Box
                      key={alert.id}
                      sx={{
                        backgroundColor: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        borderRadius: '10px',
                        p: '10px 12px',
                        display: 'flex',
                        gap: 1,
                        transition: 'box-shadow 0.15s',
                        '&:hover': { boxShadow: `0 3px 10px ${cfg.border}` },
                      }}
                    >
                      <Box sx={{ mt: '2px', display: 'flex', alignItems: 'flex-start', color: cfg.color, flexShrink: 0 }}>
                        {cfg.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: cfg.color, lineHeight: 1.3, mb: 0.25 }}>
                          {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}:{' '}
                          {alert.title}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: cfg.color, lineHeight: 1.45, opacity: 0.9 }}>
                          {alert.message}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
        </Box>
        )}
      </Box>

      {/* Weekly Schedule */}
      <Box sx={{ marginBottom: '28px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <FiCalendar style={{ color: '#6b7280', fontSize: 16 }} />
          <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
            Weekly Schedule
          </Typography>
          <Chip
            label={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            size="small"
            sx={{
              ml: 1,
              height: '20px',
              fontSize: '10px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              fontWeight: 600,
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
          }}
        >
          {weekDays.map((day, idx) => {
            const daySchedules = groupedSchedules[idx] || [];
            const isToday = new Date().getDay() === idx;
            const isSunday = idx === 0;
            const colors = isToday
              ? { header: '#2563eb', headerText: '#fff', border: '#2563eb', bg: '#eff6ff' }
              : isSunday
              ? { header: '#fee2e2', headerText: '#991b1b', border: '#fecaca', bg: '#fff' }
              : { header: '#f9fafb', headerText: '#374151', border: '#e5e7eb', bg: '#fff' };

            return (
              <Box
                key={day}
                sx={{
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: colors.bg,
                  boxShadow: isToday
                    ? '0 4px 14px rgba(37,99,235,0.15)'
                    : '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: isToday
                      ? '0 6px 20px rgba(37,99,235,0.22)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {/* Day header */}
                <Box
                  sx={{
                    backgroundColor: colors.header,
                    px: 1.2,
                    py: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: colors.headerText,
                        lineHeight: 1.2,
                      }}
                    >
                      {day}
                    </Typography>
                    {isToday && (
                      <Typography sx={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                        Today
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: isToday
                        ? 'rgba(255,255,255,0.25)'
                        : isSunday
                        ? '#fecaca'
                        : '#e5e7eb',
                      borderRadius: '10px',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 0.6,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isToday ? '#fff' : isSunday ? '#991b1b' : '#6b7280',
                      }}
                    >
                      {daySchedules.length}
                    </Typography>
                  </Box>
                </Box>

                {/* Staff cards */}
                <Box
                  sx={{
                    p: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    minHeight: '120px',
                  }}
                >
                  {daySchedules.length === 0 ? (
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pt: 2,
                        pb: 1,
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FiCalendar style={{ color: '#d1d5db', fontSize: 13 }} />
                      </Box>
                      <Typography sx={{ fontSize: '9px', color: '#d1d5db', textAlign: 'center' }}>
                        No shifts
                      </Typography>
                    </Box>
                  ) : (
    daySchedules.map((schedule: ScheduleWithStaff) => {
                      const name = schedule.staff?.name || 'Unknown';
                      const role = schedule.staff?.role || 'Staff';
                      const spec = schedule.staff?.specialization;
                      const color = roleColor(role);
                      return (
                        <Tooltip
                          key={schedule.id}
                          arrow
                          placement="top"
                          title={
                            <Box sx={{ p: 0.5 }}>
                              <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{name}</Typography>
                              <Typography sx={{ fontSize: '11px', opacity: 0.85 }}>{role}</Typography>
                              {spec && (
                                <Typography sx={{ fontSize: '10px', opacity: 0.75 }}>{spec}</Typography>
                              )}
                              <Typography sx={{ fontSize: '10px', mt: 0.5, opacity: 0.9 }}>
                                {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                              </Typography>
                              {schedule.notes && (
                                <Typography sx={{ fontSize: '10px', opacity: 0.7, fontStyle: 'italic', mt: 0.3 }}>
                                  {schedule.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#fff',
                              border: `1px solid ${color.border}`,
                              borderRadius: '8px',
                              p: '5px 7px',
                              cursor: 'default',
                              transition: 'all 0.15s',
                              '&:hover': {
                                backgroundColor: color.bg,
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '9px',
                                fontWeight: 700,
                                backgroundColor: color.bg,
                                color: color.text,
                                border: `1.5px solid ${color.border}`,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(name)}
                            </Avatar>
                            <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  color: '#1f2937',
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '8px',
                                  color: color.text,
                                  fontWeight: 500,
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {spec ?? role}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '7.5px',
                                  color: '#9ca3af',
                                  lineHeight: 1.2,
                                }}
                              >
                                {formatTime(schedule.start_time)}
                              </Typography>
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* All Schedules Table */}
      <Box sx={{ width: '100%' }}>
        <Typography
          variant="h6"
          sx={{
            marginBottom: '14px',
            color: '#374151',
            fontSize: '14px',
            fontWeight: 600,
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
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '20%',
                    padding: '8px 6px',
                  }}
                >
                  Staff
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '15%',
                    padding: '8px 6px',
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '10%',
                    padding: '8px 6px',
                  }}
                >
                  Day
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '25%',
                    padding: '8px 6px',
                  }}
                >
                  Time
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '20%',
                    padding: '8px 6px',
                  }}
                >
                  Notes
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '10%',
                    padding: '8px 6px',
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '11px',
                    width: '6%',
                    padding: '8px 6px',
                  }}
                ></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: '#9ca3af' }}
                  >
                    No schedules found. Create schedules to see them here.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow
                    key={schedule.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9fafb' },
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <TableCell
                      sx={{
                        color: '#1f2937',
                        fontWeight: 500,
                        fontSize: '11px',
                        padding: '8px 6px',
                      }}
                    >
                      {schedule.staff?.name || 'Unknown'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        padding: '8px 6px',
                      }}
                    >
                      {schedule.staff?.role || 'N/A'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        padding: '8px 6px',
                      }}
                    >
                      {weekDays[schedule.day_of_week]}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        padding: '8px 6px',
                      }}
                    >
                      {formatTime(schedule.start_time)} -{' '}
                      {formatTime(schedule.end_time)}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '10px',
                        padding: '8px 6px',
                      }}
                    >
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
                          backgroundColor: schedule.is_active
                            ? '#d1fae5'
                            : '#fee2e2',
                          color: schedule.is_active ? '#065f46' : '#991b1b',
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
                          sx={{
                            color: '#ef4444',
                            '&:hover': { backgroundColor: '#fee2e2' },
                          }}
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

      {/* Generate Schedule Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => !applying && setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Balanced Schedule Preview
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Review changes before applying. Only overloaded days are trimmed.
            </Typography>
          </Box>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            size="small"
            disabled={applying}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Target info bar */}
              <Box
                sx={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  p: 1.5,
                }}
              >
                <Typography sx={{ fontSize: '12px', color: '#1e40af' }}>
                  <strong>Target:</strong> at most{' '}
                  <strong>{previewData.target}</strong> staff per day.
                  {previewData.toDeactivate.length === 0
                    ? ' The schedule is already balanced — no changes needed.'
                    : ` ${previewData.toDeactivate.length} entr${previewData.toDeactivate.length === 1 ? 'y' : 'ies'} will be deactivated from overloaded days.`}
                  {' '}Balancing preserves <strong>specialization diversity</strong> — duplicate specializations are removed first.
                </Typography>
              </Box>

              {/* Per-day breakdown */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {previewData.dayChanges.map((dc) => {
                  const isOverloaded = dc.entries.some((e) => e.removed);
                  return (
                    <Box
                      key={dc.day}
                      sx={{
                        borderRadius: '8px',
                        border: `1px solid ${isOverloaded ? '#fecaca' : '#e5e7eb'}`,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Day header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 1.5,
                          py: 0.8,
                          backgroundColor: isOverloaded ? '#fef2f2' : '#f9fafb',
                          borderBottom: dc.entries.length > 0 ? '1px solid #e5e7eb' : 'none',
                        }}
                      >
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#1f2937' }}>
                          {['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][dc.day]}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>
                            {dc.before} staff
                          </Typography>
                          {isOverloaded && (
                            <>
                              <Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>→</Typography>
                              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                                {dc.after} staff
                              </Typography>
                            </>
                          )}
                          {!isOverloaded && (
                            <Chip
                              label="Balanced"
                              size="small"
                              sx={{
                                height: '18px',
                                fontSize: '9px',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Staff list for this day */}
                      {dc.entries.length === 0 ? (
                        <Box sx={{ px: 1.5, py: 1 }}>
                          <Typography sx={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                            No staff scheduled
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          {dc.entries.map((entry, idx) => (
                            <Box
                              key={entry.scheduleId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1.5,
                                py: 0.7,
                                backgroundColor: entry.removed ? '#fff5f5' : '#fff',
                                borderBottom:
                                  idx < dc.entries.length - 1
                                    ? '1px solid #f3f4f6'
                                    : 'none',
                                opacity: entry.removed ? 0.85 : 1,
                              }}
                            >
                              {/* Status dot */}
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  backgroundColor: entry.removed ? '#ef4444' : '#22c55e',
                                }}
                              />
                              {/* Name */}
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: entry.removed ? '#b91c1c' : '#1f2937',
                                  textDecoration: entry.removed ? 'line-through' : 'none',
                                  minWidth: '110px',
                                  flexShrink: 0,
                                }}
                              >
                                {entry.name}
                              </Typography>
                              {/* Role */}
                              <Chip
                                label={entry.role}
                                size="small"
                                sx={{
                                  height: '18px',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  backgroundColor: entry.removed ? '#fee2e2' : '#eff6ff',
                                  color: entry.removed ? '#991b1b' : '#1e40af',
                                  flexShrink: 0,
                                }}
                              />
                              {/* Specialization */}
                              {entry.specialization && (
                                <Chip
                                  label={entry.specialization}
                                  size="small"
                                  sx={{
                                    height: '18px',
                                    fontSize: '9px',
                                    fontWeight: 500,
                                    backgroundColor: entry.removed ? '#fef2f2' : '#f0fdf4',
                                    color: entry.removed ? '#b91c1c' : '#166534',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {/* Remove label */}
                              {entry.removed && (
                                <Typography
                                  sx={{
                                    fontSize: '9px',
                                    color: '#ef4444',
                                    fontWeight: 700,
                                    ml: 'auto',
                                    flexShrink: 0,
                                  }}
                                >
                                  REMOVED
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>

              {previewData.toDeactivate.length > 0 && (
                <Box
                  sx={{
                    backgroundColor: '#fff7ed',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    p: 1.5,
                  }}
                >
                  <Typography sx={{ fontSize: '11px', color: '#92400e' }}>
                    <strong>Note:</strong> Removed entries are soft-deleted. Affected staff can re-add their schedule if needed.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setPreviewOpen(false)}
            disabled={applying}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={
              previewData?.toDeactivate.length === 0
                ? () => setPreviewOpen(false)
                : handleApplyGenerate
            }
            disabled={applying}
            sx={{
              textTransform: 'none',
              backgroundColor: '#16a34a',
              '&:hover': { backgroundColor: '#15803d' },
            }}
          >
            {applying
              ? 'Applying…'
              : previewData?.toDeactivate.length === 0
                ? 'OK'
                : 'Apply Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Schedule Dialog */}
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
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add Schedule
          </Typography>
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
          >
            {isAdmin && (
              <FormControl fullWidth size="small">
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, mb: 0.5, color: '#374151' }}
                >
                  Staff Member
                </Typography>
                <Select
                  value={formData.staff_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      staff_id: e.target.value,
                    }))
                  }
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Select staff…
                  </MenuItem>
                  {staff.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl component="fieldset" fullWidth>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, mb: 1, color: '#374151', display: 'block' }}
              >
                Days of Week
              </Typography>
              <ToggleButtonGroup
                value={formData.days_of_week}
                onChange={(_e, newDays: number[]) =>
                  setFormData((prev) => ({ ...prev, days_of_week: newDays }))
                }
                sx={{ flexWrap: 'wrap', gap: '6px' }}
              >
                {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map(
                  (day, i) => (
                    <ToggleButton
                      key={day}
                      value={i}
                      size="small"
                      sx={{
                        border: '1.5px solid #d1d5db !important',
                        borderRadius: '20px !important',
                        px: 1.8,
                        py: 0.5,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'none',
                        lineHeight: 1.4,
                        '&.Mui-selected': {
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          borderColor: '#2563eb !important',
                          '&:hover': { backgroundColor: '#1d4ed8' },
                        },
                        '&:hover': { backgroundColor: '#f3f4f6' },
                      }}
                    >
                      {day}
                    </ToggleButton>
                  ),
                )}
              </ToggleButtonGroup>
              {formData.days_of_week.length === 0 && (
                <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5 }}>
                  Select at least one day
                </Typography>
              )}
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    color: '#374151',
                    display: 'block',
                  }}
                >
                  Start Time
                </Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    color: '#374151',
                    display: 'block',
                  }}
                >
                  End Time
                </Typography>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                />
              </Box>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: '#374151',
                  display: 'block',
                }}
              >
                Notes (optional)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Any additional notes…"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              textTransform: 'none',
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
            }}
          >
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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
