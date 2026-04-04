import "../styles/Pages.css";
import "../styles/Overview.css";
import { useEffect, useState } from "react";
import {
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { FiCalendar, FiCheckCircle, FiClock, FiX } from "react-icons/fi";
import { getStaffCountByStatus } from "../../backend/services/staffService";
import {
  getUpcomingAppointments,
  getAppointmentStats,
  getAppointmentsByDate,
  getAppointmentsByDoctorId,
} from "../../backend/services/appointmentService";
import {
  getAllAttendance,
  getAttendanceByStaffId,
} from "../../backend/services/attendanceService";
import { supabase } from "../../lib/supabase-client";
import type { Appointment, Attendance } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

// Helper function to get full patient name from appointment record
function getAppointmentPatientName(appt: Appointment): string {
  const parts = [appt.first_name, appt.middle_name, appt.last_name]
    .filter(Boolean)
    .join(" ");
  return parts || "Patient";
}

// ─── Admin Overview ───────────────────────────────────────────────────────────

function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    appointments: 0,
    completedAppointments: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{
      id: string;
      type: string;
      description: string;
      time: string;
    }>
  >([]);
  const [quickStats, setQuickStats] = useState({
    attendanceRate: 0,
    avgDailyAppointments: 0,
    activeStaff: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
      const { data: staffCounts, error: staffError } =
        await getStaffCountByStatus();
      const { data: appointmentStats, error: appointmentError } =
        await getAppointmentStats();
      const { data: upcoming, error: upcomingError } =
        await getUpcomingAppointments(3);
      const { data: todayAppointments, error: todayAppointmentsError } =
        await getAppointmentsByDate(today);
      const { data: attendanceData, error: attendanceError } =
        await getAllAttendance();

      if (
        staffError ||
        appointmentError ||
        upcomingError ||
        attendanceError ||
        todayAppointmentsError
      ) {
        setError("Failed to load dashboard data");
        return;
      }

      const todayAttendance =
        attendanceData?.filter((a) => a.date === today) || [];
      const presentToday = todayAttendance.filter(
        (a) => a.status === "Present" || a.status === "Late",
      ).length;
      const completedToday =
        todayAppointments?.filter((a) => a.status === "Completed").length || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance =
        attendanceData?.filter((a) => new Date(a.date) >= thirtyDaysAgo) || [];
      const attendanceRate =
        recentAttendance.length > 0
          ? (recentAttendance.filter((a) => a.status === "Present").length /
              recentAttendance.length) *
            100
          : 0;

      setStats({
        totalStaff: staffCounts?.total || 0,
        presentToday,
        appointments: appointmentStats?.total || 0,
        completedAppointments: completedToday,
      });

      setQuickStats({
        attendanceRate: Number.parseFloat(attendanceRate.toFixed(1)),
        avgDailyAppointments: appointmentStats?.total
          ? Math.round(appointmentStats.total / 30)
          : 0,
        activeStaff: staffCounts?.onDuty || 0,
        pendingTasks: appointmentStats?.scheduled || 0,
      });

      setUpcomingAppointments(upcoming || []);

      const activities: Array<{
        id: string;
        type: string;
        description: string;
        time: string;
      }> = [];
      todayAttendance.slice(0, 2).forEach((att, idx) => {
        activities.push({
          id: `attendance-${idx}`,
          type: "Staff",
          description: "Staff checked in",
          time: formatRelativeTime(att.time_in || ""),
        });
      });
      upcoming?.slice(0, 2).forEach((app, idx) => {
        activities.push({
          id: `appointment-${idx}`,
          type: "Appointment",
          description: `Appointment scheduled - ${getAppointmentPatientName(app)}`,
          time: formatRelativeTime(app.appointment_time || ""),
        });
      });
      setRecentActivity(activities.slice(0, 4));
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
    };
    fetchDashboardData();
  }, []);

  const formatRelativeTime = (time: string) => {
    if (!time) return "Recently";
    const now = new Date();
    const timeDate = new Date(`${now.toISOString().split("T")[0]}T${time}`);
    const diffMs = now.getTime() - timeDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Recently";
  };

  if (loading) {
    return (
      <div
        className="overview-container"
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="300px" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="400px" height={20} />
        </Box>

        {/* Stats cards skeleton */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" height={14} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Content grid skeleton */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            gap: 2,
          }}
        >
          {/* Recent activity section */}
          <Card>
            <CardContent>
              <Skeleton
                variant="text"
                width="150px"
                height={24}
                sx={{ mb: 2 }}
              />
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ mb: 2, display: "flex", gap: 1 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" height={16} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="70%" height={12} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Quick stats section */}
          <Card>
            <CardContent>
              <Skeleton
                variant="text"
                width="120px"
                height={24}
                sx={{ mb: 2 }}
              />
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="80%" height={14} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-container">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <div className="overview-header">
        <h1>Dashboard Overview</h1>
        <p className="overview-subtitle">
          Welcome to CLINIKA+ - Your clinic management dashboard
        </p>
      </div>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 2 },
          alignItems: { xs: "stretch", sm: "flex-start" },
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.5, sm: 2 },
            width: "100%",
          }}
        >
          {[
            {
              label: "Total Staff",
              value: stats.totalStaff,
              color: "#d97706",
              borderColor: "rgba(245, 158, 11, 0.3)",
              bgColor: "rgba(245, 158, 11, 0.1)",
              icon: FiCalendar,
            },
            {
              label: "Present Today",
              value: stats.presentToday,
              color: "#16a34a",
              borderColor: "rgba(22, 163, 74, 0.3)",
              bgColor: "rgba(22, 163, 74, 0.1)",
              icon: FiCheckCircle,
            },
            {
              label: "Total Appointments",
              value: stats.appointments,
              color: "#2563eb",
              borderColor: "rgba(59, 130, 246, 0.3)",
              bgColor: "rgba(59, 130, 246, 0.1)",
              icon: FiClock,
            },
            {
              label: "Completed Today",
              value: stats.completedAppointments,
              color: "#059669",
              borderColor: "rgba(25, 135, 84, 0.3)",
              bgColor: "rgba(25, 135, 84, 0.1)",
              icon: FiCheckCircle,
            },
          ].map((card) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={card.label}
                sx={{
                  background: "#ffffff",
                  border: `1px solid ${card.borderColor}`,
                  borderRadius: "12px",
                  boxShadow: "none",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    py: "12px",
                    px: "16px",
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexShrink: 0,
                      backgroundColor: card.bgColor,
                      padding: "8px",
                      borderRadius: "8px",
                    }}
                  >
                    <IconComponent size={32} color={card.color} />
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#9ca3af",
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: { xs: "11px", sm: "12px" },
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: card.color,
                        fontWeight: 700,
                        fontSize: { xs: "24px", sm: "28px" },
                      }}
                    >
                      {card.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      <div className="content-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-badge">{activity.type.charAt(0)}</div>
                <div className="activity-details">
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Appointments</h2>
          </div>
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    {formatRelativeTime(appointment.appointment_time || "")}
                  </div>
                  <div className="appointment-details">
                    <p className="appointment-patient">
                      {getAppointmentPatientName(appointment)}
                    </p>
                    <p className="appointment-doctor">
                      Doctor ID: {appointment.doctor_id || "N/A"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  padding: "20px",
                }}
              >
                No upcoming appointments
              </p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Quick Stats</h2>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="quick-stat-label">Attendance Rate</span>
              <span className="quick-stat-value">
                {quickStats.attendanceRate}%
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Avg. Daily Appointments</span>
              <span className="quick-stat-value">
                {quickStats.avgDailyAppointments}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Active Staff</span>
              <span className="quick-stat-value">{quickStats.activeStaff}</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Pending Tasks</span>
              <span className="quick-stat-value">
                {quickStats.pendingTasks}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>System Status</h2>
          </div>
          <div className="system-status">
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>All Systems Operational</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>Database Connected</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-online"></div>
              <span>Backup System Active</span>
            </div>
            <div className="status-item">
              <div className="status-indicator status-warning"></div>
              <span>Next Maintenance: Mar 20, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Overview ───────────────────────────────────────────────────────────

