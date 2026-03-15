import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './frontend/styles/App.css';
import Layout from './Layout';
import Landing from './frontend/pages/Landing';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './frontend/components/auth/ProtectedRoute';
import Overview from './frontend/pages/Overview';
import StaffInformation from './frontend/pages/StaffInformation';
import Attendance from './frontend/pages/Attendance';
import Analytics from './frontend/pages/Analytics';
import Appointments from './frontend/pages/Appointments';
import Schedule from './frontend/pages/Schedule';
import { CircularProgress, Box } from '@mui/material';

// Create MUI theme with Poppins font
const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    h1: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    h2: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    h3: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    h4: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    h5: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    h6: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    body1: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    body2: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
    button: { fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif" },
  },
});

// Router Component - shows Landing or redirects to auth-required route for dashboard
const MainRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show Landing if not authenticated
  if (!user) {
    return <Landing />;
  }

  // If authenticated, the dashboard route will match
  return <Navigate to="/attendance" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<MainRouter />} />
            
            {/* Dashboard with Layout for authenticated users */}
            <Route element={<Layout />}>
              <Route path="overview" element={<ProtectedRoute requireAdmin><Overview /></ProtectedRoute>} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="staffnservices" element={<ProtectedRoute requireAdmin><StaffInformation /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
