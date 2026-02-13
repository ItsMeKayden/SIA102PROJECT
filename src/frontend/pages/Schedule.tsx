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
      bgColor: '#f0fdf4',
      textColor: '#166534',
      borderColor: '#bbf7d0'
    },
    { 
      title: 'Shifts Today', 
      value: '4', 
      bgColor: '#eff6ff',
      textColor: '#1e40af',
      borderColor: '#bfdbfe'
    },
    { 
      title: 'Conflict Detected', 
      value: '4', 
      bgColor: '#fef2f2',
      textColor: '#991b1b',
      borderColor: '#fecaca'
    },
    { 
      title: 'Overtime Risk', 
      value: '3', 
      bgColor: '#fff7ed',
      textColor: '#9a3412',
      borderColor: '#fed7aa'
    }
  ];

  const conflicts: ConflictItem[] = [
    { staffName: 'John Doe', role: 'Nurse', conflictType: 'Overlapping Shift (Tuesday 5-6 PM)', action: 'Resolved' },
    { staffName: 'Jane Cruz', role: 'Doctor', conflictType: 'Exceeds Weekly Hours (52 hrs assigned)', action: 'Resolved' },
    { staffName: 'Ana Reyes', role: 'Nurse', conflictType: 'Double Booking (Wed Morning)', action: 'Resolved' },
    { staffName: 'Ana Reyes', role: 'Nurse', conflictType: 'Assigned Outside Availability (Thu 8am-5pm)', action: 'Resolved' },
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = ['08:00 AM', '09:00 AM', '04:00 PM'];

  const scheduleData: Record<string, Record<string, string[]>> = {
    '08:00 AM': {
      'Sun': [],
      'Mon': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Tue': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Wed': ['John Dir\nDoctor\n08:00 AM - 04:00 PM'],
      'Thu': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
      'Fri': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
      'Sat': ['Jane Cruz\nDoctor\n08:00 AM - 04:00 PM'],
    },
    '09:00 AM': {
      'Sun': [],
      'Mon': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Tue': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Wed': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Thu': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Fri': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
      'Sat': ['John Doe\nNurse\n09:00 AM - 06:00 PM'],
    },
    '04:00 PM': {
      'Sun': [],
      'Mon': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Tue': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Wed': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'Jane Cruz\nDoctor\n04:00 PM - 12:00 AM'],
      'Thu': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
      'Fri': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
      'Sat': ['Ana Reyes\nNurse\n04:00 PM - 12:00 AM', 'John Dir\nDoctor\n04:00 PM - 12:00 AM'],
    },
  };

  return (
    <div style={{ padding: '20px', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Top Search Bar */}
      <Box sx={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          placeholder="Search..."
          size="small"
          sx={{ 
            width: '280px',
            backgroundColor: 'white',
            borderRadius: '6px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: '#6b7280', fontSize: '18px' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Attendance Summary Cards */}
      <Box sx={{ marginBottom: '24px' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            color: '#374151',
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          Attendance Summary
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px' 
        }}>
          {summaryCards.map((card, index) => (
            <Card 
              key={index}
              sx={{ 
                backgroundColor: card.bgColor,
                borderRadius: '10px',
                boxShadow: 'none',
                border: `1px solid ${card.borderColor}`
              }}
            >
              <CardContent sx={{ padding: '20px !important' }}>
                <Typography 
                  sx={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    color: card.textColor,
                    marginBottom: '10px',
                    opacity: 0.85
                  }}
                >
                  {card.title}
                </Typography>
                <Typography 
                  sx={{ 
                    fontSize: '32px', 
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
      <Box sx={{ marginBottom: '24px' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            textAlign: 'center',
            color: '#1f2937',
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          Weekly Schedule: <span style={{ fontWeight: 700 }}>February 9 - February 14</span>
        </Typography>
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <TableContainer 
            component={Paper}
            sx={{ 
              borderRadius: '8px',
              boxShadow: 'none',
              border: '1px solid #e5e7eb',
              minWidth: '900px'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      backgroundColor: '#f9fafb',
                      borderRight: '1px solid #e5e7eb',
                      width: '90px',
                      color: '#374151',
                      fontSize: '13px'
                    }}
                  >
                    Time
                  </TableCell>
                  {weekDays.map((day) => (
                    <TableCell 
                      key={day}
                      align="center"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: day === 'Sun' ? '#fee2e2' : '#f9fafb',
                        color: '#374151',
                        minWidth: '110px',
                        fontSize: '13px'
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
                        fontWeight: 500,
                        backgroundColor: '#f9fafb',
                        borderRight: '1px solid #e5e7eb',
                        color: '#4b5563',
                        fontSize: '12px'
                      }}
                    >
                      {time}
                    </TableCell>
                    {weekDays.map((day, idx) => {
                      const fullDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx];
                      const shifts = scheduleData[time][fullDay] || [];
                      return (
                        <TableCell 
                          key={`${time}-${day}`}
                          sx={{ 
                            backgroundColor: day === 'Sun' ? '#fef2f2' : 'white',
                            padding: '6px',
                            verticalAlign: 'top'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {shifts.map((shift, shiftIdx) => {
                              const lines = shift.split('\n');
                              return (
                                <Box 
                                  key={shiftIdx}
                                  sx={{
                                    backgroundColor: '#fef9c3',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    lineHeight: '1.3',
                                    border: '1px solid #fde68a'
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: '#713f12' }}>{lines[0]}</div>
                                  <div style={{ color: '#92400e', fontSize: '9px' }}>{lines[1]}</div>
                                  <div style={{ color: '#92400e', fontSize: '9px' }}>{lines[2]}</div>
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
      </Box>

      {/* Conflict Resolution Table */}
      <Box>
        <Typography 
          variant="h6" 
          sx={{ 
            marginBottom: '14px',
            color: '#374151',
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          Conflict Resolution
        </Typography>
        <TableContainer 
          component={Paper}
          sx={{ 
            borderRadius: '8px',
            boxShadow: 'none',
            border: '1px solid #e5e7eb'
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', width: '20%' }}>Staff Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', width: '15%' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', width: '50%' }}>Conflict Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '13px', width: '15%' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conflicts.map((conflict, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f9fafb' },
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <TableCell sx={{ color: '#1f2937', fontWeight: 500, fontSize: '13px' }}>{conflict.staffName}</TableCell>
                  <TableCell sx={{ color: '#6b7280', fontSize: '13px' }}>{conflict.role}</TableCell>
                  <TableCell sx={{ color: '#6b7280', fontSize: '13px' }}>{conflict.conflictType}</TableCell>
                  <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '13px' }}>{conflict.action}</TableCell>
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
