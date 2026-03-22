import '../styles/Pages.css';
import '../styles/Overview.css';
import { useEffect, useState } from 'react';
import { CircularProgress, Alert, Card, CardContent, Typography, Box } from '@mui/material';
import { FiUsers, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { getStaffCountByStatus } from '../../backend/services/staffService';
import { getUpcomingAppointments, getAppointmentStats, getAppointmentsByDate } from '../../backend/services/appointmentService';
import { getAllAttendance } from '../../backend/services/attendanceService';
import type { Appointment } from '../../types';

function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    appointments: 0,
    completedAppointments: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    description: string;
    time: string;
  }>>([]);
  const [quickStats, setQuickStats] = useState({
    attendanceRate: 0,
    avgDailyAppointments: 0,
    activeStaff: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch staff count
      const { data: staffCounts, error: staffError } = await getStaffCountByStatus();
      
      // Fetch appointment stats
      const { data: appointmentStats, error: appointmentError } = await getAppointmentStats();
      
      // Fetch upcoming appointments
      const { data: upcoming, error: upcomingError } = await getUpcomingAppointments(3);
      
      // Fetch today's appointments
      const { data: todayAppointments, error: todayAppointmentsError } = await getAppointmentsByDate(today);
      
      // Fetch attendance data for today
      const { data: attendanceData, error: attendanceError } = await getAllAttendance();
      
      if (staffError || appointmentError || upcomingError || attendanceError || todayAppointmentsError) {
        setError('Failed to load dashboard data');
        return;
      }

      // Calculate stats
      const todayAttendance = attendanceData?.filter(a => a.date === today) || [];
      const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
      
      // Get completed appointments for today
      const completedToday = todayAppointments?.filter(a => a.status === 'Completed').length || 0;
      
      // Calculate attendance rate (last 30 days)
      // Present = 1.0 point, Late = 0.5 point, others = 0 points
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance = attendanceData?.filter(a => new Date(a.date) >= thirtyDaysAgo) || [];
      const attendanceRate = recentAttendance.length > 0 
        ? ((recentAttendance.filter(a => a.status === 'Present').length * 1.0 + recentAttendance.filter(a => a.status === 'Late').length * 0.5) / recentAttendance.length) * 100
        : 0;

      setStats({
        totalStaff: staffCounts?.total || 0,
        presentToday: presentToday,
        appointments: appointmentStats?.total || 0,
        completedAppointments: completedToday,
      });

      setQuickStats({
        attendanceRate: Number.parseFloat(attendanceRate.toFixed(1)),
        avgDailyAppointments: appointmentStats?.total ? Math.round(appointmentStats.total / 30) : 0,
        activeStaff: staffCounts?.onDuty || 0,
        pendingTasks: appointmentStats?.scheduled || 0,
      });

      setUpcomingAppointments(upcoming || []);

      // Generate recent activity from attendance and appointments
      const activities: Array<{ id: string; type: string; description: string; time: string }> = [];
      
      // Add recent attendance
      todayAttendance.slice(0, 2).forEach((att, idx) => {
        activities.push({
          id: `attendance-${idx}`,
          type: 'Staff',
          description: `Staff checked in`,
          time: formatRelativeTime(att.time_in || ''),
        });
      });
      
      // Add recent appointments
      upcoming?.slice(0, 2).forEach((app, idx) => {
        activities.push({
          id: `appointment-${idx}`,
          type: 'Appointment',
          description: `Appointment scheduled - ${app.patient_name || 'Patient'}`,
          time: formatRelativeTime(app.appointment_time || ''),
        });
      });

      setRecentActivity(activities.slice(0, 4));
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (time: string) => {
    if (!time) return 'Recently';
    const now = new Date();
    const timeDate = new Date(`${now.toISOString().split('T')[0]}T${time}`);
    const diffMs = now.getTime() - timeDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  const formatAppointmentTime = (time: string) => {
    if (!time) return 'TBD';
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="overview-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
        <h1>Dashboard Overview</h1>
        <p className="overview-subtitle">Welcome to CLINIKA+ - Your clinic management dashboard</p>
      </div>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1, sm: 1.5, md: 2 },
          mb: 3,
        }}
      >
        {[
          { label: 'Total Staff', value: stats.totalStaff, Icon: FiUsers, color: '#f59e0b', rgb: '245, 158, 11' },
          { label: 'Present Today', value: stats.presentToday, Icon: FiCheckCircle, color: '#22c55e', rgb: '34, 197, 94' },
          { label: 'Total Appointments', value: stats.appointments, Icon: FiCalendar, color: '#3b82f6', rgb: '59, 130, 246' },
          { label: 'Completed Today', value: stats.completedAppointments, Icon: FiCheckCircle, color: '#10b981', rgb: '16, 185, 129' },
        ].map((card) => (
          <Card key={card.label} sx={{ background: '#ffffff', border: `1px solid rgba(${card.rgb}, 0.3)`, borderRadius: '12px', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: `rgba(${card.rgb}, 0.1)`, padding: '8px', borderRadius: '8px' }}>
                <card.Icon size={32} color={card.color} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ fontSize: { xs: '20px', sm: '24px' }, fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Recent Activity */}
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

        {/* Upcoming Appointments */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Appointments</h2>
          </div>
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">{formatAppointmentTime(appointment.appointment_time || '')}</div>
                  <div className="appointment-details">
                    <p className="appointment-patient">{appointment.patient_name || 'Patient'}</p>
                    <p className="appointment-doctor">Doctor ID: {appointment.doctor_id || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Quick Stats</h2>
          </div>
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="quick-stat-label">Attendance Rate</span>
              <span className="quick-stat-value">{quickStats.attendanceRate}%</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Avg. Daily Appointments</span>
              <span className="quick-stat-value">{quickStats.avgDailyAppointments}</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Active Staff</span>
              <span className="quick-stat-value">{quickStats.activeStaff}</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Pending Tasks</span>
              <span className="quick-stat-value">{quickStats.pendingTasks}</span>
            </div>
          </div>
        </div>

        {/* System Status */}
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

export default Overview;
