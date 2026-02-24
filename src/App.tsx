import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './frontend/styles/App.css';
import Layout from './Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './frontend/components/auth/ProtectedRoute';

import Overview from './frontend/pages/Overview';
import StaffInformation from './frontend/pages/StaffInformation';
import Attendance from './frontend/pages/Attendance';
import Analytics from './frontend/pages/Analytics';
import Appointments from './frontend/pages/Appointments';
import Schedule from './frontend/pages/Schedule';
import { StaffDashboard } from './frontend/pages/StaffDashboard';
import { CircularProgress, Box } from '@mui/material';

// Dashboard Router - redirects based on role
const DashboardRouter = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (userRole === 'admin') {
    return <Overview />;
  } else if (userRole === 'staff') {
    return <StaffDashboard />;
  }

  return <Overview />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardRouter />} />
            
            {/* Admin-only routes */}
            <Route path="staff" element={<ProtectedRoute requireAdmin><StaffInformation /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
            
            {/* Shared routes */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="schedule" element={<Schedule />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
