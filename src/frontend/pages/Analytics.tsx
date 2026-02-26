import '../styles/Pages.css';
import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getAllAttendance } from '../../backend/services/attendanceService';
import { getAppointmentStats } from '../../backend/services/appointmentService';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityCards, setActivityCards] = useState([
    { title: 'Hours Worked', value: '0hrs', bgColor: '#67e8f9' },
    { title: 'Tasks Completed', value: '0 tasks', bgColor: '#86efac' },
    { title: 'Attendance Rate', value: '0%', bgColor: '#fca5a5' },
  ]);
  const [workloadData, setWorkloadData] = useState([
    { label: 'Assigned Tasks:', value: 0, color: '#10b981' },
    { label: 'Pending Tasks:', value: 0, color: '#f59e0b' },
    { label: 'Overtime Hours:', value: 0, color: '#ef4444' },
  ]);
  const [taskData, setTaskData] = useState<Array<{ name: string; status: string; hours: string }>>([]);
  const [chartData, setChartData] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch attendance data
      const { data: attendanceRecords, error: attendanceError } = await getAllAttendance();
      
      // Fetch appointment stats
      const { data: appointmentStats, error: appointmentError } = await getAppointmentStats();
      
      if (attendanceError || appointmentError) {
        setError('Failed to load analytics data');
        return;
      }

      if (attendanceRecords) {
        // Helper function to calculate hours between two times
        const calculateHours = (timeIn: string | null, timeOut: string | null): number => {
          if (!timeIn || !timeOut) return 0;
          const start = new Date(`2000-01-01T${timeIn}`);
          const end = new Date(`2000-01-01T${timeOut}`);
          const diffMs = end.getTime() - start.getTime();
          return diffMs / (1000 * 60 * 60);
        };

        // Calculate total hours worked
        const totalHours = attendanceRecords.reduce((sum, record) => {
          const hours = calculateHours(record.time_in, record.time_out);
          return sum + hours;
        }, 0);

        // Calculate attendance rate
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const attendanceRate = attendanceRecords.length > 0 
          ? (presentCount / attendanceRecords.length) * 100 
          : 0;

        // Calculate overtime hours
        const overtimeHours = attendanceRecords.reduce((sum, record) => {
          const hours = calculateHours(record.time_in, record.time_out);
          return sum + (hours > 8 ? hours - 8 : 0);
        }, 0);

        setActivityCards([
          { title: 'Hours Worked', value: `${Math.round(totalHours)}hrs`, bgColor: '#67e8f9' },
          { title: 'Tasks Completed', value: `${appointmentStats?.completed || 0} tasks`, bgColor: '#86efac' },
          { title: 'Attendance Rate', value: `${Math.round(attendanceRate)}%`, bgColor: '#fca5a5' },
        ]);

        setWorkloadData([
          { label: 'Assigned Tasks:', value: appointmentStats?.total || 0, color: '#10b981' },
          { label: 'Pending Tasks:', value: appointmentStats?.scheduled || 0, color: '#f59e0b' },
          { label: 'Overtime Hours:', value: Math.round(overtimeHours), color: '#ef4444' },
        ]);

        // Generate task breakdown from recent attendance
        const recentRecords = attendanceRecords.slice(0, 5);
        const tasks = recentRecords.map((record, idx) => ({
          name: `Task ${idx + 1} - ${new Date(record.date).toLocaleDateString()}`,
          status: record.status === 'Present' ? 'Completed' : record.status,
          hours: `${calculateHours(record.time_in, record.time_out).toFixed(1)} hrs`,
        }));
        
        setTaskData(tasks.length > 0 ? tasks : [
          { name: 'No tasks available', status: 'N/A', hours: '0 hrs' }
        ]);

        // Generate chart data from attendance records (last 32 days)
        const last32Days = attendanceRecords.slice(0, 32).reverse();
        const generatedChartData = last32Days.map((record, i) => {
          const hours = calculateHours(record.time_in, record.time_out);
          return {
            x: i,
            y: Math.max(5, Math.min(22, hours + (Math.random() - 0.5) * 2)),
          };
        });
        
        setChartData(generatedChartData.length > 0 ? generatedChartData : 
          Array.from({ length: 32 }, (_, i) => ({
            x: i,
            y: Math.max(5, Math.min(22, 12 + (Math.random() - 0.5) * 4)),
          }))
        );
      }

    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const createChartPath = () => {
    const width = 940;
    const height = 200;
    const xOffset = 30;
    const points = chartData.map((point, i) => {
      const x = xOffset + (i / Math.max(chartData.length - 1, 1)) * width;
      const y = height - ((point.y - 5) / 20) * height;
      return `${x},${y}`;
    });
    return `M ${xOffset},${height} L ${points.join(' L ')} L ${xOffset + width},${height} Z`;
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
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px', color: '#1a202c' }}>
          Staff Activity Overview
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        gap: '16px', 
        mb: 3, 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {activityCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              flex: '1 1 0',
              minWidth: '180px',
              maxWidth: '250px',
              height: 110,
              backgroundColor: card.bgColor,
              boxShadow: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px !important',
            }}>
              <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 400, mb: 1, color: '#000' }}>
                {card.title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', fontSize: '36px', color: '#000', lineHeight: 1 }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
        
        {/* Workload Indicators Card */}
        <Card
          sx={{
            flex: '1 1 0',
            minWidth: '180px',
            maxWidth: '250px',
            height: 110,
            backgroundColor: '#f3f4f6',
            boxShadow: 'none',
            borderRadius: '8px',
          }}
        >
          <CardContent sx={{ pt: 1.5, pb: 1.5 }}>
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
              Workload Indicators
            </Typography>
            {workloadData.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: 0.3 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '2px',
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '10px' }}>
                  {item.label} {item.value}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Staff Productivity Over Time */}
      <Box sx={{ 
        backgroundColor: '#d1d5db', 
        padding: '12px 0', 
        mb: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontStyle: 'italic', fontSize: '18px', color: '#374151' }}>
          Staff Productivity Over Time
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: '16px', mb: 3, flexWrap: 'wrap' }}>
        {/* Chart - Takes up most of the width */}
        <Card sx={{ 
          flex: '1 1 100%',
          width: '100%',
          backgroundColor: 'white',
          boxShadow: 'none',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <CardContent sx={{ p: 2, overflow: 'hidden' }}>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height="240" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', minWidth: '300px' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="30" y1="200" x2="1000" y2="200" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="30" y1="100" x2="1000" y2="100" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="30" y1="0" x2="1000" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              
              {/* Y-axis line */}
              <line x1="30" y1="0" x2="30" y2="200" stroke="#9ca3af" strokeWidth="1.5" />
              
              {/* Chart path with offset for Y-axis */}
              <path d={createChartPath()} fill="url(#chartGradient)" stroke="#3b82f6" strokeWidth="2.5" />
              
              {/* X-axis labels */}
              <text x="30" y="216" fontSize="11" fill="#6b7280" fontFamily="sans-serif">0</text>
              <text x="345" y="216" fontSize="11" fill="#6b7280" fontFamily="sans-serif">10</text>
              <text x="660" y="216" fontSize="11" fill="#6b7280" fontFamily="sans-serif">20</text>
              <text x="990" y="216" fontSize="11" fill="#6b7280" fontFamily="sans-serif" textAnchor="end">31</text>
              
              {/* Y-axis labels */}
              <text x="10" y="6" fontSize="11" fill="#6b7280" fontFamily="sans-serif">25</text>
              <text x="10" y="106" fontSize="11" fill="#6b7280" fontFamily="sans-serif">15</text>
              <text x="18" y="206" fontSize="11" fill="#6b7280" fontFamily="sans-serif">0</text>
            </svg>            </Box>          </CardContent>
        </Card>

        {/* Staff Info Card - Small card on the right */}
        <Card sx={{ 
          flex: '0 0 200px',
          minWidth: '200px',
          maxWidth: '200px',
          backgroundColor: 'white',
          boxShadow: 'none',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          height: 'fit-content'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5, color: '#6b7280' }}>
              Staff:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: 600, fontStyle: 'italic', mb: 2, color: '#111827' }}>
              John Doe
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5, color: '#6b7280' }}>
              Department:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '14px', fontStyle: 'italic', mb: 2, color: '#111827' }}>
              Nurse
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5, color: '#6b7280' }}>
              Date:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '14px', fontStyle: 'italic', color: '#111827' }}>
              Jan 1 - Jan 31
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Task Table */}
      <Box sx={{ 
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '14px', color: '#111827' }}>
            Staff: <span style={{ fontStyle: 'italic', fontWeight: 600 }}>John Doe</span>
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '13px' }}>
            Date: January 2026
          </Typography>
        </Box>

        <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflowX: 'auto' }}>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '12px', width: '50%', borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
                  Task Name
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', width: '25%', borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', width: '25%', borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
                  Hours Spent
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taskData.map((task, index) => (
                <TableRow 
                  key={index} 
                  sx={{ 
                    '&:hover': { backgroundColor: '#f9fafb' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ 
                    fontSize: '12px', 
                    py: 1.5,
                    borderBottom: index < taskData.length - 1 ? '1px solid #e5e7eb' : 0,
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {task.name}
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    fontSize: '12px', 
                    py: 1.5,
                    borderBottom: index < taskData.length - 1 ? '1px solid #e5e7eb' : 0 
                  }}>
                    {task.status}
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    fontSize: '12px', 
                    py: 1.5,
                    borderBottom: index < taskData.length - 1 ? '1px solid #e5e7eb' : 0 
                  }}>
                    {task.hours}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}

export default Analytics;
