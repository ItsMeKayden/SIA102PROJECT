import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { CircularProgress, Box } from "@mui/material";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[]; // e.g. ['Doctor', 'Admin'] — if set, only these roles can access
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedRoles,
}) => {
  const { user, staffProfile, isAdmin, loading } = useAuth();

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

  // Not authenticated
  if (!user || !staffProfile) {
    return <Navigate to="/" replace />;
  }

  // Admin-only check
  if (requireAdmin && !isAdmin) {
    return <AccessDenied message="Admin privileges required" />;
  }

  // Role-based check — if allowedRoles is provided, the user's role must be in the list
  if (allowedRoles && !isAdmin) {
    const userRole = staffProfile.role?.toLowerCase();
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole ?? "")) {
      return (
        <AccessDenied message="You don't have permission to access this page" />
      );
    }
  }

  return <>{children}</>;
};

function AccessDenied({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        gap: 1,
      }}
    >
      <Box sx={{ fontSize: "32px" }}>🚫</Box>
      <Box sx={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
        Access Denied
      </Box>
      <Box sx={{ fontSize: "13px", color: "#6b7280" }}>{message}</Box>
    </Box>
  );
}
