import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { FiCalendar, FiClock, FiCheckCircle, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointmentsByDoctorId } from '../../backend/services/appointmentService';
import type { Appointment } from '../../types';

export const StaffDashboard: React.FC = () => {
  const { staffProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffProfile?.id) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await getAppointmentsByDoctorId(staffProfile.id);
      if (data) setAppointments(data);
      setLoading(false);
    };
    fetchData();
  }, [staffProfile?.id]);

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === today);
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const pending = appointments.filter(a =>
    a.status === 'Pending' || a.status === 'Approved' || a.status === 'Assigned'
  ).length;

  const cards = [
    {
      icon: <FiCalendar size={24} color="#3b82f6" />,
      bg: '#dbeafe',
      value: loading ? <CircularProgress size={20} /> : todayAppointments.length,
      label: "Today's Appointments",
    },
    {
      icon: <FiCheckCircle size={24} color="#10b981" />,
      bg: '#dcfce7',
      value: loading ? <CircularProgress size={20} /> : completed,
      label: 'Completed',
    },
    {
      icon: <FiClock size={24} color="#f59e0b" />,
      bg: '#fef3c7',
      value: loading ? <CircularProgress size={20} /> : pending,
      label: 'Pending',
    },
    {
      icon: <FiUsers size={24} color="#6366f1" />,
      bg: '#e0e7ff',
      value: staffProfile?.duty_status || 'Off Duty',
      label: 'Current Status',
    },
  ];

  return (
    <Box sx={{ p: 3, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
          Welcome, {staffProfile?.name}!
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          {staffProfile?.role}{staffProfile?.specialization ? ` • ${staffProfile.specialization}` : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {cards.map((card, idx) => (
          <Card key={idx} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: card.bg }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>{card.value}</Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>{card.label}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
