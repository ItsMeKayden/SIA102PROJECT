import '../styles/Pages.css';
import { useState, useEffect } from 'react';
import {
  Modal,
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
  Chip,
  CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  LocalizationProvider,
  DateCalendar,
  TimePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  fetchAppointments,
  insertAppointment,
} from '../../backend/services/appointmentService';
import type { AppointmentRow } from '../../backend/services/appointmentService';
import { fetchDoctors } from '../../backend/services/doctorService';
import type { Doctor } from '../../backend/services/doctorService';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: string;
}

// Date Formatter
const formatDateTime = (raw: string) => {
  if (!raw) return '—';
  const d = dayjs(raw);
  return d.isValid() ? d.format('MMM D, YYYY, hh:mm A') : raw;
};

const initialMorningSlots = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
];
const initialNoonSlots = [
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

const servicesData: Service[] = [
  {
    id: 1,
    name: 'General Consultation',
    description: 'Routine check-up and general health assessment',
    duration: '30 mins',
    price: '₱500',
  },
  {
    id: 2,
    name: 'Follow-up Consultation',
    description: 'Follow-up visit for ongoing treatment or monitoring',
    duration: '20 mins',
    price: '₱300',
  },
  {
    id: 3,
    name: 'Anti Rabies Vaccination',
    description: 'Vaccination for rabies prevention after potential exposure',
    duration: '30 mins',
    price: '₱500',
  },
];

const modalBoxSx = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: '#dff0f7',
  borderRadius: 4,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  outline: 'none',
  p: 2,
  boxSizing: 'border-box' as const,
};

const listBoxSx = {
  maxHeight: 360,
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.5,
  '&::-webkit-scrollbar': { display: 'none' },
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
};

const selectBtnSx = {
  borderRadius: 3,
  backgroundColor: '#f87171',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.9rem',
  px: 4,
  py: 1,
  '&:hover': { backgroundColor: '#ef4444' },
  '&.Mui-disabled': { backgroundColor: '#fca5a5', color: 'white' },
};

