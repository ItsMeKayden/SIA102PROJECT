import '../styles/Pages.css';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment
} from '@mui/material';
import { FiSearch } from 'react-icons/fi';

interface ConflictItem {
  staffName: string;
  role: string;
  conflictType: string;
  action: string;
}

function Schedule() {
  const summaryCards = [
    { 
      title: 'Total Staff', 
      value: '24', 
      bgColor: '#d1fae5',
      textColor: '#065f46'
    },
    { 
      title: 'Shifts Today', 
      value: '4', 
      bgColor: '#ddd6fe',
      textColor: '#5b21b6'
    },
    { 
      title: 'Conflict Detected', 
      value: '4', 
      bgColor: '#fecaca',
      textColor: '#991b1b'
    },
    { 
      title: 'Overtime Risk', 
      value: '3', 
      bgColor: '#fca5a5',
      textColor: '#991b1b'
    }
  ];

  const conflicts: ConflictItem[] = [
    { staffName: 'John Doe', role: 'Nurse', conflictType: 'Overlapping Shift (Tuesday 5-6 PM)', action: 'Resolved' },
    { staffName: 'Jane Cruz', role: 'Doctor', conflictType: 'Exceeds Weekly Hours (52 hrs assigned)', action: 'Resolved' },
    { staffName: 'Ana Reyes', role: 'Nurse', conflictType: 'Double Booking (Wed Morning)', action: 'Resolved' },
    { staffName: 'Ana Reyes', role: 'Nurse', conflictType: 'Assigned Outside Availability (Thu 8am-5pm)', action: 'Resolved' },
  ];

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['08:00 AM', '09:00 AM', '04:00 PM'];

  const scheduleData: Record<string, Record<string, string[]>> = {
    '08:00 AM': {
      'Sunday': [],
      'Monday': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Tuesday': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Wednesday': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Thursday': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
      'Friday': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
      'Saturday': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
    },
    '09:00 AM': {
      'Sunday': [],
      'Monday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Tuesday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Wednesday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Thursday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Friday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Saturday': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
    },
    '04:00 PM': {
      'Sunday': [],
      'Monday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Tuesday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Wednesday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Thursday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
      'Friday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
      'Saturday': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Top Search Bar */}
      <Box sx={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          placeholder="Staff, Date, Department"
          size="small"
          sx={{ 
            width: '300px',
            backgroundColor: 'white',
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: '#6b7280' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Attendance Summary Cards */}
      <Box sx={{ marginBottom: '32px' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontStyle: 'italic', 
            marginBottom: '16px',
            color: '#1f2937',
            fontSize: '16px',
            fontWeight: 500
          }}
        >
          Attendance Summary
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px' 
        }}>
          {summaryCards.map((card, index) => (
            <Card 
              key={index}
              sx={{ 
                backgroundColor: card.bgColor,
                borderRadius: '16px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                border: 'none'
              }}
            >
              <CardContent sx={{ padding: '24px !important' }}>
                <Typography 
                  sx={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: card.textColor,
                    marginBottom: '12px',
                    opacity: 0.9
                  }}
                >
                  {card.title}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: '36px', 
                    fontWeight: 700,
                    color: card.textColor,
                  }}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Weekly Schedule */}
      <Box sx={{ marginBottom: '32px' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '16px',
            textAlign: 'center',
            color: '#1f2937',
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          Weekly Schedule: <span style={{ fontWeight: 700 }}>February 9 - February 14</span>
        </Typography>
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            overflow: 'auto'
          }}
        >
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    backgroundColor: '#f9fafb',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    color: '#1f2937'
                  }}
                >
                  Time
                </TableCell>
                {weekDays.map((day) => (
                  <TableCell 
                    key={day}
                    align="center"
                    sx={{ 
                      fontWeight: 700,
                      backgroundColor: day === 'Sunday' ? '#fecaca' : '#f3f4f6',
                      color: '#1f2937',
                      minWidth: '140px'
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map((time) => (
                <TableRow key={time}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: '#f9fafb',
                      borderRight: '1px solid #e5e7eb',
                      color: '#374151'
                    }}
                  >
                    {time}
                  </TableCell>
                  {weekDays.map((day) => {
                    const shifts = scheduleData[time][day] || [];
                    return (
                      <TableCell 
                        key={`${time}-${day}`}
                        sx={{ 
                          backgroundColor: day === 'Sunday' ? '#fee2e2' : 'white',
                          padding: '8px',
                          verticalAlign: 'top'
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {shifts.map((shift, idx) => {
                            const lines = shift.split('\n');
                            return (
                              <Box 
                                key={idx}
                                sx={{
                                  backgroundColor: '#fef3c7',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  lineHeight: '1.4',
                                  border: '1px solid #fde68a'
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#78350f' }}>{lines[0]}</div>
                                <div style={{ color: '#92400e' }}>{lines[1]}</div>
                                <div style={{ color: '#92400e', fontSize: '10px' }}>{lines[2]}</div>
                              </Box>
                            );
                          })}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Conflict Resolution Table */}
      <Box>
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1f2937', width: '25%' }}>Staff Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1f2937', width: '20%' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1f2937', width: '40%' }}>Conflict Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1f2937', width: '15%' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conflicts.map((conflict, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f9fafb' },
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <TableCell sx={{ color: '#1f2937', fontWeight: 500 }}>{conflict.staffName}</TableCell>
                  <TableCell sx={{ color: '#4b5563' }}>{conflict.role}</TableCell>
                  <TableCell sx={{ color: '#4b5563' }}>{conflict.conflictType}</TableCell>
                  <TableCell sx={{ color: '#059669', fontWeight: 600 }}>{conflict.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}

export default Schedule;
