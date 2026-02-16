import '../styles/Pages.css';
import './Overview.css';

function Overview() {
  // Sample data - replace with actual data from your backend
  const stats = {
    totalStaff: 45,
    presentToday: 38,
    appointments: 12,
    completedAppointments: 8,
  };

  const recentActivity = [
    { id: 1, type: 'Appointment', description: 'New appointment scheduled - Dr. Smith', time: '10 min ago' },
    { id: 2, type: 'Staff', description: 'John Doe checked in', time: '25 min ago' },
    { id: 3, type: 'Appointment', description: 'Appointment completed - Patient #1234', time: '1 hour ago' },
    { id: 4, type: 'Staff', description: 'Sarah Johnson updated availability', time: '2 hours ago' },
  ];

  const upcomingAppointments = [
    { id: 1, patient: 'Patient #1235', doctor: 'Dr. Smith', time: '10:00 AM' },
    { id: 2, patient: 'Patient #1236', doctor: 'Dr. Johnson', time: '11:30 AM' },
    { id: 3, patient: 'Patient #1237', doctor: 'Dr. Williams', time: '2:00 PM' },
  ];

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
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-time">{appointment.time}</div>
                <div className="appointment-details">
                  <p className="appointment-patient">{appointment.patient}</p>
                  <p className="appointment-doctor">{appointment.doctor}</p>
                </div>
              </div>
            ))}
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
              <span className="quick-stat-value">84.4%</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Avg. Daily Appointments</span>
              <span className="quick-stat-value">15</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Active Staff</span>
              <span className="quick-stat-value">42</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Pending Tasks</span>
              <span className="quick-stat-value">7</span>
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
