import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, staffProfile, isAdmin, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated - redirect to landing
  if (!user || !staffProfile) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but not admin when admin is required
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#dc2626'
      }}>
        Access Denied: Admin privileges required
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
};
