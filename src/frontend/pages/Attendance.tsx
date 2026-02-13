import '../styles/Attendance.css';
import '../styles/Pages.css';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

function Attendance() {
  const cardData = [
    { title: 'Present', value: '5/26', bgColor: '#e3f2fd' },
    { title: 'Late', value: '1', bgColor: '#fff3e0' },
    { title: 'Overtime', value: '1 Hour/s', bgColor: '#f3e5f5' },
    { title: 'Compliance', value: 'Compliant', bgColor: '#e8f5e9' },
  ];

  const attendanceData = [
    {
      date: 'Feb 2',
      timeIn: '09:00 AM',
      timeOut: '05:00 PM',
      shift: 'Morning',
      hours: '8 Hours',
      status: 'Present',
    },
    {
      date: 'Feb 3',
      timeIn: '08:30 AM',
      timeOut: '05:00 PM',
      shift: 'Morning',
      hours: '7.5 Hours',
      status: 'Late',
    },
    {
      date: 'Feb 4',
      timeIn: '09:00 AM',
      timeOut: '06:00 PM',
      shift: 'Morning',
      hours: '9 Hours',
      status: 'Overtime',
    },
    {
      date: 'Feb 5',
      timeIn: '09:00 AM',
      timeOut: '05:00 PM',
      shift: 'Morning',
      hours: '8 Hours',
      status: 'Present',
    },
    {
      date: 'Feb 6',
      timeIn: '09:00 AM',
      timeOut: '05:00 PM',
      shift: 'Morning',
      hours: '8 Hours',
      status: 'Present',
    },
  ];

  const complianceAlerts = [
    { date: 'February 3, 2025', type: 'Late' },
    { date: 'February 4, 2025', type: 'Overtime' },
    { date: 'February 7, 2025', type: 'Approved Leave' },
  ];

  return (
    <>
      {/* Staff Activity Overview */}
      <h2 className="activityTitle">Staff Activity Overview</h2>
      <Box className="activityOverview" sx={{ gap: 2 }}>
        {cardData.map((card, index) => (
          <Card
            key={index}
            sx={{
              width: 200,
              height: 100,
              backgroundColor: card.bgColor,
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
            }}
          >
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {card.title}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  marginTop: 1,
                }}
              >
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Attendance Log Table */}
      <h2 className="tableTitle">Attendance Log Table</h2>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'blue' }}>
            <TableRow>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Time
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Time In
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Time Out
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Shift
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Hours Worked
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {attendanceData.map((row, index) => (
              <TableRow key={index}>
                <TableCell align="center">{row.date}</TableCell>
                <TableCell align="center">{row.timeIn}</TableCell>
                <TableCell align="center">{row.timeOut}</TableCell>
                <TableCell align="center">{row.shift}</TableCell>
                <TableCell align="center">{row.hours}</TableCell>
                <TableCell align="center">{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Compliance Alerts Card */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 3,
        }}
      >
        <Card
          sx={{
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ padding: '20px 20px' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 17,
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                Staff:{' '}
                <span style={{ textDecoration: 'underline' }}>John Doe</span>
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                }}
              >
                Compliance Alerts
              </Typography>
            </Box>

            <hr />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {complianceAlerts.map((alert, index) => (
                <Typography
                  key={index}
                  variant="body1"
                  sx={{
                    fontSize: '14px',
                    color: '#333',
                    lineHeight: 1.8,
                  }}
                >
                  {alert.date} - {alert.type}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}

export default Attendance;
