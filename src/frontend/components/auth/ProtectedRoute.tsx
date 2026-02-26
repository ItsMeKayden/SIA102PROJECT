import { ReactNode, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { LoginModal } from './LoginModal';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, staffProfile, isAdmin, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (!user || !staffProfile) {
    return (
      <>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: '16px'
        }}>
          <p style={{ fontSize: '16px', color: '#374151', margin: 0 }}>
            Please sign in to access this page
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              padding: '8px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
        <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </>
    );
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
