import '../styles/Pages.css';
import './Overview.css';
import { useEffect, useState } from 'react';
import { CircularProgress, Alert } from '@mui/material';
import { getStaffCountByStatus } from '../../backend/services/staffService';
import { getUpcomingAppointments, getAppointmentStats } from '../../backend/services/appointmentService';
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
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch staff count
      const { data: staffCounts, error: staffError } = await getStaffCountByStatus();
      
      // Fetch appointment stats
      const { data: appointmentStats, error: appointmentError } = await getAppointmentStats();
      
      // Fetch upcoming appointments
      const { data: upcoming, error: upcomingError } = await getUpcomingAppointments(3);
      
      // Fetch attendance data for today
      const { data: attendanceData, error: attendanceError } = await getAllAttendance();
      
      if (staffError || appointmentError || upcomingError || attendanceError) {
        setError('Failed to load dashboard data');
        return;
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData?.filter(a => a.date === today) || [];
      const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
      
      // Calculate attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentAttendance = attendanceData?.filter(a => new Date(a.date) >= thirtyDaysAgo) || [];
      const attendanceRate = recentAttendance.length > 0 
        ? (recentAttendance.filter(a => a.status === 'Present').length / recentAttendance.length) * 100
        : 0;

      setStats({
        totalStaff: staffCounts?.total || 0,
        presentToday: presentToday,
        appointments: appointmentStats?.total || 0,
        completedAppointments: appointmentStats?.completed || 0,
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
    } catch (err) {
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
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalStaff}</h3>
            <p>Total Staff</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.appointments}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <h3>{stats.completedAppointments}</h3>
            <p>Completed Today</p>
          </div>
        </div>
      </div>

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
              <span>Next Maintenance: Feb 20, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
