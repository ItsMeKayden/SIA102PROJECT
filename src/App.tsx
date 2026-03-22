import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "./frontend/styles/App.css";
import Layout from "./Layout";
import Landing from "./frontend/pages/Landing";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./frontend/components/auth/ProtectedRoute";
import { ErrorBoundary } from "./frontend/components/scanner/ErrorBoundary";
import Overview from "./frontend/pages/Overview";
import StaffInformation from "./frontend/pages/StaffInformation";
import Attendance from "./frontend/pages/Attendance";
import Analytics from "./frontend/pages/Analytics";
import Appointments from "./frontend/pages/Appointments";
import Schedule from "./frontend/pages/Schedule";
import { CircularProgress, Box } from "@mui/material";

// Create MUI theme with Poppins font
const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    h1: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    h2: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    h3: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    h4: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    h5: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    h6: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    body1: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    body2: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
    button: {
      fontFamily: "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
    },
  },
});

const MainRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Landing />;

  return <Layout />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainRouter />}>
                {/* Admin-only routes */}
                <Route
                  path="overview"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Overview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="staffnservices"
                  element={
                    <ProtectedRoute requireAdmin>
                      <StaffInformation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />

                {/* Shared routes */}
                <Route path="attendance" element={<Attendance />} />
                <Route path="schedule" element={<Schedule />} />

                {/* Doctors and Admins only — Nurses and Receptionists are blocked */}
                <Route
                  path="appointments"
                  element={
                    <ProtectedRoute allowedRoles={["Doctor"]}>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