//New Appointment Modal
function NewAppointmentModal({
  open,
  onClose,
  onConfirm,
  selectedDate,
  selectedTime,
  selectedDoctor,
  selectedService,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (
    patientName: string,
    contactInfo: string,
    bp: string,
    pulse: string,
    temperature: string,
  ) => Promise<void>;
  selectedDate: Dayjs | null;
  selectedTime: string;
  selectedDoctor: string;
  selectedService: string;
}) {
  const [patientName, setPatientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPatientName('');
    setContactInfo('');
    setBp('');
    setPulse('');
    setTemperature('');
    setError('');
    onClose();
  };
  const handleConfirm = async () => {
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!contactInfo.trim()) {
      setError('Contact information is required.');
      return;
    }
    setLoading(true);
    await onConfirm(
      patientName.trim(),
      contactInfo.trim(),
      bp.trim(),
      pulse.trim(),
      temperature.trim(),
    );
    setLoading(false);
    handleClose();
  };

  const SummaryRow = ({
    label,
    value,
    missing,
  }: {
    label: string;
    value: string;
    missing?: boolean;
  }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.6,
        borderBottom: '1px solid #e8eaf6',
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: '#777' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: missing ? '#f87171' : '#222',
        }}
      >
        {missing ? '— not selected' : value}
      </Typography>
    </Box>
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 480,
          backgroundColor: 'white',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          outline: 'none',
          p: 3,
          boxSizing: 'border-box',
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#1a1a1a',
            mb: 0.4,
          }}
        >
          New Appointment
        </Typography>
        <Typography sx={{ fontSize: '0.74rem', color: '#999', mb: 2.5 }}>
          Review the details below and enter the patient's name and vitals to
          confirm.
        </Typography>

        <Box
          sx={{
            backgroundColor: '#f9f9f9',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            mb: 2.5,
            ml: -1.5,
          }}
        >
          <SummaryRow
            label="Date"
            value={selectedDate ? selectedDate.format('MMMM D, YYYY') : ''}
            missing={!selectedDate}
          />
          <SummaryRow
            label="Time"
            value={selectedTime}
            missing={!selectedTime}
          />
          <SummaryRow
            label="Doctor"
            value={selectedDoctor}
            missing={!selectedDoctor}
          />
          <SummaryRow
            label="Service"
            value={selectedService}
            missing={!selectedService}
          />
        </Box>

        {/* Patient Information */}

        <Typography sx={{ fontSize: '0.82rem', color: '#444', mb: 0.8 }}>
          Patient{' '}
          <Box component="span" sx={{ color: '#e53935', fontWeight: 700 }}>
            Name
          </Box>
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter patient's full name"
          value={patientName}
          onChange={(e) => {
            setPatientName(e.target.value);
            if (error) setError('');
          }}
          error={!!error}
          helperText={error}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#f9f9f9',
              fontSize: '0.88rem',
            },
          }}
        />

        <Typography sx={{ fontSize: '0.82rem', color: '#444', mb: 0.8 }}>
          Contact{' '}
          <Box component="span" sx={{ color: '#e53935', fontWeight: 700 }}>
            Info
          </Box>
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter contact number or email"
          value={contactInfo}
          onChange={(e) => {
            setContactInfo(e.target.value);
            if (error) setError('');
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#f9f9f9',
              fontSize: '0.88rem',
            },
          }}
        />

        <Typography sx={{ fontSize: '0.82rem', color: '#444', mb: 0.8 }}>
          Vital{' '}
          <Box component="span" sx={{ color: '#e53935', fontWeight: 700 }}>
            Signs
          </Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#777', mb: 0.5 }}>
              Blood Pressure
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 120"
              value={bp}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setBp(e.target.value);
              }}
              inputProps={{ inputMode: 'numeric' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                  fontSize: '0.85rem',
                },
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#777', mb: 0.5 }}>
              Pulse (bpm)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 72"
              value={pulse}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setPulse(e.target.value);
              }}
              inputProps={{ inputMode: 'numeric' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                  fontSize: '0.85rem',
                },
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#777', mb: 0.5 }}>
              Temperature (°C)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 36.5"
              value={temperature}
              onChange={(e) => {
                if (/^\d*\.?\d*$/.test(e.target.value))
                  setTemperature(e.target.value);
              }}
              inputProps={{ inputMode: 'decimal' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9f9f9',
                  fontSize: '0.85rem',
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              color: '#888',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={14} sx={{ color: 'white' }} />
              ) : (
                <CheckCircleOutlineIcon sx={{ fontSize: '1rem !important' }} />
              )
            }
            sx={{
              borderRadius: 2,
              backgroundColor: '#3d5afe',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              px: 3,
              '&:hover': { backgroundColor: '#2a41d0' },
            }}
          >
            {loading ? 'Saving...' : 'Confirm'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

//Add Slot Modal
function AddSlotModal({
  open,
  onClose,
  onAdd,
  section,
  range,
  accentColor,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (time: string) => void;
  section: string;
  range: string;
  accentColor: string;
}) {
  const [pickedTime, setPickedTime] = useState<Dayjs | null>(null);
  const handleClose = () => {
    setPickedTime(null);
    onClose();
  };
  const handleAdd = () => {
    if (!pickedTime) return;
    onAdd(pickedTime.format('hh:mm A'));
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 280,
          backgroundColor: 'white',
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          outline: 'none',
          p: 3,
          boxSizing: 'border-box',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.05rem',
            color: accentColor,
            textAlign: 'center',
          }}
        >
          {section}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: '#999',
            textAlign: 'center',
            mb: 2,
          }}
        >
          {range}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#444', mb: 1 }}>
          Select a{' '}
          <Box component="span" sx={{ color: '#e53935', fontWeight: 700 }}>
            Time
          </Box>
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            value={pickedTime}
            onChange={(val) => setPickedTime(val)}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                sx: {
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#e0f0ff',
                    fontWeight: 600,
                    '& fieldset': { border: 'none' },
                  },
                  '& input': {
                    textAlign: 'center',
                    fontSize: '0.95rem',
                    color: '#333',
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disabled={!pickedTime}
            onClick={handleAdd}
            sx={selectBtnSx}
          >
            Select
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// Select Doctor Modal
function DoctorModal({
  open,
  onClose,
  onSelect,
  doctors,
  loadingDoctors,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  doctors: Doctor[];
  loadingDoctors: boolean;
}) {
  const [search, setSearch] = useState('');
  const [tempId, setTempId] = useState<number | null>(null);

  const filtered = doctors.filter(
    (d) =>
      d.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      d.department.toLowerCase().includes(search.toLowerCase()),
  );
  const handleClose = () => {
    setSearch('');
    setTempId(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalBoxSx}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search doctors or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <SearchIcon sx={{ color: '#aaa', fontSize: '1.1rem' }} />
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.85rem',
              backgroundColor: 'white',
              '& fieldset': { border: 'none' },
            },
          }}
        />
        <Box sx={listBoxSx}>
          {loadingDoctors ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                gap: 1.5,
              }}
            >
              <CircularProgress size={24} sx={{ color: '#3d5afe' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#999' }}>
                Loading doctors...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.78rem', color: '#bbb' }}>
                {doctors.length === 0
                  ? 'No doctors found.'
                  : 'No results for your search.'}
              </Typography>
            </Box>
          ) : (
            filtered.map((doctor) => {
              const isSelected = tempId === doctor.doctorID;
              return (
                <Box
                  key={doctor.doctorID}
                  onClick={() => setTempId(doctor.doctorID)}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: isSelected ? '#fef9c3' : 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? '#fef9c3' : '#f9f9f9',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                    }}
                  >
                    <PersonIcon sx={{ color: '#888', fontSize: '1.2rem' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#1a1a1a',
                      textDecoration: 'underline',
                      mb: 0.3,
                    }}
                  >
                    {doctor.doctor_name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                    Department: {doctor.department}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                    Working Hours: {doctor.workingHours}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                    Available Slot: {doctor.availableSlots} Slots
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            disabled={tempId === null}
            sx={selectBtnSx}
            onClick={() => {
              const doc = doctors.find((d) => d.doctorID === tempId);
              if (doc) onSelect(doc.doctor_name);
              handleClose();
            }}
          >
            Select
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// Select Service Modal
function ServiceModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [tempId, setTempId] = useState<number | null>(null);
  const filtered = servicesData.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );
  const handleClose = () => {
    setSearch('');
    setTempId(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalBoxSx}>
        <TextField
          fullWidth
          size="small"
          placeholder="Services"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <SearchIcon sx={{ color: '#aaa', fontSize: '1.1rem' }} />
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.85rem',
              backgroundColor: 'white',
              '& fieldset': { border: 'none' },
            },
          }}
        />
        <Box sx={listBoxSx}>
          {filtered.map((service) => {
            const isSelected = tempId === service.id;
            return (
              <Box
                key={service.id}
                onClick={() => setTempId(service.id)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: isSelected ? '#fef9c3' : 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? '#fef9c3' : '#f9f9f9',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <MedicalServicesIcon
                    sx={{ color: '#888', fontSize: '1.1rem' }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#1a1a1a',
                    textDecoration: 'underline',
                    mb: 0.3,
                  }}
                >
                  {service.name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                  {service.description}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                  Duration: {service.duration}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#555' }}>
                  Price: {service.price}
                </Typography>
              </Box>
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            disabled={tempId === null}
            sx={selectBtnSx}
            onClick={() => {
              const svc = servicesData.find((s) => s.id === tempId);
              if (svc) onSelect(svc.name);
              handleClose();
            }}
          >
            Select
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

//Main Component
function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');

  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [newApptModalOpen, setNewApptModalOpen] = useState(false);

  const [morningSlots, setMorningSlots] =
    useState<string[]>(initialMorningSlots);
  const [noonSlots, setNoonSlots] = useState<string[]>(initialNoonSlots);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [addSlotSection, setAddSlotSection] = useState<'morning' | 'noon'>(
    'morning',
  );

  // Fetch appointments once the component is opened
  useEffect(() => {
    const load = async () => {
      setTableLoading(true);
      setTableError('');
      try {
        const data = await fetchAppointments();
        setAppointments(data);
      } catch (err) {
        console.error('Fetch appointments error:', err);
        setTableError('Failed to load appointments. Please try again.');
      } finally {
        setTableLoading(false);
      }
    };
    load();
  }, []);

  // Fetch doctors when doctor modal is opened for the first time
  const handleOpenDoctorModal = async () => {
    setDoctorModalOpen(true);
    if (doctors.length > 0) return;
    setLoadingDoctors(true);
    try {
      const data = await fetchDoctors();
      setDoctors(data);
    } catch (err) {
      console.error('Fetch doctors error:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Insert new appointment
  const handleConfirmAppointment = async (
    patientName: string,
    contactInfo: string,
    bp: string,
    pulse: string,
    temperature: string,
  ) => {
    const timeParsed = dayjs(selectedTime, 'hh:mm A');
    const isoDateTime = selectedDate
      ? selectedDate
          .hour(timeParsed.hour())
          .minute(timeParsed.minute())
          .second(0)
          .toISOString()
      : new Date().toISOString();

    try {
      const inserted = await insertAppointment({
        patient_name: patientName,
        contact_info: contactInfo,
        service_type: selectedService,
        doctor_name: selectedDoctor,
        date_time: isoDateTime,
        Status: 'Scheduled',
        BloodPressure: parseInt(bp, 10) || 0,
        Pulse: parseInt(pulse, 10) || 0,
        Temperature: parseFloat(temperature) || 0,
      });
      setAppointments((prev) => [...prev, inserted]);
    } catch (err) {
      console.error('Insert appointment error:', err);
      alert('Failed to save appointment. Please try again.');
      return;
    }

    setBookedSlots((prev) => [...prev, selectedTime]);
    setSelectedTime('');
    setSelectedDoctor('');
    setSelectedService('');
  };

  const openAddSlot = (section: 'morning' | 'noon') => {
    setAddSlotSection(section);
    setAddSlotOpen(true);
  };
  const handleAddSlot = (time: string) => {
    if (addSlotSection === 'morning')
      setMorningSlots((prev) => [...prev, time].sort());
    else setNoonSlots((prev) => [...prev, time].sort());
  };

  const handleNewAppointmentClick = () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !selectedService) {
      alert('Please select date, time, doctor, and service before confirming.');
      return;
    }
    setNewApptModalOpen(true);
  };

  const selectedDoctorData = doctors.find(
    (d) => d.doctor_name === selectedDoctor,
  );
  const selectedServiceData = servicesData.find(
    (s) => s.name === selectedService,
  );

  // Make sure that there's no overlap between booked slots and available slots
  const renderSlot = (slot: string, accentColor: string, width: number) => {
    const isSelected = selectedTime === slot;
    const isBooked = bookedSlots.includes(slot);
    return (
      <Box
        key={slot}
        onClick={() => !isBooked && setSelectedTime(slot)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.7,
          px: 1.2,
          py: 0.5,
          borderRadius: 1.5,
          border: isBooked
            ? '1.5px solid #e0e0e0'
            : isSelected
              ? `1.5px solid ${accentColor}`
              : '1.5px solid #e0e0e0',
          backgroundColor: isBooked
            ? '#f5f5f5'
            : isSelected
              ? `${accentColor}12`
              : 'transparent',
          cursor: isBooked ? 'not-allowed' : 'pointer',
          opacity: isBooked ? 0.5 : 1,
          transition: 'all 0.15s ease',
          flex: 'none',
          height: 32,
          width,
          '&:hover': !isBooked
            ? { borderColor: accentColor, backgroundColor: `${accentColor}0d` }
            : {},
        }}
      >
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            border:
              isSelected && !isBooked
                ? `3px solid ${accentColor}`
                : '1.5px solid #bbb',
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: '0.71rem',
            color: isBooked ? '#bbb' : '#444',
            fontWeight: isSelected && !isBooked ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {slot}
        </Typography>
      </Box>
    );
  };

  const isFormReady = !!(
    selectedDate &&
    selectedTime &&
    selectedDoctor &&
    selectedService
  );

  return (
    <>
      {/*Appointment Table*/}
      <TableContainer component={Paper} sx={{ mt: -1, borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#EEEEEE' }}>
            <TableRow>
              {[
                'ID',
                'Patient Name',
                'Contact Info',
                'Service Type',
                'Doctor Name',
                'Date & Time',
                'Status',
              ].map((h) => (
                <TableCell
                  key={h}
                  align="center"
                  sx={{ color: 'gray', fontWeight: 'bold' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: '#3d5afe' }} />
                  <Typography
                    sx={{ mt: 1, fontSize: '0.82rem', color: '#999' }}
                  >
                    Loading appointments...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : tableError ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: '#f87171' }}>
                    {tableError}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: '#bbb' }}>
                    No appointments found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((row) => (
                <TableRow key={row.id} style={{ backgroundColor: 'white' }}>
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell align="center">{row.patient_name}</TableCell>
                  <TableCell align="center">{row.contact_info}</TableCell>
                  <TableCell align="center">{row.service_type}</TableCell>
                  <TableCell align="center">{row.doctor_name}</TableCell>
                  <TableCell align="center">
                    {formatDateTime(row.date_time)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={row.Status}
                      size="small"
                      sx={{
                        backgroundColor:
                          row.Status === 'Completed' ? '#e8f5e9' : '#e3f2fd',
                        color:
                          row.Status === 'Completed' ? '#2e7d32' : '#1565c0',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/*Main Content*/}
      <Box
        sx={{
          mt: 3,
          pt: 2.5,
          pb: 2.5,
          pl: 2.5,
          pr: 3,
          borderRadius: 4,
          backgroundColor: '#eef0fb',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 2.5,
          alignItems: 'start',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/*Left Side*/}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CalendarMonthIcon sx={{ color: '#e53935', fontSize: '1.2rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Pick a{' '}
              <Box component="span" sx={{ color: '#e53935' }}>
                Date
              </Box>
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 3,
              p: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                sx={{
                  width: '100% !important',
                  maxHeight: 'none',
                  '& .MuiPickersDay-root.Mui-selected': {
                    backgroundColor: '#3d5afe',
                    color: 'white',
                  },
                  '& .MuiPickersDay-root:hover': { backgroundColor: '#e8eaf6' },
                  '& .MuiPickersCalendarHeader-label': { fontWeight: 700 },
                  '& .MuiDayCalendar-header, & .MuiDayCalendar-weekContainer': {
                    justifyContent: 'space-around',
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          <Box
            sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={handleOpenDoctorModal}
              sx={{
                borderRadius: 2,
                borderColor: '#c5cae9',
                color: selectedDoctor ? '#3d5afe' : '#555',
                textTransform: 'none',
                justifyContent: 'flex-start',
                px: 2,
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#f5f5ff' },
              }}
            >
              👤 &nbsp; {selectedDoctor ? 'Change Doctor' : 'Select a Doctor'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setServiceModalOpen(true)}
              sx={{
                borderRadius: 2,
                borderColor: '#c5cae9',
                color: selectedService ? '#3d5afe' : '#555',
                textTransform: 'none',
                justifyContent: 'flex-start',
                px: 2,
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#f5f5ff' },
              }}
            >
              ✚ &nbsp;{' '}
              {selectedService ? 'Change Service' : 'Select a Type of Service'}
            </Button>
          </Box>

          {selectedDoctorData && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                backgroundColor: 'white',
                borderRadius: 2,
                border: '1px solid #e8eaf6',
                width: '275px',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.8,
                }}
              >
                <PersonIcon sx={{ color: '#888', fontSize: '1.1rem' }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: '#1a1a1a',
                  textDecoration: 'underline',
                  mb: 0.3,
                }}
              >
                {selectedDoctorData.doctor_name}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                Department: {selectedDoctorData.department}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                Working Hours: {selectedDoctorData.workingHours}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                Available Slot: {selectedDoctorData.availableSlots} Slots
              </Typography>
            </Box>
          )}

          {selectedServiceData && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                backgroundColor: 'white',
                borderRadius: 2,
                border: '1px solid #e8eaf6',
                width: '275px',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.8,
                }}
              >
                <MedicalServicesIcon
                  sx={{ color: '#888', fontSize: '1.1rem' }}
                />
              </Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: '#1a1a1a',
                  textDecoration: 'underline',
                  mb: 0.3,
                }}
              >
                {selectedServiceData.name}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                {selectedServiceData.description}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                Duration: {selectedServiceData.duration}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>
                Price: {selectedServiceData.price}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            onClick={handleNewAppointmentClick}
            sx={{
              mt: 2,
              borderRadius: 3,
              backgroundColor: isFormReady ? '#3d5afe' : '#9fa8da',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              py: 1.2,
              boxShadow: isFormReady
                ? '0 4px 14px rgba(61,90,254,0.35)'
                : 'none',
              '&:hover': {
                backgroundColor: isFormReady ? '#2a41d0' : '#7986cb',
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            + New Appointment
          </Button>
          {!isFormReady && (
            <Typography
              sx={{
                fontSize: '0.68rem',
                color: '#9fa8da',
                textAlign: 'center',
                mt: 0.7,
              }}
            >
              Please select a date, time, doctor, and service first.
            </Typography>
          )}
        </Box>

        {/*Right Side*/}
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <AccessTimeIcon sx={{ color: '#e53935', fontSize: '1.2rem' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Pick a{' '}
              <Box component="span" sx={{ color: '#e53935' }}>
                Time
              </Box>
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 3,
              mb: 1.5,
              overflow: 'hidden',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/*Morning Slots*/}
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WbSunnyOutlinedIcon
                    sx={{ color: '#F59E0B', fontSize: '1.1rem' }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#f59e0b',
                        fontSize: '0.88rem',
                        lineHeight: 1.2,
                      }}
                    >
                      Morning
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999' }}>
                      08:00 AM to 12:00 PM
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: '0.8rem !important' }} />}
                  onClick={() => openAddSlot('morning')}
                  sx={{
                    borderRadius: 2,
                    borderColor: '#c5cae9',
                    color: '#5c6bc0',
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.4,
                    mr: 3.5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    '&:hover': { backgroundColor: '#e8eaf6' },
                  }}
                >
                  Add Slots
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {morningSlots.map((slot) => renderSlot(slot, '#f59e0b', 100))}
              </Box>
            </Box>

            <Box sx={{ borderTop: '1px solid #f0f0f0' }} />

            {/*Noon Slots*/}
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    component="span"
                    sx={{ fontSize: '1rem', lineHeight: 1 }}
                  >
                    🌤
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#FFEA00',
                        fontSize: '0.88rem',
                        lineHeight: 1.2,
                      }}
                    >
                      Noon
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#999' }}>
                      01:00 PM to 05:00 PM
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: '0.8rem !important' }} />}
                  onClick={() => openAddSlot('noon')}
                  sx={{
                    borderRadius: 2,
                    borderColor: '#c5cae9',
                    color: '#5c6bc0',
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    px: 1.5,
                    py: 0.4,
                    mr: 3.5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    '&:hover': { backgroundColor: '#e8eaf6' },
                  }}
                >
                  Add Slots
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {noonSlots.map((slot) => renderSlot(slot, '#8b5cf6', 95))}
              </Box>
            </Box>
          </Box>

          {/*Waiting List*/}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fefce8',
              border: '1.5px solid #fde68a',
              borderRadius: 3,
              px: 2.5,
              py: 1.5,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WatchLaterOutlinedIcon
                sx={{ color: '#d97706', fontSize: '1.1rem' }}
              />
              <Typography
                sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}
              >
                Waiting List
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: '0.85rem !important' }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#d97706',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                backgroundColor: '#fef3c7',
                flexShrink: 0,
                '&:hover': { backgroundColor: '#eac73e' },
              }}
            >
              Add to Waiting List
            </Button>
          </Box>
        </Box>
      </Box>

      {/*All Modals*/}
      <DoctorModal
        open={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSelect={(name) => setSelectedDoctor(name)}
        doctors={doctors}
        loadingDoctors={loadingDoctors}
      />
      <ServiceModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSelect={(name) => setSelectedService(name)}
      />
      <AddSlotModal
        open={addSlotOpen}
        onClose={() => setAddSlotOpen(false)}
        onAdd={handleAddSlot}
        section={addSlotSection === 'morning' ? 'Morning' : 'Noon'}
        range={
          addSlotSection === 'morning'
            ? '08:00 AM to 12:00 PM'
            : '01:00 PM to 05:00 PM'
        }
        accentColor={addSlotSection === 'morning' ? '#f59e0b' : '#8b5cf6'}
      />
      <NewAppointmentModal
        open={newApptModalOpen}
        onClose={() => setNewApptModalOpen(false)}
        onConfirm={handleConfirmAppointment}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedDoctor={selectedDoctor}
        selectedService={selectedService}
      />
    </>
  );
}

export default Appointments;
