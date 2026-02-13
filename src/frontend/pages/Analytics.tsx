import '../styles/Pages.css';
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
  Paper,
} from '@mui/material';

function Analytics() {
  const activityCards = [
    { title: 'Hours Worked', value: '160hrs', bgColor: '#67e8f9' },
    { title: 'Tasks Completed', value: '48 tasks', bgColor: '#86efac' },
    { title: 'Attendance Rate', value: '92%', bgColor: '#fca5a5' },
  ];

  const workloadData = [
    { label: 'Assigned Tasks:', value: 18, color: '#10b981' },
    { label: 'Pending Tasks:', value: 3, color: '#f59e0b' },
    { label: 'Overtime Hours:', value: 12, color: '#ef4444' },
  ];

  const taskData = [
    { name: 'Patient Vital Signs Monitoring', status: 'Completed', hours: '42 hrs' },
    { name: 'Patient Care & Assistance', status: 'Completed', hours: '60 hrs' },
    { name: 'Medication Administration', status: 'Completed', hours: '38 hrs' },
    { name: 'Wound Dressing & Care', status: 'Completed', hours: '26 hrs' },
    { name: 'Medical Record Documentation', status: 'Completed', hours: '22 hrs' },
  ];

  // Generate mock chart data
  const chartData = Array.from({ length: 32 }, (_, i) => ({
    x: i,
    y: Math.random() * 15 + 5 + Math.sin(i / 3) * 5,
  }));

  const createChartPath = () => {
    const width = 400;
    const height = 150;
    const points = chartData.map((point, i) => {
      const x = (i / 31) * width;
      const y = height - (point.y / 25) * height;
      return `${x},${y}`;
    });
    return `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
  };

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Staff Activity Overview */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontStyle: 'italic', textAlign: 'center' }}>
        Staff Activity Overview
      </Typography>
      
      <Box sx={{ display: 'flex', gap: '16px', mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {activityCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              flex: '1 1 200px',
              minWidth: '160px',
              maxWidth: '240px',
              height: 120,
              backgroundColor: card.bgColor,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '12px',
            }}
          >
            <CardContent sx={{ textAlign: 'center', pt: 3 }}>
              <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>
                {card.title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '32px' }}>
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
        
        {/* Workload Indicators Card */}
        <Card
          sx={{
            flex: '1 1 200px',
            minWidth: '160px',
            maxWidth: '240px',
            height: 120,
            backgroundColor: '#f3f4f6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '12px',
          }}
        >
          <CardContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
              Workload Indicators
            </Typography>
            {workloadData.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '2px',
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>
                  {item.label} {item.value}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Staff Productivity Over Time */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontStyle: 'italic', textAlign: 'center' }}>
        Staff Productivity Over Time
      </Typography>

      <Box sx={{ display: 'flex', gap: '16px', mb: 4, flexWrap: 'wrap' }}>
        {/* Chart */}
        <Card sx={{ flex: '1 1 400px', minWidth: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
          <CardContent>
            <svg width="100%" height="200" viewBox="0 0 400 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path d={createChartPath()} fill="url(#chartGradient)" stroke="#3b82f6" strokeWidth="2" />
              {/* X-axis labels */}
              <text x="0" y="145" fontSize="10" fill="#6b7280">0</text>
              <text x="133" y="145" fontSize="10" fill="#6b7280">10</text>
              <text x="266" y="145" fontSize="10" fill="#6b7280">20</text>
              <text x="390" y="145" fontSize="10" fill="#6b7280" textAnchor="end">31</text>
              {/* Y-axis labels */}
              <text x="5" y="10" fontSize="10" fill="#6b7280">25</text>
              <text x="5" y="80" fontSize="10" fill="#6b7280">15</text>
              <text x="5" y="145" fontSize="10" fill="#6b7280">0</text>
            </svg>
          </CardContent>
        </Card>

        {/* Staff Info Card */}
        <Card sx={{ flex: '0 1 220px', minWidth: '180px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
          <CardContent>
            <Typography variant="body2" sx={{ fontSize: '13px', mb: 1 }}>
              <strong>Staff:</strong>
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '15px', fontWeight: 600, fontStyle: 'italic', mb: 2 }}>
              John Doe
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px', mb: 1 }}>
              <strong>Department:</strong>
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '15px', fontStyle: 'italic', mb: 2 }}>
              Nurse
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '13px', mb: 1 }}>
              <strong>Date:</strong>
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '15px', fontStyle: 'italic' }}>
              Jan 1 - Jan 31
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Task Table */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          Staff: <span style={{ fontStyle: 'italic' }}>John Doe</span>
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Date: January 2026
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead sx={{ backgroundColor: '#f3f4f6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '13px', width: '50%' }}>
                Task Name
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '13px', width: '25%' }}>
                Status
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '13px', width: '25%' }}>
                Hours Spent
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taskData.map((task, index) => (
              <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                <TableCell sx={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.name}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '12px' }}>
                  {task.status}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '12px' }}>
                  {task.hours}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Analytics;