function StaffOverview() {
  const { staffProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dutyStatus, setDutyStatus] = useState<string>("Off Duty");
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(
    null,
  );
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
  });

  useEffect(() => {
    if (staffProfile?.id) {
      // Fetch duty status from database
      supabase
        .from("staff")
        .select("duty_status")
        .eq("id", staffProfile.id)
        .single()
        .then(({ data }) => {
          if (data?.duty_status) {
            setDutyStatus(data.duty_status);
          }
        });
      // Fetch staff data
      fetchStaffData(staffProfile.id);
    }
  }, [staffProfile]);

  const fetchStaffData = async (staffId: string) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const [
        { data: attendanceData, error: attendanceError },
        { data: allAppointments, error: appointmentError },
      ] = await Promise.all([
        getAttendanceByStaffId(staffId),
        getAppointmentsByDoctorId(staffId),
      ]);

      if (attendanceError || appointmentError) {
        setError("Failed to load your data");
        return;
      }

      // Today's attendance
      const todayRecord = attendanceData?.find((a) => a.date === today) || null;
      setTodayAttendance(todayRecord);

      // Appointment stats
      const total = allAppointments?.length || 0;
      const completed =
        allAppointments?.filter((a) => a.status === "Completed").length || 0;
      const cancelled =
        allAppointments?.filter(
          (a) => a.status === "Cancelled" || a.status === "Rejected",
        ).length || 0;
      const upcoming =
        allAppointments?.filter(
          (a) =>
            (a.appointment_date ?? "") >= today &&
            ["Approved", "Accepted"].includes(a.status),
        ).length || 0;

      setAppointmentStats({ total, completed, upcoming, cancelled });

      // Upcoming appointments list (next 3)
      const upcomingList = (allAppointments || [])
        .filter(
          (a) =>
            (a.appointment_date ?? "") >= today &&
            ["Approved", "Accepted"].includes(a.status),
        )
        .slice(0, 3);

      setUpcomingAppointments(upcomingList);
    } catch {
      setError("Failed to load your data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return "—";
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAppointmentDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = () => {
    if (dutyStatus === "On Duty") {
      return {
        label: "On Duty",
        bg: "#f0fdf4",
        border: "#4caf50",
        borderColor: "rgba(76, 175, 80, 0.3)",
        bgColor: "rgba(76, 175, 80, 0.1)",
        color: "#16a34a",
        dot: "#22c55e",
      };
    }
    if (dutyStatus === "On Leave") {
      return {
        label: "On Leave",
        bg: "#fffbeb",
        border: "#f59e0b",
        borderColor: "rgba(245, 158, 11, 0.3)",
        bgColor: "rgba(245, 158, 11, 0.1)",
        color: "#d97706",
        dot: "#f59e0b",
      };
    }
    return {
      label: "Off Duty",
      bg: "#f9fafb",
      border: "#d1d5db",
      borderColor: "rgba(209, 213, 219, 0.3)",
      bgColor: "rgba(209, 213, 219, 0.1)",
      color: "#6b7280",
      dot: "#9ca3af",
    };
  };

  const statusConfig = getStatusConfig();

  if (loading) {
    return (
      <div
        className="overview-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-container">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="overview-container">
      <div className="overview-header">
        <h1>My Overview</h1>
        <p className="overview-subtitle">
          Welcome back, {staffProfile?.name || "Staff"}
        </p>
      </div>

      {/* Duty Status Card */}
      <Box sx={{ mb: 3 }}>
        <Card
          sx={{
            background: "#ffffff",
            border: `1px solid ${statusConfig.borderColor}`,
            borderRadius: "12px",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              py: "12px",
              px: "16px",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
                backgroundColor: statusConfig.bgColor,
                padding: "8px",
                borderRadius: "8px",
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: statusConfig.dot,
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#9ca3af",
                  mb: 0.5,
                  fontWeight: 500,
                  fontSize: { xs: "11px", sm: "12px" },
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Duty Status
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: statusConfig.color,
                  fontWeight: 700,
                  fontSize: { xs: "24px", sm: "28px" },
                }}
              >
                {statusConfig.label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#6b7280",
                  fontSize: "12px",
                  display: "block",
                  mt: 0.5,
                }}
              >
                {dutyStatus === "Off Duty"
                  ? ""
                  : !todayAttendance
                    ? "You haven't clocked in today"
                    : todayAttendance.time_out
                      ? `Clocked out at ${formatTime(todayAttendance.time_out)}`
                      : `Clocked in at ${formatTime(todayAttendance.time_in)}`}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Appointment Stats Cards */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 2 },
          width: "100%",
          mb: 3,
        }}
      >
        {[
          {
            label: "Total Appointments",
            value: appointmentStats.total,
            color: "#3b82f6",
            borderColor: "rgba(59, 130, 246, 0.3)",
            bgColor: "rgba(59, 130, 246, 0.1)",
            icon: FiCalendar,
          },
          {
            label: "Completed",
            value: appointmentStats.completed,
            color: "#10b981",
            borderColor: "rgba(16, 185, 129, 0.3)",
            bgColor: "rgba(16, 185, 129, 0.1)",
            icon: FiCheckCircle,
          },
          {
            label: "Upcoming",
            value: appointmentStats.upcoming,
            color: "#f59e0b",
            borderColor: "rgba(245, 158, 11, 0.3)",
            bgColor: "rgba(245, 158, 11, 0.1)",
            icon: FiClock,
          },
          {
            label: "Cancelled",
            value: appointmentStats.cancelled,
            color: "#dc2626",
            borderColor: "rgba(220, 38, 38, 0.3)",
            bgColor: "rgba(220, 38, 38, 0.1)",
            icon: FiX,
          },
        ].map((card) => {
          const IconComponent = card.icon;
          return (
            <Card
              key={card.label}
              sx={{
                background: "#ffffff",
                border: `1px solid ${card.borderColor}`,
                borderRadius: "12px",
                boxShadow: "none",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  py: "12px",
                  px: "16px",
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: 0,
                    backgroundColor: card.bgColor,
                    padding: "8px",
                    borderRadius: "8px",
                  }}
                >
                  <IconComponent size={32} color={card.color} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#9ca3af",
                      mb: 0.5,
                      fontWeight: 500,
                      fontSize: { xs: "11px", sm: "12px" },
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#000000",
                      fontWeight: 700,
                      fontSize: { xs: "24px", sm: "28px" },
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <div className="content-grid">
        {/* Today's Attendance */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Today's Attendance</h2>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="quick-stat-label">Status</span>
              <span
                className="quick-stat-value"
                style={{ color: statusConfig.color, fontSize: "14px" }}
              >
                {todayAttendance?.status || "No Record"}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Clock In</span>
              <span className="quick-stat-value">
                {formatTime(todayAttendance?.time_in)}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Clock Out</span>
              <span className="quick-stat-value">
                {formatTime(todayAttendance?.time_out)}
              </span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Role</span>
              <span className="quick-stat-value" style={{ fontSize: "14px" }}>
                {staffProfile?.role || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Appointments</h2>
          </div>
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    {formatTime(appointment.appointment_time || "")}
                  </div>
                  <div className="appointment-details">
                    <p className="appointment-patient">
                      {getAppointmentPatientName(appointment)}
                    </p>
                    <p className="appointment-doctor">
                      {formatAppointmentDate(appointment.appointment_date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                  padding: "20px",
                }}
              >
                No upcoming appointments
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview (role switcher) ─────────────────────────────────────────────────

function Overview() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminOverview /> : <StaffOverview />;
}

export default Overview;
