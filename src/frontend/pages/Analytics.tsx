import { useState } from 'react';
import {Container, Box, Typography, Card, CardContent, Select, MenuItem, Table, TableBody,
        TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Stack} from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import '../styles/AnalyticsStyles.css';

const Analytics = () => {
  const [selectedStaff, setSelectedStaff] = useState('John Doe');
  const [startDate, setStartDate] = useState(dayjs('2026-01-01'));
  const [endDate, setEndDate] = useState(dayjs('2026-01-31'));

  // Mock data for the productivity chart
  const productivityData = [
    { day: 0, productivity: 22 },
    { day: 5, productivity: 20 },
    { day: 10, productivity: 18 },
    { day: 15, productivity: 21 },
    { day: 20, productivity: 19 },
    { day: 25, productivity: 23 },
    { day: 31, productivity: 25 },
  ];

  // Mock data for task table
  const taskData = [
    { name: 'Patient Vital Signs Monitoring', status: 'Completed', hours: '42 hrs' },
    { name: 'Patient Care & Assistance', status: 'Completed', hours: '60 hrs' },
    { name: 'Medication Administration', status: 'Completed', hours: '38 hrs' },
    { name: 'Wound Dressing & Care', status: 'Completed', hours: '26 hrs' },
    { name: 'Medical Record Documentation', status: 'Completed', hours: '22 hrs' },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Container maxWidth={false} className="analytics-container">

      {/* Staff Activity Overview */}
      <h2 className='Title'>
        Staff Activity Overview
      </h2>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        {/* Hours Worked Card */}
        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #a8e6e3 0%, #7dd3cd 100%)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Hours Worked
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                0 hrs
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tasks Completed Card */}
        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tasks Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                0 tasks
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Attendance Rate Card */}
        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #f8bbd0 0%, #f48fb1 100%)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Attendance Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                0%
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Workload Indicators Card */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Workload Indicators
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '2px' }} />
                <Typography variant="body2">Assigned Tasks: 18</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#ffc107', borderRadius: '2px' }} />
                <Typography variant="body2">Pending Tasks: 3</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#f44336', borderRadius: '2px' }} />
                <Typography variant="body2">Overtime Hours: 12</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Productivity Chart and Staff Info */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 4 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                Staff Productivity Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2196f3" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2196f3" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="productivity"
                    stroke="#2196f3"
                    fillOpacity={1}
                    fill="url(#colorProductivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Staff Info Card */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Staff:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {selectedStaff}
              </Typography>
              
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Department:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Nurse
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Date:</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Jan 1 - Jan 31
                </Typography>
              
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tasks Table */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" sx={{ mb: 2, gap: 155 }}
          >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0 }}>
            Staff: {selectedStaff}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 0, whiteSpace: 'nowrap', textAlign: 'right'}}>
            Date: {startDate.format('MMM D')} - {endDate.format('MMM D')}
          </Typography>
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Task Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Hours Spent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskData.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell>{task.name}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.hours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
    </LocalizationProvider>
  );
};

export default Analytics;
