import '../styles/Pages.css';
import { useState } from 'react';
import {
  Card,
  CardContent,
  Modal,
  IconButton,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import SamplePatientPfp from '../../assets/SamplePatientPfp.jpg';

const attendanceData = [
  {
    ID: 21,
    PatientName: 'Hirai Momo',
    ServiceType: 'Dental Checkup',
    DoctorName: 'Dr. Smith',
    DateTime: 'Feb 10, 2026 - 10:00 AM',
    Status: 'Confirmed',
  },
  {
    ID: 22,
    PatientName: 'Minatozaki Sana',
    ServiceType: 'Dental Checkup',
    DoctorName: 'Dr. Smith',
    DateTime: 'Feb 10, 2026 - 11:00 AM',
    Status: 'Confirmed',
  },
];

function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    dayjs('2026-02-10'),
  );
  const [selectedTime, setSelectedTime] = useState('08:00 AM - 09:00 AM');
  const [duration, setDuration] = useState('1 Hour');
  const [serviceType, setServiceType] = useState('Follow-up Consultation');
  const [openModal, setOpenModal] = useState(false);
  const disabledTimeSlots = [
    '09:00 AM - 10:00 AM',
    '01:00 PM - 02:00 PM',
    '03:00 PM - 04:00 PM',
  ];

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  function generateTimeSlots(interval: number) {
    const slots = [];
    let startHour = 8;
    let endHour = 17;
    for (let hour = startHour; hour < endHour; hour += interval) {
      let start = dayjs().hour(hour).minute(0);
      let end = dayjs()
        .hour(hour + interval)
        .minute(0);
      if (hour + interval > endHour) break;
      slots.push(`${start.format('hh:mm A')} - ${end.format('hh:mm A')}`);
    }
    return slots;
  }

  let timeSlots: string[] = [];
  if (duration === '1 Hour') {
    timeSlots = generateTimeSlots(1);
  } else if (duration === '2 Hours') {
    timeSlots = generateTimeSlots(2);
  } else if (duration === '3 Hours') {
    timeSlots = generateTimeSlots(3);
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: -1 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#EEEEEE' }}>
            <TableRow>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                ID
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                Patient Name
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                Service Type
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                Doctor Name
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                Date & Time
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: 'gray', fontWeight: 'bold' }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {attendanceData.map((row, index) => (
              <TableRow key={index} style={{ backgroundColor: '#EEEEEE' }}>
                <TableCell align="center">{row.ID}</TableCell>
                <TableCell align="center">{row.PatientName}</TableCell>
                <TableCell align="center">{row.ServiceType}</TableCell>
                <TableCell align="center">{row.DoctorName}</TableCell>
                <TableCell align="center">{row.DateTime}</TableCell>
                <TableCell align="center">{row.Status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Appointment Booking */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          {/*Left Card*/}
          <Box
            sx={{
              backgroundColor: '#1976d2',
              borderRadius: 2,
              p: 5,
              width: { md: '220px' },
              minWidth: { md: '220px' },
              maxWidth: { md: '340px' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center',
            }}
          >
            {/* Patient Card */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 2,
                  mx: 'auto',
                  mb: 1.5,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={SamplePatientPfp}
                  alt="Patient"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1rem' }}
              >
                Hirai Momo
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                Age: 29
              </Typography>
            </Box>

            {/* Patient Details */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Blood Type:</strong> A
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Height:</strong> 163 cm (5'4)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Weight:</strong> 106 lbs
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Doctor:</strong> Dr. John Dir
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Day:</strong> Feb 10, 2026
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Time:</strong> 08:00 AM - 09:00 AM
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.875rem' }}>
                <strong>Type of Service:</strong> Follow-up Consultation
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleOpenModal}
              sx={{
                backgroundColor: 'white',
                color: '#1976d2',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              NEW APPOINTMENT
            </Button>
          </Box>

          {/* Calendar and Time Picker */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              flex: 1,
            }}
          >
            {/* Calendar */}
            <Box
              sx={{
                backgroundColor: 'transparent',
                p: 0,
                flex: 1,
                maxWidth: { md: '400px' },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box
                  sx={{
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    p: 2,
                    maxWidth: '350px',
                    margin: '0 auto',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      mb: 1,
                      textAlign: 'center',
                    }}
                  >
                    Pick a Date
                  </Typography>
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newValue: Dayjs | null) =>
                      setSelectedDate(newValue)
                    }
                    views={['year', 'month', 'day']}
                    openTo="day"
                    sx={{
                      width: '100%',
                      maxWidth: '300px',
                      margin: '0 auto',
                      padding: 0,
                      height: 'auto',
                      '& .MuiPickersCalendarHeader-root': {
                        paddingLeft: 0,
                        paddingRight: 0,
                        marginTop: 0,
                        marginBottom: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                      },
                      '& .MuiPickersCalendarHeader-labelContainer': {
                        margin: 0,
                        overflow: 'visible',
                        cursor: 'pointer',
                      },
                      '& .MuiPickersCalendarHeader-label': {
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        outline: 'none',
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiIconButton-root': {
                        outline: 'none',
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiDayCalendar-header': {
                        justifyContent: 'space-between',
                      },
                      '& .MuiPickersDay-root': {
                        fontSize: '0.875rem',
                        width: '50px',
                        height: '36px',
                        transition: 'all 0.2s',
                        outline: 'none',
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: '#1976d2',
                        outline: 'none',
                        '&:hover': {
                          backgroundColor: '#1565c0',
                        },
                      },
                      '& .MuiPickersSlideTransition-root': {
                        minHeight: '220px !important',
                        maxHeight: 'none !important',
                        overflow: 'visible !important',
                      },
                      '& .MuiDayCalendar-monthContainer': {
                        position: 'relative',
                        margin: 0,
                      },
                      '& .MuiDateCalendar-root': {
                        height: 'auto',
                        maxHeight: 'none',
                        overflow: 'visible',
                      },
                      '& .MuiMonthCalendar-root': {
                        width: '100%',
                        margin: '0 auto',
                      },
                      '& .MuiPickersMonth-root': {
                        fontSize: '0.875rem',
                        outline: 'none',
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiPickersMonth-monthButton': {
                        fontSize: '0.875rem',
                        outline: 'none',
                        '&:focus': {
                          outline: 'none',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#1976d2',
                          color: 'white',
                        },
                      },
                      '& .MuiYearCalendar-root': {
                        width: '100%',
                      },
                      '& .MuiPickersYear-root': {
                        '& .MuiPickersYear-yearButton': {
                          fontSize: '0.875rem',
                          outline: 'none',
                          '&:focus': {
                            outline: 'none',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#1976d2',
                            color: 'white',
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </LocalizationProvider>

              {/* Doctor Info Box */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  maxWidth: { md: '350px' },
                  margin: '16px auto 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: 'white',
                      border: '2px solid #ddd',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '1.2rem' }}>👤</Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.85rem', mr: 1, fontWeight: 'bold' }}
                    >
                      Doctor:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        textDecoration: 'underline',
                      }}
                    >
                      Dr. John Dir
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'default',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.9rem' }}>🔍</Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.75rem', mb: 0.5 }}
                >
                  <strong>Department:</strong> General Medicine
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.75rem', mb: 0.5 }}
                >
                  <strong>Working Hours:</strong> 08:00 AM - 5:00 PM
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  <strong>Available Slot:</strong> 3 Slots
                </Typography>
              </Box>

              {/* Type of Service Box */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  maxWidth: { md: '350px' },
                  margin: '16px auto 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8rem',
                      mr: 1,
                      minWidth: '110px',
                      fontWeight: 'bold',
                    }}
                  >
                    Type Of Service:
                  </Typography>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value="Follow-up Consultation"
                      sx={{
                        fontSize: '0.8rem',
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ddd',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            width: 'auto',
                            minWidth: '120px',
                          },
                        },
                      }}
                    >
                      <MenuItem
                        value="Follow-up Consultation"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        Follow-Up Consultation
                      </MenuItem>
                      <MenuItem
                        value="General Checkup"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        General Checkup
                      </MenuItem>
                      <MenuItem value="Emergency" sx={{ fontSize: '0.8rem' }}>
                        Emergency
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 1,
                      cursor: 'default',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.9rem' }}>⚙️</Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.75rem', mb: 0.5 }}
                >
                  <strong>Max Appointments/Day:</strong> 32
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.75rem', mb: 0.5 }}
                >
                  <strong>Scheduled:</strong> 23
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  <strong>Remaining:</strong> 7
                </Typography>
              </Box>
            </Box>

            {/* Time Picker */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: 1,
                p: 2,
                width: { md: '230px' },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '1rem',
                }}
              >
                Pick a Time
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  label="Duration"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        width: 'auto',
                        minWidth: '120px',
                      },
                    },
                  }}
                >
                  <MenuItem value="1 Hour">1 Hour</MenuItem>
                  <MenuItem value="2 Hours">2 Hours</MenuItem>
                  <MenuItem value="3 Hours">3 Hours</MenuItem>
                </Select>
              </FormControl>

              <RadioGroup
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                {timeSlots.map((slot) => {
                  const isDisabled = disabledTimeSlots.includes(slot);
                  return (
                    <FormControlLabel
                      key={slot}
                      value={slot}
                      control={<Radio />}
                      label={slot}
                      disabled={isDisabled}
                      sx={{
                        border:
                          selectedTime === slot
                            ? '2px solid #1976d2'
                            : '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        mx: 0,
                        px: 1,
                        opacity: isDisabled ? 0.5 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  );
                })}
              </RadioGroup>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* New Appointment Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="new-appointment-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              New Appointment
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            component="form"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              fullWidth
              label="Patient Name"
              variant="outlined"
              size="small"
            />

            <TextField
              fullWidth
              label="Doctor Name"
              variant="outlined"
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Service Type</InputLabel>
              <Select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                label="Service Type"
              >
                <MenuItem value="Follow-up Consultation">
                  Follow-up Consultation
                </MenuItem>
                <MenuItem value="General Checkup">General Checkup</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date"
              type="date"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              label="Time"
              type="time"
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleCloseModal}
                sx={{
                  color: '#666',
                  borderColor: '#ddd',
                  '&:hover': {
                    borderColor: '#999',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                Create Appointment
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default Appointments;
