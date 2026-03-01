import '../styles/Pages.css';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Pie,
  Cell,
} from 'recharts';
import { getAnalyticsStats } from '../../backend/services/analyticsService';
import type { AnalyticsStats } from '../../types';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
 

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: analytics, error: analyticsError } = await getAnalyticsStats();

      if (analyticsError || !analytics) {
        setError('Failed to load analytics data');
        return;
      }

      setStats(analytics);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        width: '100%', 
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px', 
        width: '100%', 
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  // Chart data variables

  const monthlyPerformanceData = [
    { month: 'Jan', value: 85 },
    { month: 'Feb', value: 90 },
    { month: 'Mar', value: 88 },
    { month: 'Apr', value: 92 },
    { month: 'May', value: 95 },
    { month: 'Jun', value: 98 },
  ];

  const workDistributionData = [
    { name: 'Doctor', value: 35 },
    { name: 'Nurse', value: 25 },
    { name: 'Staff', value: 20 },
    { name: 'Admin', value: 20 },
  ];

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ 
      padding: '24px', 
      width: '100%', 
      maxWidth: '1400px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      {/* Staff Activity Overview */}
      <Box sx={{ 
        padding: '12px 0', 
        mb: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
          Staff Activity Overview
        </Typography>
      </Box>

      

      {/* Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 4,
          width: '100%',
        }}
      >
        {/* Total Consultation */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '2px solid #22c55e',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography sx={{ fontSize: '14px', color: '#666', fontWeight: '600', mb: 1.5 }}>
              Total Consultation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '20px' }}>Rx</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                {stats ? `${stats.totalConsultations} Consultation${stats.totalConsultations === 1 ? '' : 's'}` : '--'}
              </Typography>
            </Box>
            {/* optional percent change could go here */}
          </CardContent>
        </Card>

        {/* Avg Patients Per Doctor */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography sx={{ fontSize: '14px', color: '#666', fontWeight: '600', mb: 1.5 }}>
              Ave. Patients Per Doctor
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '20px' }}>👥</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats ? `${stats.avgPatientsPerDoctor.toFixed(1)} Patients` : '--'}
              </Typography>
            </Box>
            {/* percentage change */}
          </CardContent>
        </Card>

        {/* Nurse Assistance Count */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography sx={{ fontSize: '14px', color: '#666', fontWeight: '600', mb: 1.5 }}>
              Nurse Assistance Count
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '20px' }}>🏥</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {stats ? `${stats.nurseAssistanceCount} Assistance` : '--'}
              </Typography>
            </Box>
            {/* percentage change */}
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '2px solid #22c55e',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography sx={{ fontSize: '14px', color: '#666', fontWeight: '600', mb: 1.5 }}>
              Attendance Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontSize: '20px' }}>📅</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
                {stats ? `${Math.round(stats.attendanceRate)}%` : '--'}
              </Typography>
            </Box>
            {/* remark could be added here */}
          </CardContent>
        </Card>
      </Box>


      {/* Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 4,
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* Monthly Performance */}
        <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', minHeight: { xs: 'auto', md: '460px' } }}>
          <CardContent sx={{ p: 3, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                Monthly Performance
              </Typography>
              <Button 
                size="small" 
                sx={{ 
                  fontSize: '13px', 
                  textTransform: 'none', 
                  color: '#666',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  px: 2,
                  py: 0.8
                }}
              >
                Last 6 Months
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPerformanceData} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ borderTop: '2px solid #d1d5db', pt: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ fontSize: '18px' }}>📌</Typography>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: '#666', mb: 0.5 }}>
                    Insight
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ Clinic productivity increased by 37%</span> from September to February, with steady growth across all staff roles.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right Column: Work Distribution and Insight & Alerts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          {/* Work Distribution */}
          <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 'bold', mb: 2, alignSelf: 'flex-start' }}>
                Work Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={workDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workDistributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insight & Alerts Card */}
          <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '20px' }}>✓</Typography>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 'bold', mb: 1 }}>
                    Insight & Alerts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: '12px', color: '#555' }}>
                      • Doctor consultations increased by <strong>15.4%</strong> compared to last month
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#555' }}>
                      • Nurse assistance tasks reached <strong>10k</strong> mark this month
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#555' }}>
                      • Staff attendance remains high at <strong>96%</strong>, ensuring stable clinic operations
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </div>
  );
};

export default Analytics;
