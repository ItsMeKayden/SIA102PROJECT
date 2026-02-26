import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { FiCalendar, FiClock, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const StaffDashboard: React.FC = () => {
  const { staffProfile } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
          Welcome, {staffProfile?.name}!
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          {staffProfile?.role} • {staffProfile?.specialization}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#dbeafe' }}>
                <FiCalendar size={24} color="#3b82f6" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>0</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>Today's Appointments</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#dcfce7' }}>
                <FiCheckCircle size={24} color="#10b981" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>0</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>Completed</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#fef3c7' }}>
                <FiClock size={24} color="#f59e0b" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>0</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>Pending</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#e0e7ff' }}>
                <FiUsers size={24} color="#6366f1" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>{staffProfile?.duty_status || 'Off Duty'}</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>Current Status</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Staff dashboard features are being implemented. You'll be able to:
        </Typography>
        <ul style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px' }}>
          <li>View and manage your appointments</li>
          <li>Track your attendance</li>
          <li>Manage your schedule</li>
          <li>View notifications</li>
        </ul>
      </Box>
    </Box>
  );
};
