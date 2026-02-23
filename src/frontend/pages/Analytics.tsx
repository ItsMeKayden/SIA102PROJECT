import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EventNoteIcon from '@mui/icons-material/EventNote';
import '../styles/AnalyticsStyles.css';

const Analytics = () => {
  const [period, setPeriod] = useState('all');
  const [month, setMonth] = useState('current');
  const [year, setYear] = useState('2026');

  // Staff Activity data
  const staffActivityData = [
    { date: 'Feb 3', thisMonth: 120, lastMonth: 110 },
    { date: 'Feb 4', thisMonth: 130, lastMonth: 115 },
    { date: 'Feb 5', thisMonth: 125, lastMonth: 112 },
    { date: 'Feb 6', thisMonth: 140, lastMonth: 120 },
    { date: 'Feb 7', thisMonth: 150, lastMonth: 125 },
    { date: 'Feb 8', thisMonth: 145, lastMonth: 122 },
    { date: 'Feb 9', thisMonth: 160, lastMonth: 130 },
    { date: 'Feb 10', thisMonth: 170, lastMonth: 135 },
    { date: 'Feb 11', thisMonth: 165, lastMonth: 140 },
    { date: 'Feb 12', thisMonth: 175, lastMonth: 145 },
    { date: 'Feb 13', thisMonth: 180, lastMonth: 150 },
    { date: 'Feb 14', thisMonth: 190, lastMonth: 155 },
  ];

  // Monthly Performance data
  const monthlyPerformanceData = [
    { month: 'Feb', value: 420 },
    { month: 'Jan', value: 380 },
    { month: 'Dec', value: 350 },
    { month: 'Nov', value: 320 },
    { month: 'Oct', value: 300 },
    { month: 'Sep', value: 290 },
  ];

  // Work Distribution data
  const workDistributionData = [
    { name: 'Doctor', value: 45 },
    { name: 'Nurse', value: 35 },
    { name: 'Receptionist', value: 20 },
  ];

  const pieColors = ['#1e3a8a', '#10b981', '#fbbf24'];

  return (
    <Box sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
      {/* Header with Date Selector */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 2.5,
        background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EventNoteIcon sx={{ color: '#3b82f6', fontSize: '24px' }} />
          <Typography sx={{ fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>
            January - February
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d5db'
                }
              }}
            >
              <MenuItem value="current">Month</MenuItem>
              <MenuItem value="january">January</MenuItem>
              <MenuItem value="february">February</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d5db'
                }
              }}
            >
              <MenuItem value="2025">2025</MenuItem>
              <MenuItem value="2026">2026</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
                230 Consultation
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>
              +16.4%
            </Typography>
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
                115 Patients
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
              +5.4%
            </Typography>
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
                250 Assistance
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
              +10.2%
            </Typography>
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
                96%
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
              Only I absent,<br />recorded this month
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Staff Activity Chart */}
      <Card sx={{ mb: 4, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3, width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a' }}>
              📈 Staff Activity
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, fontSize: '12px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#1e3a8a', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '12px' }}>This Month</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#d1d5db', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '12px' }}>Last Month</Typography>
              </Box>
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={staffActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="thisMonth"
                stroke="#1e3a8a"
                strokeWidth={2}
                dot={false}
                name="This Month"
              />
              <Line
                type="monotone"
                dataKey="lastMonth"
                stroke="#d1d5db"
                strokeWidth={2}
                dot={false}
                name="Last Month"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                    {workDistributionData.map((entry, index) => (
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
    </Box>
  );
};

export default Analytics;
