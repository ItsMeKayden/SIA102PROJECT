import "../styles/Pages.css";
import { useState, useEffect } from "react";
import {
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Menu,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Drawer,
} from "@mui/material";
import {
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiPlay,
  FiSearch,
  FiArrowRight,
  FiArrowLeft,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiEdit2,
  FiBriefcase,
  FiTag,
  FiHeart,
  FiFileText,
  FiCheck,
  FiMoreVertical,
  FiEye,
  FiSlash,
  FiCheckSquare,
  FiClipboard,
  FiPlusCircle,
} from "react-icons/fi";
import type { Appointment, Staff } from "../../types";
import { supabase } from "../../lib/supabase-client";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllAppointments,
  createAppointment,
  completeAppointment,
  cancelAppointment,
  deleteAppointment,
  approveAppointment,
  rejectAppointment,
  acceptAssignedAppointment,
  rejectAssignedAppointment,
  startAppointment,
  noShowAppointment,
  rescheduleAppointment,
  getAppointmentStats,
  updateAppointmentPrescription,
} from "../../backend/services/appointmentService";
import {
  getAllStaff,
  updateDutyStatus,
} from "../../backend/services/staffService";
import { createNotification } from "../../backend/services/notificationService";
import {
  getAllServices,
  type Service,
} from "../../backend/services/serviceServices";

// ── Shared field styles ───────────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "13px",
    backgroundColor: "#fff",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
};
const selectSx = {
  borderRadius: "10px",
  fontSize: "13px",
  backgroundColor: "#fff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
};
const labelSx = {
  fontSize: "10px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  mb: "4px",
};

function FieldLabel({
  icon,
  text,
  required,
}: {
  icon: React.ReactNode;
  text: string;
  required?: boolean;
}) {
  return (
    <Box sx={labelSx}>
      <span style={{ color: "#9ca3af", display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      {text}
      {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </Box>
  );
}

// ── Date Picker (Month / Day / Year dropdowns) ────────────────────────────────
function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parts = value ? value.split("-") : ["", "", ""];
  const [yyyy, setYyyy] = useState(parts[0] ?? "");
  const [mm, setMm] = useState(parts[1] ?? "");
  const [dd, setDd] = useState(parts[2] ?? "");

  const commit = (newYYYY: string, newMM: string, newDD: string) => {
    if (newYYYY && newMM && newDD) {
      onChange(
        `${newYYYY}-${newMM.padStart(2, "0")}-${newDD.padStart(2, "0")}`,
      );
    }
  };

  const handleMonth = (v: string) => {
    setMm(v);
    commit(yyyy, v, dd);
  };
  const handleDay = (v: string) => {
    setDd(v);
    commit(yyyy, mm, v);
  };
  const handleYear = (v: string) => {
    setYyyy(v);
    commit(v, mm, dd);
  };

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const daysInMonth =
    mm && yyyy ? new Date(parseInt(yyyy), parseInt(mm), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => String(currentYear - i));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 72px 96px" },
        gap: 0.75,
      }}
    >
      <FormControl size="small">
        <Select
          value={mm}
          onChange={(e) => handleMonth(e.target.value)}
          displayEmpty
          renderValue={(v) =>
            v ? (
              (months.find((m) => m.value === v)?.label ?? v)
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>Month</span>
            )
          }
          sx={selectSx}
        >
          {months.map((m) => (
            <MenuItem key={m.value} value={m.value} sx={{ fontSize: "13px" }}>
              {m.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small">
        <Select
          value={dd}
          onChange={(e) => handleDay(e.target.value)}
          displayEmpty
          renderValue={(v) =>
            v ? (
              v
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>Day</span>
            )
          }
          sx={selectSx}
        >
          {days.map((d) => (
            <MenuItem key={d} value={d} sx={{ fontSize: "13px" }}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small">
        <Select
          value={yyyy}
          onChange={(e) => handleYear(e.target.value)}
          displayEmpty
          renderValue={(v) =>
            v ? (
              v
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>Year</span>
            )
          }
          sx={selectSx}
          MenuProps={{ PaperProps: { style: { maxHeight: 220 } } }}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y} sx={{ fontSize: "13px" }}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (d: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const toISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayISO = toISO(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        p: 1.25,
        backgroundColor: "#fff",
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <IconButton
          size="small"
          onClick={prevMonth}
          sx={{ color: "#6b7280", fontSize: "16px", width: 24, height: 24 }}
        >
          ‹
        </IconButton>
        <Typography
          sx={{ fontWeight: 600, fontSize: "12px", color: "#1a202c" }}
        >
          {monthNames[viewMonth]}{" "}
          <span style={{ color: "#3b82f6" }}>{viewYear}</span>
        </Typography>
        <IconButton
          size="small"
          onClick={nextMonth}
          sx={{ color: "#6b7280", fontSize: "16px", width: 24, height: 24 }}
        >
          ›
        </IconButton>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mb: 0.25,
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <Typography
            key={d}
            sx={{
              textAlign: "center",
              fontSize: "10px",
              color: "#9ca3af",
              pb: 0.25,
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "1px",
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <Box key={i} />;
          const iso = toISO(viewYear, viewMonth, day);
          const isToday = iso === todayISO;
          const isSelected = iso === value;
          const isPast = iso < todayISO;
          return (
            <Box
              key={i}
              onClick={() => !isPast && onChange(iso)}
              sx={{
                textAlign: "center",
                py: "3px",
                borderRadius: "5px",
                fontSize: "11px",
                cursor: isPast ? "default" : "pointer",
                color: isPast
                  ? "#d1d5db"
                  : isSelected
                    ? "#fff"
                    : isToday
                      ? "#3b82f6"
                      : "#374151",
                backgroundColor: isSelected
                  ? "#3b82f6"
                  : isToday && !isSelected
                    ? "#eff6ff"
                    : "transparent",
                fontWeight: isToday || isSelected ? 600 : 400,
                "&:hover": !isPast
                  ? { backgroundColor: isSelected ? "#2563eb" : "#f3f4f6" }
                  : {},
              }}
            >
              {day}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Tag selector ──────────────────────────────────────────────────────────────
function TagSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
      {options.map((opt) => (
        <Box
          key={opt}
          onClick={() => onChange(value === opt ? "" : opt)}
          sx={{
            px: 1.25,
            py: 0.35,
            borderRadius: "20px",
            fontSize: "11px",
            cursor: "pointer",
            border: "1px solid",
            transition: "all .15s",
            borderColor: value === opt ? "#3b82f6" : "#e5e7eb",
            backgroundColor: value === opt ? "#3b82f6" : "#fff",
            color: value === opt ? "#fff" : "#6b7280",
            "&:hover": { borderColor: "#3b82f6" },
          }}
        >
          {opt}
        </Box>
      ))}
    </Box>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Patient info", icon: <FiUser size={11} /> },
  { id: 2, label: "Appointment", icon: <FiCalendar size={11} /> },
  { id: 3, label: "Clinical notes", icon: <FiHeart size={11} /> },
  { id: 4, label: "Review", icon: <FiCheck size={11} /> },
];

function StepperHeader({ currentStep }: { currentStep: number }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box
        sx={{ display: "flex", alignItems: "flex-start", position: "relative" }}
      >
        {STEPS.map((step, i) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <Box
              key={step.id}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {i < STEPS.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "14px",
                    left: "50%",
                    width: "100%",
                    height: "2px",
                    backgroundColor: done ? "#10b981" : "#e5e7eb",
                    zIndex: 0,
                  }}
                />
              )}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 500,
                  zIndex: 1,
                  transition: "all .25s",
                  border: "2px solid",
                  borderColor: done
                    ? "#10b981"
                    : active
                      ? "#3b82f6"
                      : "#e5e7eb",
                  backgroundColor: done
                    ? "#10b981"
                    : active
                      ? "#3b82f6"
                      : "#fff",
                  color: done || active ? "#fff" : "#9ca3af",
                }}
              >
                {done ? <FiCheck size={11} /> : step.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: "10px",
                  mt: 0.5,
                  textAlign: "center",
                  maxWidth: "60px",
                  fontWeight: active ? 600 : 400,
                  color: done ? "#10b981" : active ? "#3b82f6" : "#9ca3af",
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Review field ──────────────────────────────────────────────────────────────
function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        p: 0.75,
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
      }}
    >
      <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
        {label}
      </Typography>
      {value ? (
        <Typography
          sx={{ fontSize: "12px", fontWeight: 500, color: "#1a202c" }}
        >
          {value}
        </Typography>
      ) : (
        <Typography
          sx={{ fontSize: "11px", color: "#d1d5db", fontStyle: "italic" }}
        >
          —
        </Typography>
      )}
    </Box>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDOB(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${monthNames[parseInt(m, 10) - 1] ?? m} ${parseInt(d, 10)}, ${y}`;
}

function buildOPDNotes(f: {
  notes: string;
  chief_complaint: string;
  allergies: string;
  bp: string;
  pulse: string;
  temp: string;
  patient_dob: string;
  patient_age: string;
  patient_sex: string;
  patient_civil_status: string;
  patient_height: string;
  patient_weight: string;
  patient_address: string;
}): string | null {
  const lines: string[] = [];
  if (f.chief_complaint) lines.push(`Chief Complaint: ${f.chief_complaint}`);
  if (f.allergies) lines.push(`Allergies: ${f.allergies}`);
  if (f.bp) lines.push(`BP: ${f.bp}`);
  if (f.pulse) lines.push(`Pulse: ${f.pulse}`);
  if (f.temp) lines.push(`Temp: ${f.temp}`);
  if (f.patient_dob) lines.push(`DOB: ${formatDOB(f.patient_dob)}`);
  if (f.patient_age) lines.push(`Age: ${f.patient_age}`);
  if (f.patient_sex) lines.push(`Sex: ${f.patient_sex}`);
  if (f.patient_civil_status)
    lines.push(`Civil Status: ${f.patient_civil_status}`);
  if (f.patient_height) lines.push(`Height: ${f.patient_height}`);
  if (f.patient_weight) lines.push(`Weight: ${f.patient_weight}`);
  if (f.patient_address) lines.push(`Address: ${f.patient_address}`);
  return lines.length ? lines.join("\n") : null;
}

// Helper function to get full patient name from appointment record
function getAppointmentPatientName(appt: Appointment): string {
  const parts = [appt.first_name, appt.middle_name, appt.last_name]
    .filter(Boolean)
    .join(" ");
  return parts || "Patient";
}

// ── Main Component ─────────────────────────────────────────────────────────────
function Appointments() {
  const { isAdmin, staffProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    id: "",
    date: "",
    time: "",
  });
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    appt: Appointment | null;
  }>({ open: false, appt: null });
  const [viewLoading, setViewLoading] = useState(false);
  const [actionsMenu, setActionsMenu] = useState<{
    anchor: HTMLElement | null;
    appt: Appointment | null;
  }>({ anchor: null, appt: null });
  const [prescriptionModal, setPrescriptionModal] = useState<{
    open: boolean;
    appt: Appointment | null;
    text: string;
  }>({ open: false, appt: null, text: "" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const [formData, setFormData] = useState({
    patient_last_name: "",
    patient_first_name: "",
    patient_middle_name: "",
    patient_contact_number: "",
    patient_address: "",
    patient_dob: "",
    patient_age: "",
    patient_sex: "",
    patient_civil_status: "",
    patient_height: "",
    patient_weight: "",
    department: "",
    specialization: "",
    service_id: "",
    appointment_date: "",
    appointment_time: "",
    allergies: "",
    bp: "",
    pulse: "",
    temp: "",
    chief_complaint: "",
    notes: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const patient_name = [
    formData.patient_first_name,
    formData.patient_middle_name,
    formData.patient_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const departments = [
    ...new Set(doctors.map((d) => d.department).filter(Boolean)),
  ] as string[];

  const availableSpecializations = [
    ...new Set(
      doctors
        .filter((d) => d.department === formData.department)
        .map((d) => d.specialization)
        .filter(Boolean),
    ),
  ] as string[];

  const availableServices = services.filter((s) => {
    if (s.status !== "Available") return false;
    if (!formData.department) return false;
    const deptMatch =
      !s.department ||
      s.department.toLowerCase() === formData.department.toLowerCase();
    const specMatch =
      !s.specialization ||
      !formData.specialization ||
      s.specialization.toLowerCase() === formData.specialization.toLowerCase();
    return deptMatch && specMatch;
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAdmin && staffProfile?.department && staffProfile?.specialization) {
      setFormData((prev) => ({
        ...prev,
        department: staffProfile.department ?? "",
        specialization: staffProfile.specialization ?? "",
      }));
    }
  }, [staffProfile?.department, staffProfile?.specialization, isAdmin]);

  // Directly lock the <main> scroll container while this page is mounted
  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) return;
    const prevOverflow = main.style.overflow;
    const prevHeight = main.style.height;
    main.style.overflow = "hidden";
    main.style.height = "100%";
    return () => {
      main.style.overflow = prevOverflow;
      main.style.height = prevHeight;
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointData, staffData, statsData, servicesRes] =
        await Promise.all([
          getAllAppointments(),
          getAllStaff(),
          getAppointmentStats(),
          getAllServices(),
        ]);
      if (appointData.data) setAppointments(appointData.data);
      if (staffData.data)
        setDoctors(
          staffData.data.filter((s) => s.role?.toLowerCase() === "doctor"),
        );
      if (servicesRes.data) setServices(servicesRes.data);
      if (statsData.data) {
        const pending =
          appointData.data?.filter(
            (a) => a.status === "Pending" || a.status === "Assigned",
          ).length ?? 0;
        setStats({ ...statsData.data, pending });
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (msg: string, sev: "success" | "error") =>
    setSnackbar({ open: true, message: msg, severity: sev });
  const isValidPHPhone = (v: string) => /^(09\d{9}|\+639\d{9})$/.test(v.trim());

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      const missing: string[] = [];
      if (!formData.patient_last_name) missing.push("Last name");
      if (!formData.patient_first_name) missing.push("First name");
      if (!formData.patient_middle_name) missing.push("Middle name");
      if (!formData.patient_contact_number) missing.push("Mobile number");
      if (!formData.patient_dob) missing.push("Date of birth");
      if (!formData.patient_address) missing.push("Address");
      if (!formData.patient_age) missing.push("Age");
      if (!formData.patient_height) missing.push("Height");
      if (!formData.patient_weight) missing.push("Weight");
      if (!formData.patient_sex) missing.push("Sex");
      if (!formData.patient_civil_status) missing.push("Civil status");
      if (missing.length > 0)
        return "Please fill in all required fields: " + missing.join(", ");
      if (!isValidPHPhone(formData.patient_contact_number))
        return "Enter a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX";
    }
    if (step === 2) {
      const missing: string[] = [];
      if (!formData.department) missing.push("Department");
      if (!formData.appointment_date) missing.push("Appointment date");
      if (!formData.appointment_time) missing.push("Time slot");
      if (missing.length > 0)
        return "Please fill in all required fields: " + missing.join(", ");
      if (formData.appointment_date < today)
        return "Appointment date cannot be in the past";
      if (formData.appointment_date === today) {
        const parseTime = (t: string) => {
          const [time, period] = t.split(" ");
          let [h, m] = time.split(":").map(Number);
          if (period === "PM" && h !== 12) h += 12;
          if (period === "AM" && h === 12) h = 0;
          return h * 60 + m;
        };
        const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        if (parseTime(formData.appointment_time) <= nowMinutes)
          return "Appointment time cannot be in the past";
      }
      if (isAdmin) {
        const matchingDoctors = doctors.filter(
          (d) =>
            d.department === formData.department &&
            (!formData.specialization ||
              d.specialization === formData.specialization),
        );
        if (matchingDoctors.length === 0)
          return "No doctors available for this department and specialization";
      }
    }
    if (step === 3) {
      const missing: string[] = [];
      if (!formData.bp) missing.push("Blood pressure");
      if (!formData.pulse) missing.push("Pulse rate");
      if (!formData.temp) missing.push("Temperature");
      if (!formData.allergies) missing.push("Known allergies");
      if (!formData.chief_complaint) missing.push("Chief complaint");
      if (missing.length > 0)
        return "Please fill in all required fields: " + missing.join(", ");
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      showSnackbar(err, "error");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const selectedService = services.find((s) => s.id === formData.service_id);
    const status = isAdmin ? "Assigned" : "Pending";

    const { error } = await createAppointment({
      first_name: formData.patient_first_name,
      middle_name: formData.patient_middle_name,
      last_name: formData.patient_last_name,
      patient_contact_number: formData.patient_contact_number || "N/A",
      doctor_id: isAdmin ? null : (staffProfile?.id ?? null),
      department: formData.department,
      specialization: formData.specialization || formData.department,
      service_id: formData.service_id || null,
      service_name: selectedService?.name || null,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      notes: buildOPDNotes(formData),
      status,
    });

    if (error) {
      showSnackbar(error, "error");
      return;
    }

    if (isAdmin) {
      const matchingDoctors = doctors.filter(
        (d) =>
          d.department === formData.department &&
          (!formData.specialization ||
            d.specialization === formData.specialization),
      );
      await Promise.all(
        matchingDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: "New Appointment Available — First to Accept",
            message: `A new appointment is available in the ${formData.department} department (${formData.specialization || "any specialization"}) for patient "${patient_name}" on ${formData.appointment_date} at ${formData.appointment_time}. First doctor to accept will be assigned.`,
            type: "info",
          }),
        ),
      );
      showSnackbar(
        `Appointment sent to ${formData.department} doctors — first to accept is assigned`,
        "success",
      );
    } else {
      await createNotification({
        staff_id: null,
        title: "New Appointment Pending Approval",
        message: `${staffProfile?.name ?? "A staff member"} submitted an appointment for patient "${patient_name}" in the ${formData.department} department on ${formData.appointment_date} at ${formData.appointment_time}.`,
        type: "info",
      });
      showSnackbar("Appointment submitted for admin approval", "success");
    }

    fetchData();
    resetForm();
    setDrawerOpen(false);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      patient_last_name: "",
      patient_first_name: "",
      patient_middle_name: "",
      patient_contact_number: "",
      patient_address: "",
      patient_dob: "",
      patient_age: "",
      patient_sex: "",
      patient_civil_status: "",
      patient_height: "",
      patient_weight: "",
      department: !isAdmin ? formData.department : "",
      specialization: !isAdmin ? (staffProfile?.specialization ?? "") : "",
      service_id: "",
      appointment_date: "",
      appointment_time: "",
      allergies: "",
      bp: "",
      pulse: "",
      temp: "",
      chief_complaint: "",
      notes: "",
    });
  };

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleAdminApprove = async (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Assigned" } : a)),
    );
    const { error } = await approveAppointment(id);
    if (error) {
      showSnackbar(error, "error");
      fetchData();
      return;
    }
    if (appt?.department) {
      const matchingDoctors = doctors.filter(
        (d) =>
          d.department === appt.department &&
          (!(appt as any).specialization ||
            d.specialization === (appt as any).specialization),
      );
      await Promise.all(
        matchingDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: "New Appointment Available — First to Accept",
            message: `A new appointment is available in the ${appt.department} department for patient "${getAppointmentPatientName(appt)}" on ${appt.appointment_date} at ${appt.appointment_time}. First doctor to accept will be assigned.`,
            type: "info",
          }),
        ),
      );
    }
    showSnackbar(
      "Appointment approved and sent to matching doctors",
      "success",
    );
    fetchData();
  };

  const handleAdminReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a)),
    );
    const { error } = await rejectAppointment(id);
    if (error) showSnackbar(error, "error");
    else showSnackbar("Appointment rejected", "success");
    fetchData();
  };

  const handleDoctorAccept = async (id: string) => {
    if (!staffProfile?.id) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "Approved", doctor_id: staffProfile.id }
          : a,
      ),
    );
    const { error } = await acceptAssignedAppointment(id, staffProfile.id);
    if (error) {
      showSnackbar(error, "error");
      fetchData();
      return;
    }
    const appt = appointments.find((a) => a.id === id);
    if (appt?.department) {
      const otherDoctors = doctors.filter(
        (d) => d.department === appt.department && d.id !== staffProfile.id,
      );
      await Promise.all(
        otherDoctors.map((doc) =>
          createNotification({
            staff_id: doc.id,
            title: "Appointment Claimed",
            message: `The appointment for patient "${getAppointmentPatientName(appt)}" on ${appt.appointment_date} at ${appt.appointment_time} has already been accepted by another doctor.`,
            type: "info",
          }),
        ),
      );
    }
    showSnackbar("Appointment accepted — you are now assigned", "success");
    fetchData();
  };

  const handleDoctorReject = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a)),
    );
    const { error } = await rejectAssignedAppointment(id);
    if (error) showSnackbar(error, "error");
    else showSnackbar("Appointment rejected", "success");
    fetchData();
  };

  const handleStart = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "Accepted" } : a)),
    );
    const { error: startErr } = await startAppointment(appt.id);
    if (startErr) {
      showSnackbar(startErr, "error");
      fetchData();
      return;
    }
    if (appt.doctor_id) await updateDutyStatus(appt.doctor_id, "On Duty");
    showSnackbar("Appointment started — doctor is now On Duty", "success");
    fetchData();
  };

  const handleNoShow = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "No Show" } : a)),
    );
    const { error } = await noShowAppointment(id);
    if (error) showSnackbar(error, "error");
    else showSnackbar("Marked as No Show", "success");
    fetchData();
  };

  const handleCancel = async (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a)),
    );
    const { error } = await cancelAppointment(id);
    if (error) showSnackbar(error, "error");
    else showSnackbar("Appointment cancelled", "success");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    const { error } = await deleteAppointment(id);
    if (error) showSnackbar(error, "error");
    else showSnackbar("Appointment deleted", "success");
    fetchData();
  };

  const handleRescheduleOpen = (appt: Appointment) =>
    setRescheduleModal({
      open: true,
      id: appt.id,
      date: appt.appointment_date,
      time: appt.appointment_time,
    });

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModal.date || !rescheduleModal.time) {
      showSnackbar("Please select a new date and time", "error");
      return;
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleModal.id
          ? {
              ...a,
              appointment_date: rescheduleModal.date,
              appointment_time: rescheduleModal.time,
              status: "Approved",
            }
          : a,
      ),
    );
    const { error } = await rescheduleAppointment(
      rescheduleModal.id,
      rescheduleModal.date,
      rescheduleModal.time,
    );
    if (error) showSnackbar(error, "error");
    else showSnackbar("Appointment rescheduled", "success");
    setRescheduleModal({ open: false, id: "", date: "", time: "" });
    fetchData();
  };

  const handleComplete = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: "Completed" } : a)),
    );
    const { error } = await completeAppointment(appt.id);
    if (error) {
      showSnackbar(error, "error");
    } else {
      if (appt.doctor_id) await updateDutyStatus(appt.doctor_id, "Off Duty");
      showSnackbar("Appointment completed — doctor is now Off Duty", "success");
    }
    fetchData();
  };

  const handleSavePrescription = async () => {
    const { appt, text } = prescriptionModal;
    if (!appt || !text.trim()) {
      showSnackbar("Please enter a prescription", "error");
      return;
    }
    const { error } = await updateAppointmentPrescription(appt.id, text.trim());
    if (error) {
      showSnackbar(error, "error");
      return;
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id ? { ...a, prescription: text.trim() } : a,
      ),
    );
    showSnackbar("Prescription saved", "success");
    setPrescriptionModal({ open: false, appt: null, text: "" });
    fetchData();
  };

  const handleOpenView = async (appt: Appointment) => {
    setViewModal({ open: true, appt });
    setViewLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appt.id)
        .single();
      if (!error && data)
        setViewModal({ open: true, appt: data as Appointment });
    } finally {
      setViewLoading(false);
    }
  };

  // ── Status chip ───────────────────────────────────────────────────────────────
  const statusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ReactNode; label: string }
  > = {
    Pending: {
      color: "#d97706",
      bg: "#fef3c7",
      icon: <FiAlertCircle size={12} />,
      label: "Pending Admin Approval",
    },
    Assigned: {
      color: "#7c3aed",
      bg: "#ede9fe",
      icon: <FiAlertCircle size={12} />,
      label: "Awaiting Doctor Approval",
    },
    Approved: {
      color: "#3b82f6",
      bg: "#dbeafe",
      icon: <FiClock size={12} />,
      label: "Approved",
    },
    Accepted: {
      color: "#0891b2",
      bg: "#cffafe",
      icon: <FiPlay size={12} />,
      label: "In Progress",
    },
    Rejected: {
      color: "#dc2626",
      bg: "#fee2e2",
      icon: <FiXCircle size={12} />,
      label: "Rejected",
    },
    "No Show": {
      color: "#ea580c",
      bg: "#ffedd5",
      icon: <FiXCircle size={12} />,
      label: "No Show",
    },
    Cancelled: {
      color: "#ef4444",
      bg: "#fee2e2",
      icon: <FiXCircle size={12} />,
      label: "Cancelled",
    },
    Completed: {
      color: "#10b981",
      bg: "#d1fae5",
      icon: <FiCheckCircle size={12} />,
      label: "Completed",
    },
  };

  const getStatusChip = (status: string) => {
    const s = statusConfig[status] ?? statusConfig["Approved"];
    return (
      <Chip
        label={s.label}
        size="small"
        icon={s.icon as React.ReactElement}
        sx={{
          backgroundColor: s.bg,
          color: s.color,
          fontWeight: 500,
          fontSize: "11px",
          height: "24px",
        }}
      />
    );
  };

  const renderStaffActions = (appt: Appointment) => {
    if (isAdmin || appt.doctor_id !== staffProfile?.id) return null;
    if (appt.status !== "Approved" && appt.status !== "Accepted") return null;
    const isMenuOpen =
      actionsMenu.appt?.id === appt.id && Boolean(actionsMenu.anchor);
    return (
      <>
        <Tooltip title="Actions" placement="top">
          <IconButton
            size="small"
            onClick={(e) => setActionsMenu({ anchor: e.currentTarget, appt })}
            sx={{
              width: 28,
              height: 28,
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              color: "#6b7280",
              flexShrink: 0,
              "&:hover": { backgroundColor: "#f9fafb" },
              ...(isMenuOpen && {
                backgroundColor: "#f3f4f6",
                borderColor: "#d1d5db",
              }),
            }}
          >
            <FiMoreVertical size={13} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={actionsMenu.anchor}
          open={isMenuOpen}
          onClose={() => setActionsMenu({ anchor: null, appt: null })}
          PaperProps={{
            sx: {
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              minWidth: 160,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {appt.status === "Approved" && [
            <MenuItem
              key="start"
              onClick={() => {
                handleStart(appt);
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiPlay size={13} color="#16a34a" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
                Start
              </ListItemText>
            </MenuItem>,
            <MenuItem
              key="reschedule"
              onClick={() => {
                handleRescheduleOpen(appt);
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiCalendar size={13} color="#374151" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "13px" }}>
                Reschedule
              </ListItemText>
            </MenuItem>,
            <MenuItem
              key="noshow"
              onClick={() => {
                handleNoShow(appt.id);
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiSlash size={13} color="#d97706" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "13px", color: "#d97706" }}
              >
                No Show
              </ListItemText>
            </MenuItem>,
          ]}
          {(appt.status === "Approved" || appt.status === "Accepted") && [
            <MenuItem
              key="cancel"
              onClick={() => {
                handleCancel(appt.id);
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiXCircle size={13} color="#ef4444" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "13px", color: "#ef4444" }}
              >
                Cancel
              </ListItemText>
            </MenuItem>,
            <MenuItem
              key="complete"
              onClick={() => {
                handleComplete(appt);
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiCheckSquare size={13} color="#10b981" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "13px", color: "#10b981" }}
              >
                Mark Complete
              </ListItemText>
            </MenuItem>,
          ]}
          {appt.status === "Accepted" && [
            <MenuItem
              key="prescription"
              onClick={() => {
                setPrescriptionModal({ open: true, appt, text: "" });
                setActionsMenu({ anchor: null, appt: null });
              }}
              sx={{ fontSize: "13px", gap: 1, py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <FiClipboard size={13} color="#3b82f6" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "13px", color: "#3b82f6" }}
              >
                Prescription
              </ListItemText>
            </MenuItem>,
          ]}
        </Menu>
      </>
    );
  };

  // ── Table rows ────────────────────────────────────────────────────────────────
  const adminPendingQueue = appointments.filter((a) => a.status === "Pending");
  const doctorAssignedQueue = isAdmin
    ? []
    : appointments.filter(
        (a) =>
          a.status === "Assigned" &&
          a.doctor_id === null &&
          a.department === staffProfile?.department,
      );
  const mainTableRows = isAdmin
    ? appointments.filter((a) => a.status !== "Pending")
    : appointments.filter((a) => a.doctor_id === staffProfile?.id);

  const filteredRows = mainTableRows.filter((appt) => {
    const doctor = doctors.find((d) => d.id === appt.doctor_id);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      getAppointmentPatientName(appt).toLowerCase().includes(q) ||
      (doctor?.name ?? "").toLowerCase().includes(q) ||
      appt.appointment_date.includes(q) ||
      (appt.department ?? "").toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "pending_all"
        ? appt.status === "Pending" || appt.status === "Assigned"
        : appt.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );

  const submitSubtitle = isAdmin
    ? "Will be sent to doctors matching department & specialization — first to accept is assigned"
    : "Will be submitted to admin for approval";
  const submitSubtitleColor = isAdmin ? "#7c3aed" : "#d97706";

  // ── Step 1: Patient Information ───────────────────────────────────────────────
  const renderStep1 = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: 1,
        }}
      >
        <Box>
          <FieldLabel icon={<FiUser size={10} />} text="Last Name" required />
          <TextField
            size="small"
            fullWidth
            placeholder="dela Cruz"
            value={formData.patient_last_name}
            onChange={(e) =>
              setFormData({ ...formData, patient_last_name: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
        <Box>
          <FieldLabel icon={<FiUser size={10} />} text="First Name" required />
          <TextField
            size="small"
            fullWidth
            placeholder="Juan"
            value={formData.patient_first_name}
            onChange={(e) =>
              setFormData({ ...formData, patient_first_name: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
        <Box>
          <FieldLabel icon={<FiUser size={10} />} text="Middle Name" required />
          <TextField
            size="small"
            fullWidth
            placeholder="Santos"
            value={formData.patient_middle_name}
            onChange={(e) =>
              setFormData({ ...formData, patient_middle_name: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        <Box>
          <FieldLabel
            icon={<FiPhone size={10} />}
            text="Mobile Number"
            required
          />
          <TextField
            size="small"
            fullWidth
            placeholder="09XXXXXXXXX"
            value={formData.patient_contact_number}
            onChange={(e) =>
              setFormData({
                ...formData,
                patient_contact_number: e.target.value.replace(/[^0-9+]/g, ""),
              })
            }
            inputProps={{ inputMode: "tel", maxLength: 13 }}
            error={
              !!formData.patient_contact_number &&
              !isValidPHPhone(formData.patient_contact_number)
            }
            helperText={
              formData.patient_contact_number &&
              !isValidPHPhone(formData.patient_contact_number)
                ? "Format: 09XXXXXXXXX or +639XXXXXXXXX"
                : ""
            }
            sx={fieldSx}
          />
        </Box>
        <Box>
          <FieldLabel
            icon={<FiCalendar size={10} />}
            text="Date of Birth"
            required
          />
          <DatePicker
            value={formData.patient_dob}
            onChange={(v) => setFormData({ ...formData, patient_dob: v })}
          />
        </Box>
      </Box>

      <Box>
        <FieldLabel icon={<FiEdit2 size={10} />} text="Address" required />
        <TextField
          size="small"
          fullWidth
          placeholder="Brgy. Apolonio Samson, Quezon City"
          value={formData.patient_address}
          onChange={(e) =>
            setFormData({ ...formData, patient_address: e.target.value })
          }
          sx={fieldSx}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: 1,
        }}
      >
        <Box>
          <FieldLabel icon={<FiUser size={10} />} text="Age" required />
          <TextField
            size="small"
            fullWidth
            placeholder="25"
            type="number"
            value={formData.patient_age}
            onChange={(e) =>
              setFormData({ ...formData, patient_age: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
        <Box>
          <FieldLabel icon={<FiEdit2 size={10} />} text="Height" required />
          <TextField
            size="small"
            fullWidth
            placeholder="165 cm"
            value={formData.patient_height}
            onChange={(e) =>
              setFormData({ ...formData, patient_height: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
        <Box>
          <FieldLabel icon={<FiEdit2 size={10} />} text="Weight" required />
          <TextField
            size="small"
            fullWidth
            placeholder="60 kg"
            value={formData.patient_weight}
            onChange={(e) =>
              setFormData({ ...formData, patient_weight: e.target.value })
            }
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        <Box>
          <FieldLabel icon={<FiUser size={10} />} text="Sex" required />
          <TagSelector
            options={["Male", "Female", "Prefer not to say"]}
            value={formData.patient_sex}
            onChange={(v) => setFormData({ ...formData, patient_sex: v })}
          />
        </Box>
        <Box>
          <FieldLabel
            icon={<FiUser size={10} />}
            text="Civil Status"
            required
          />
          <TagSelector
            options={["Single", "Married", "Widowed", "Separated"]}
            value={formData.patient_civil_status}
            onChange={(v) =>
              setFormData({ ...formData, patient_civil_status: v })
            }
          />
        </Box>
      </Box>
    </Box>
  );

  // ── Step 2: Appointment Details ───────────────────────────────────────────────
  const renderStep2 = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <FieldLabel
          icon={<FiCalendar size={10} />}
          text="Select Date"
          required
        />
        <MiniCalendar
          value={formData.appointment_date}
          onChange={(d) => setFormData({ ...formData, appointment_date: d })}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Box>
            <FieldLabel
              icon={<FiUser size={10} />}
              text="Department"
              required
            />
            <FormControl fullWidth size="small" disabled={!isAdmin}>
              <Select
                value={formData.department}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    department: e.target.value,
                    specialization: "",
                    service_id: "",
                  })
                }
                displayEmpty
                renderValue={(selected) =>
                  selected ? (
                    selected
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                      Select a department…
                    </span>
                  )
                }
                sx={selectSx}
              >
                <MenuItem value="" disabled>
                  Select a department…
                </MenuItem>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <MenuItem key={dept} value={dept} sx={{ fontSize: "13px" }}>
                      {dept}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem
                    disabled
                    sx={{ fontSize: "13px", color: "#9ca3af" }}
                  >
                    No departments available
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FieldLabel
              icon={<FiBriefcase size={10} />}
              text="Specialization"
              required={isAdmin}
            />
            {isAdmin ? (
              <FormControl
                fullWidth
                size="small"
                disabled={!formData.department}
              >
                <Select
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialization: e.target.value,
                      service_id: "",
                    })
                  }
                  displayEmpty
                  renderValue={(selected) =>
                    selected ? (
                      selected
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        {formData.department
                          ? "Select a specialization…"
                          : "Select department first"}
                      </span>
                    )
                  }
                  sx={selectSx}
                >
                  <MenuItem value="" disabled>
                    Select a specialization…
                  </MenuItem>
                  {availableSpecializations.length > 0 ? (
                    availableSpecializations.map((spec) => (
                      <MenuItem
                        key={spec}
                        value={spec}
                        sx={{ fontSize: "13px" }}
                      >
                        {spec}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem
                      disabled
                      sx={{ fontSize: "13px", color: "#9ca3af" }}
                    >
                      No specializations found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            ) : (
              <TextField
                size="small"
                fullWidth
                value={formData.specialization || ""}
                disabled
                placeholder="Auto-filled from your profile"
                sx={{
                  ...fieldSx,
                  "& .MuiOutlinedInput-root": {
                    ...fieldSx["& .MuiOutlinedInput-root"],
                    backgroundColor: "#f9fafb",
                  },
                }}
              />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <Box>
            <FieldLabel icon={<FiTag size={10} />} text="Service" />
            <FormControl fullWidth size="small">
              <Select
                value={formData.service_id}
                onChange={(e) =>
                  setFormData({ ...formData, service_id: e.target.value })
                }
                displayEmpty
                renderValue={(selected) => {
                  if (!selected)
                    return (
                      <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                        Select a service…
                      </span>
                    );
                  const svc = services.find((s) => s.id === selected);
                  return svc ? svc.name : selected;
                }}
                sx={selectSx}
              >
                <MenuItem value="" sx={{ fontSize: "13px", color: "#9ca3af" }}>
                  No service selected
                </MenuItem>
                {availableServices.length > 0 ? (
                  availableServices.map((svc) => (
                    <MenuItem
                      key={svc.id}
                      value={svc.id}
                      sx={{ fontSize: "13px" }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: "12px", fontWeight: 500 }}>
                          {svc.name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                          ₱{svc.price.toLocaleString()} · {svc.duration}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem
                    disabled
                    sx={{ fontSize: "13px", color: "#9ca3af" }}
                  >
                    {!formData.department
                      ? isAdmin
                        ? "Select a department first"
                        : "Loading your department…"
                      : isAdmin && !formData.specialization
                        ? "Select a specialization first"
                        : "No services available for your department"}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FieldLabel
              icon={<FiClock size={10} />}
              text="Time Slot"
              required
            />
            <FormControl fullWidth size="small">
              <Select
                value={formData.appointment_time}
                onChange={(e) =>
                  setFormData({ ...formData, appointment_time: e.target.value })
                }
                displayEmpty
                renderValue={(selected) =>
                  selected ? (
                    selected
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                      Select a time…
                    </span>
                  )
                }
                sx={selectSx}
              >
                <MenuItem value="" disabled>
                  Select a time…
                </MenuItem>
                {[
                  "7:00 AM",
                  "7:30 AM",
                  "8:00 AM",
                  "8:30 AM",
                  "9:00 AM",
                  "9:30 AM",
                  "10:00 AM",
                  "10:30 AM",
                  "11:00 AM",
                  "11:30 AM",
                  "12:00 PM",
                  "12:30 PM",
                  "1:00 PM",
                  "1:30 PM",
                  "2:00 PM",
                  "2:30 PM",
                  "3:00 PM",
                  "3:30 PM",
                  "4:00 PM",
                  "4:30 PM",
                  "5:00 PM",
                ].map((t) => (
                  <MenuItem key={t} value={t} sx={{ fontSize: "13px" }}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {!isAdmin && staffProfile && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "10px",
              px: 1.5,
              py: 1,
            }}
          >
            <Box sx={{ flexShrink: 0, mt: "2px" }}>
              <FiUser size={13} color="#3b82f6" />
            </Box>
            <Typography
              sx={{ fontSize: "12px", color: "#1d4ed8", flexWrap: "wrap" }}
            >
              Appointment will be assigned to{" "}
              <strong>{staffProfile.name}</strong> ·{" "}
              <strong>{staffProfile.department}</strong> ·{" "}
              <strong>{staffProfile.specialization}</strong>
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // ── Step 3: Clinical Notes ────────────────────────────────────────────────────
  const renderStep3 = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box>
        <Typography
          sx={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            mb: 0.75,
          }}
        >
          Vital Signs
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            gap: 1,
          }}
        >
          <Box>
            <FieldLabel
              icon={<FiHeart size={10} />}
              text="Blood Pressure"
              required
            />
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. 120/80"
              value={formData.bp}
              onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel
              icon={<FiHeart size={10} />}
              text="Pulse Rate"
              required
            />
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. 72 bpm"
              value={formData.pulse}
              onChange={(e) =>
                setFormData({ ...formData, pulse: e.target.value })
              }
              sx={fieldSx}
            />
          </Box>
          <Box>
            <FieldLabel
              icon={<FiHeart size={10} />}
              text="Temperature"
              required
            />
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. 36.5 °C"
              value={formData.temp}
              onChange={(e) =>
                setFormData({ ...formData, temp: e.target.value })
              }
              sx={fieldSx}
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <FieldLabel
          icon={<FiAlertCircle size={10} />}
          text="Known Allergies"
          required
        />
        <TextField
          size="small"
          fullWidth
          placeholder="e.g. Penicillin, Aspirin, Shellfish…"
          value={formData.allergies}
          onChange={(e) =>
            setFormData({ ...formData, allergies: e.target.value })
          }
          sx={fieldSx}
        />
      </Box>

      <Box>
        <FieldLabel
          icon={<FiFileText size={10} />}
          text="Chief Complaint"
          required
        />
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          placeholder="Describe the patient's main reason for the visit…"
          value={formData.chief_complaint}
          onChange={(e) =>
            setFormData({ ...formData, chief_complaint: e.target.value })
          }
          sx={fieldSx}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "10px",
          px: 1.5,
          py: 1,
        }}
      >
        <FiClipboard
          size={12}
          color="#3b82f6"
          style={{ marginTop: 1, flexShrink: 0 }}
        />
        <Typography sx={{ fontSize: "11px", color: "#1d4ed8" }}>
          Prescription can be added by the doctor once the appointment has
          started.
        </Typography>
      </Box>
    </Box>
  );

  // ── Step 4: Review ────────────────────────────────────────────────────────────
  const renderStep4 = () => {
    const selectedService = services.find((s) => s.id === formData.service_id);
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            Patient Information
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 0.75,
            }}
          >
            <ReviewField label="Full Name" value={patient_name} />
            <ReviewField
              label="Mobile Number"
              value={formData.patient_contact_number}
            />
            <ReviewField label="Address" value={formData.patient_address} />
            <ReviewField
              label="Date of Birth"
              value={formatDOB(formData.patient_dob)}
            />
            <ReviewField
              label="Age / Sex"
              value={[formData.patient_age, formData.patient_sex]
                .filter(Boolean)
                .join(" / ")}
            />
            <ReviewField
              label="Civil Status"
              value={formData.patient_civil_status}
            />
            <ReviewField label="Height" value={formData.patient_height} />
            <ReviewField label="Weight" value={formData.patient_weight} />
          </Box>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            Appointment Details
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 0.75,
            }}
          >
            <ReviewField label="Department" value={formData.department} />
            <ReviewField
              label="Specialization"
              value={formData.specialization}
            />
            <ReviewField
              label="Service"
              value={
                selectedService
                  ? `${selectedService.name} — ₱${selectedService.price.toLocaleString()}`
                  : ""
              }
            />
            <ReviewField
              label="Date & Time"
              value={[formData.appointment_date, formData.appointment_time]
                .filter(Boolean)
                .join(" at ")}
            />
          </Box>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              mb: 0.75,
              pb: 0.5,
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            Clinical Notes
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 0.75,
              }}
            >
              <ReviewField label="Blood Pressure" value={formData.bp} />
              <ReviewField label="Pulse Rate" value={formData.pulse} />
              <ReviewField label="Temperature" value={formData.temp} />
            </Box>
            <ReviewField label="Known Allergies" value={formData.allergies} />
            <ReviewField
              label="Chief Complaint"
              value={formData.chief_complaint}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            backgroundColor: isAdmin ? "#f5f3ff" : "#fffbeb",
            border: `1px solid ${isAdmin ? "#c4b5fd" : "#fde68a"}`,
            borderRadius: "10px",
            px: 1.5,
            py: 1,
          }}
        >
          <FiAlertCircle
            size={13}
            color={isAdmin ? "#7c3aed" : "#d97706"}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <Typography
            sx={{ fontSize: "12px", color: isAdmin ? "#6d28d9" : "#92400e" }}
          >
            {submitSubtitle}
          </Typography>
        </Box>
      </Box>
    );
  };

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4];
  const stepTitles = [
    "Patient Information",
    "Appointment Details",
    "Clinical Notes",
    "Review & Submit",
  ];
  const stepSubtitles = [
    "Demographics and contact details from the OPD record",
    "Department, service, date and time",
    "Vital signs, allergies and chief complaint",
    "Confirm all details before submitting",
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          gap: 1.5,
          px: { xs: 0, sm: 0.5 },
        }}
      >
        {/* ── ADMIN PENDING QUEUE ── */}
        {isAdmin && adminPendingQueue.length > 0 && (
          <Box sx={{ flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#92400e",
                mb: 0.75,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FiAlertCircle /> Pending Requests Needing Approval (
              {adminPendingQueue.length})
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "10px",
                border: "2px solid #fde68a",
                maxHeight: "180px",
                overflowX: "auto",
                overflowY: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      "Patient",
                      "Requested By",
                      "Department",
                      "Specialization",
                      "Service",
                      "Date",
                      "Time",
                      "Actions",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 600,
                          fontSize: "11px",
                          backgroundColor: "#fef3c7",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminPendingQueue.map((appt) => {
                    const requestedBy =
                      doctors.find((d) => d.id === appt.doctor_id) ?? null;
                    const svc = services.find(
                      (s) => s.id === (appt as any).service_id,
                    );
                    return (
                      <TableRow
                        key={appt.id}
                        sx={{ "&:hover": { backgroundColor: "#fffbeb" } }}
                      >
                        <TableCell sx={{ fontSize: "12px" }}>
                          {getAppointmentPatientName(appt)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {requestedBy ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  backgroundColor: "#dbeafe",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FiUser size={10} color="#3b82f6" />
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#1f2937",
                                }}
                              >
                                {requestedBy.name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              sx={{ fontSize: "12px", color: "#9ca3af" }}
                            >
                              Unknown
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          <Chip
                            label={appt.department ?? "—"}
                            size="small"
                            sx={{
                              backgroundColor: "#ede9fe",
                              color: "#7c3aed",
                              fontSize: "11px",
                              fontWeight: 500,
                              height: "22px",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", color: "#374151" }}>
                          {(appt as any).specialization ??
                            appt.department ??
                            "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {svc ? (
                            <Box>
                              <Typography
                                sx={{ fontSize: "12px", fontWeight: 500 }}
                              >
                                {svc.name}
                              </Typography>
                              <Typography
                                sx={{ fontSize: "11px", color: "#6b7280" }}
                              >
                                ₱{svc.price.toLocaleString()}
                              </Typography>
                            </Box>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {new Date(appt.appointment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {appt.appointment_time}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", width: 160 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="View details" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenView(appt)}
                                sx={{
                                  width: 26,
                                  height: 26,
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                  color: "#6b7280",
                                  "&:hover": { backgroundColor: "#f9fafb" },
                                  flexShrink: 0,
                                }}
                              >
                                <FiEye size={12} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleAdminApprove(appt.id)}
                              sx={{
                                textTransform: "none",
                                fontSize: "11px",
                                px: 1.25,
                                py: 0.3,
                                minWidth: 0,
                                height: 26,
                                borderRadius: "6px",
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleAdminReject(appt.id)}
                              sx={{
                                textTransform: "none",
                                fontSize: "11px",
                                px: 1.25,
                                py: 0.3,
                                minWidth: 0,
                                height: 26,
                                borderRadius: "6px",
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── DOCTOR ASSIGNED QUEUE ── */}
        {!isAdmin && doctorAssignedQueue.length > 0 && (
          <Box sx={{ flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#5b21b6",
                mb: 0.75,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FiAlertCircle /> Available in Your Department (
              {doctorAssignedQueue.length})
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "10px",
                border: "2px solid #c4b5fd",
                maxHeight: "180px",
                overflowX: "auto",
                overflowY: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      "Patient",
                      "Department",
                      "Specialization",
                      "Service",
                      "Date",
                      "Time",
                      "Actions",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 600,
                          fontSize: "11px",
                          backgroundColor: "#ede9fe",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctorAssignedQueue.map((appt) => {
                    const svc = services.find(
                      (s) => s.id === (appt as any).service_id,
                    );
                    return (
                      <TableRow
                        key={appt.id}
                        sx={{ "&:hover": { backgroundColor: "#f5f3ff" } }}
                      >
                        <TableCell sx={{ fontSize: "12px" }}>
                          {getAppointmentPatientName(appt)}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          <Chip
                            label={appt.department ?? "—"}
                            size="small"
                            sx={{
                              backgroundColor: "#ede9fe",
                              color: "#7c3aed",
                              fontSize: "11px",
                              fontWeight: 500,
                              height: "22px",
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "12px",
                            color: "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(appt as any).specialization ?? "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {svc ? (
                            <Box>
                              <Typography
                                sx={{ fontSize: "12px", fontWeight: 500 }}
                              >
                                {svc.name}
                              </Typography>
                              <Typography
                                sx={{ fontSize: "11px", color: "#6b7280" }}
                              >
                                ₱{svc.price.toLocaleString()}
                              </Typography>
                            </Box>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {new Date(appt.appointment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px" }}>
                          {appt.appointment_time}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", width: 150 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Tooltip title="View details" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenView(appt)}
                                sx={{
                                  width: 26,
                                  height: 26,
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                  color: "#6b7280",
                                  "&:hover": { backgroundColor: "#f9fafb" },
                                  flexShrink: 0,
                                }}
                              >
                                <FiEye size={12} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleDoctorAccept(appt.id)}
                              sx={{
                                textTransform: "none",
                                fontSize: "11px",
                                px: 1.25,
                                py: 0.3,
                                minWidth: 0,
                                height: 26,
                                borderRadius: "6px",
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDoctorReject(appt.id)}
                              sx={{
                                textTransform: "none",
                                fontSize: "11px",
                                px: 1.25,
                                py: 0.3,
                                minWidth: 0,
                                height: 26,
                                borderRadius: "6px",
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── MAIN TABLE ── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, sm: 2 },
              pt: { xs: 1.25, sm: 1.5 },
              pb: 1,
              borderBottom: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            {(() => {
              const tabCounts = {
                all: mainTableRows.length,
                pending: mainTableRows.filter(
                  (a) => a.status === "Pending" || a.status === "Assigned",
                ).length,
                confirmed: mainTableRows.filter((a) => a.status === "Approved")
                  .length,
                inProgress: mainTableRows.filter((a) => a.status === "Accepted")
                  .length,
                noShow: mainTableRows.filter((a) => a.status === "No Show")
                  .length,
                rejected: mainTableRows.filter((a) => a.status === "Rejected")
                  .length,
                cancelled: mainTableRows.filter((a) => a.status === "Cancelled")
                  .length,
                completed: mainTableRows.filter((a) => a.status === "Completed")
                  .length,
              };
              const tabs = [
                { label: "All", value: "", count: tabCounts.all },
                {
                  label: "Pending",
                  value: "pending_all",
                  count: tabCounts.pending,
                },
                {
                  label: "Confirmed",
                  value: "Approved",
                  count: tabCounts.confirmed,
                },
                {
                  label: "In Progress",
                  value: "Accepted",
                  count: tabCounts.inProgress,
                },
                { label: "No Show", value: "No Show", count: tabCounts.noShow },
                {
                  label: "Rejected",
                  value: "Rejected",
                  count: tabCounts.rejected,
                },
                {
                  label: "Cancelled",
                  value: "Cancelled",
                  count: tabCounts.cancelled,
                },
                {
                  label: "Completed",
                  value: "Completed",
                  count: tabCounts.completed,
                },
              ];
              return (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#1a202c",
                          fontSize: "16px",
                        }}
                      >
                        Appointments
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          mt: 0.25,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                          {tabCounts.all} total
                        </Typography>
                        {tabCounts.pending > 0 && (
                          <>
                            <Typography sx={{ color: "#d1d5db" }}>·</Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#d97706",
                                fontWeight: 500,
                              }}
                            >
                              {tabCounts.pending} pending
                            </Typography>
                          </>
                        )}
                        {tabCounts.confirmed > 0 && (
                          <>
                            <Typography sx={{ color: "#d1d5db" }}>·</Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#3b82f6",
                                fontWeight: 500,
                              }}
                            >
                              {tabCounts.confirmed} confirmed
                            </Typography>
                          </>
                        )}
                        {tabCounts.inProgress > 0 && (
                          <>
                            <Typography sx={{ color: "#d1d5db" }}>·</Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#0891b2",
                                fontWeight: 500,
                              }}
                            >
                              {tabCounts.inProgress} in progress
                            </Typography>
                          </>
                        )}
                        {tabCounts.completed > 0 && (
                          <>
                            <Typography sx={{ color: "#d1d5db" }}>·</Typography>
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "#10b981",
                                fontWeight: 500,
                              }}
                            >
                              {tabCounts.completed} completed
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FiRefreshCw size={12} />}
                        onClick={fetchData}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "8px",
                          borderColor: "#e5e7eb",
                          color: "#374151",
                          "&:hover": {
                            backgroundColor: "#f9fafb",
                            borderColor: "#d1d5db",
                          },
                        }}
                      >
                        Refresh
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<FiPlusCircle size={13} />}
                        onClick={() => {
                          resetForm();
                          setDrawerOpen(true);
                        }}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "8px",
                          backgroundColor: "#3b82f6",
                          "&:hover": { backgroundColor: "#2563eb" },
                        }}
                      >
                        New Appointment
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {tabs.map((tab) => (
                      <Button
                        key={tab.value}
                        size="small"
                        onClick={() => setStatusFilter(tab.value)}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "7px",
                          px: 1.25,
                          py: 0.35,
                          minWidth: 0,
                          backgroundColor:
                            statusFilter === tab.value
                              ? "#1a202c"
                              : "transparent",
                          color:
                            statusFilter === tab.value ? "#fff" : "#6b7280",
                          border: "1px solid",
                          borderColor:
                            statusFilter === tab.value ? "#1a202c" : "#e5e7eb",
                          "&:hover": {
                            backgroundColor:
                              statusFilter === tab.value
                                ? "#111827"
                                : "#f9fafb",
                          },
                        }}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>
                            {tab.count}
                          </span>
                        )}
                      </Button>
                    ))}
                  </Box>
                </>
              );
            })()}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              px: 2,
              py: 1,
              borderBottom: "1px solid #f3f4f6",
              backgroundColor: "#fafafa",
              flexShrink: 0,
            }}
          >
            <TextField
              size="small"
              placeholder="Search patient, doctor or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch size={14} color="#9ca3af" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <FiX size={12} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: { xs: "100%", sm: 280 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "12px",
                  backgroundColor: "#fff",
                  "& fieldset": { borderColor: "#e5e7eb" },
                },
              }}
            />
            <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
              {filteredRows.length} of {mainTableRows.length} appointments
            </Typography>
          </Box>

          <TableContainer
            sx={{ flex: 1, overflowX: "auto", overflowY: "auto" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    "Patient",
                    "Department",
                    "Specialization",
                    "Service",
                    "Doctor",
                    "Date",
                    "Time",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 600,
                        fontSize: "11px",
                        backgroundColor: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((appt) => {
                  const doctor =
                    doctors.find((d) => d.id === appt.doctor_id) ??
                    (appt.doctor_id === staffProfile?.id ? staffProfile : null);
                  const svc = services.find(
                    (s) => s.id === (appt as any).service_id,
                  );
                  return (
                    <TableRow
                      key={appt.id}
                      sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
                    >
                      <TableCell sx={{ fontSize: "12px" }}>
                        {getAppointmentPatientName(appt)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {appt.department ? (
                          <Chip
                            label={appt.department}
                            size="small"
                            sx={{
                              backgroundColor: "#ede9fe",
                              color: "#7c3aed",
                              fontSize: "11px",
                              fontWeight: 500,
                              height: "22px",
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px", color: "#374151" }}>
                        {(appt as any).specialization ?? appt.department ?? "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {svc ? (
                          <Box>
                            <Typography
                              sx={{ fontSize: "12px", fontWeight: 500 }}
                            >
                              {svc.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: "11px", color: "#6b7280" }}
                            >
                              ₱{svc.price.toLocaleString()}
                            </Typography>
                          </Box>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "12px",
                          color: doctor ? "#1f2937" : "#9ca3af",
                        }}
                      >
                        {doctor?.name ??
                          (appt.status === "Assigned"
                            ? "Awaiting claim…"
                            : "Unassigned")}
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {new Date(appt.appointment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {appt.appointment_time}
                      </TableCell>
                      <TableCell>{getStatusChip(appt.status)}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", width: 80 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Tooltip title="View details" placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenView(appt)}
                              sx={{
                                width: 26,
                                height: 26,
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                color: "#6b7280",
                                "&:hover": { backgroundColor: "#f9fafb" },
                                flexShrink: 0,
                              }}
                            >
                              <FiEye size={12} />
                            </IconButton>
                          </Tooltip>
                          {isAdmin ? (
                            appt.status === "Assigned" && !appt.doctor_id ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDelete(appt.id)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "11px",
                                  px: 1.25,
                                  py: 0.3,
                                  minWidth: 0,
                                  height: 26,
                                  borderRadius: "6px",
                                }}
                              >
                                Delete
                              </Button>
                            ) : null
                          ) : (
                            renderStaffActions(appt)
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{ py: 4, color: "#9ca3af" }}
                    >
                      {searchQuery || statusFilter
                        ? "No appointments match your filters."
                        : "No appointments found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── OPD FORM DRAWER ── */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            resetForm();
          }}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: 480 },
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          {/* Drawer header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2.5,
              py: 2,
              borderBottom: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 700, fontSize: "16px", color: "#1a202c" }}
              >
                OPD Record Form
              </Typography>
              <Typography
                sx={{ fontSize: "11px", color: submitSubtitleColor, mt: 0.25 }}
              >
                Fill all the fields to continue
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  px: 1.25,
                  py: 0.5,
                }}
              >
                <FiCalendar size={11} color="#9ca3af" />
                <Typography
                  sx={{ fontSize: "11px", fontWeight: 500, color: "#374151" }}
                >
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  setDrawerOpen(false);
                  resetForm();
                }}
                sx={{ color: "#6b7280" }}
              >
                <FiX size={16} />
              </IconButton>
            </Box>
          </Box>

          {/* Stepper */}
          <Box sx={{ px: 2.5, pt: 1.5, flexShrink: 0 }}>
            <StepperHeader currentStep={currentStep} />
            <Box sx={{ mb: 1 }}>
              <Typography
                sx={{ fontWeight: 600, color: "#1a202c", fontSize: "14px" }}
              >
                {stepTitles[currentStep - 1]}
              </Typography>
              <Typography sx={{ fontSize: "11px", color: "#6b7280", mt: 0.15 }}>
                {stepSubtitles[currentStep - 1]}
              </Typography>
            </Box>
          </Box>

          {/* Scrollable step content */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, pb: 2 }}>
            {stepContent[currentStep - 1]()}
          </Box>

          {/* Footer navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2.5,
              py: 2,
              borderTop: "1px solid #f3f4f6",
              flexShrink: 0,
              backgroundColor: "#fff",
            }}
          >
            {currentStep > 1 ? (
              <Button
                variant="outlined"
                startIcon={<FiArrowLeft size={13} />}
                onClick={handleBack}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.75,
                  fontSize: "13px",
                  fontWeight: 500,
                  borderColor: "#e5e7eb",
                  color: "#374151",
                  "&:hover": {
                    backgroundColor: "#f9fafb",
                    borderColor: "#d1d5db",
                  },
                }}
              >
                Back
              </Button>
            ) : (
              <Box />
            )}

            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              {STEPS.map((step) => (
                <Box
                  key={step.id}
                  sx={{
                    width: currentStep === step.id ? 16 : 6,
                    height: 6,
                    borderRadius: "3px",
                    transition: "all .25s",
                    backgroundColor:
                      currentStep === step.id
                        ? "#3b82f6"
                        : currentStep > step.id
                          ? "#10b981"
                          : "#e5e7eb",
                  }}
                />
              ))}
            </Box>

            {currentStep < STEPS.length ? (
              <Button
                variant="contained"
                endIcon={<FiArrowRight size={13} />}
                onClick={handleNext}
                sx={{
                  backgroundColor: "#3b82f6",
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.75,
                  fontSize: "13px",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#2563eb" },
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<FiArrowRight size={13} />}
                onClick={handleSubmit}
                sx={{
                  backgroundColor: "#10b981",
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.75,
                  fontSize: "13px",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#059669" },
                }}
              >
                {isAdmin ? "Assign to Dept." : "Submit for Approval"}
              </Button>
            )}
          </Box>
        </Drawer>

        {/* ── VIEW PATIENT INFO MODAL ── */}
        <Dialog
          open={viewModal.open}
          onClose={() => setViewModal({ open: false, appt: null })}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              margin: { xs: "16px", sm: "32px" },
              width: { xs: "calc(100% - 32px)", sm: "100%" },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
            }}
          >
            <Box>
              <Typography
                sx={{ fontWeight: 600, fontSize: "16px", color: "#1a202c" }}
              >
                {viewModal.appt
                  ? getAppointmentPatientName(viewModal.appt)
                  : ""}
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: 0.25 }}>
                Patient Record
              </Typography>
            </Box>
            <IconButton
              onClick={() => setViewModal({ open: false, appt: null })}
              size="small"
            >
              <FiX />
            </IconButton>
          </DialogTitle>
          <DialogContent
            dividers
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
          >
            {viewLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : viewModal.appt ? (
              (() => {
                const appt = viewModal.appt!;
                const doctor = doctors.find((d) => d.id === appt.doctor_id);
                const svc = services.find(
                  (s) => s.id === (appt as any).service_id,
                );
                const prescription = (appt as any).prescription as
                  | string
                  | null
                  | undefined;

                const parseNotes = (raw: string | null) => {
                  if (!raw) return {} as Record<string, string>;
                  const result: Record<string, string> = {};
                  raw.split("\n").forEach((line) => {
                    const idx = line.indexOf(": ");
                    if (idx !== -1) {
                      result[line.slice(0, idx).trim()] = line
                        .slice(idx + 2)
                        .trim();
                    }
                  });
                  return result;
                };
                const parsed = parseNotes(appt.notes ?? null);

                const vitals = [
                  parsed["BP"]
                    ? { key: "Blood Pressure", val: parsed["BP"] }
                    : null,
                  parsed["Pulse"]
                    ? { key: "Pulse Rate", val: parsed["Pulse"] }
                    : null,
                  parsed["Temp"]
                    ? { key: "Temperature", val: parsed["Temp"] }
                    : null,
                ].filter(Boolean) as { key: string; val: string }[];

                const demoItems = [
                  parsed["DOB"]
                    ? { key: "Date of Birth", val: parsed["DOB"] }
                    : null,
                  parsed["Age"] ? { key: "Age", val: parsed["Age"] } : null,
                  parsed["Sex"] ? { key: "Sex", val: parsed["Sex"] } : null,
                  parsed["Civil Status"]
                    ? { key: "Civil Status", val: parsed["Civil Status"] }
                    : null,
                  parsed["Height"]
                    ? { key: "Height", val: parsed["Height"] }
                    : null,
                  parsed["Weight"]
                    ? { key: "Weight", val: parsed["Weight"] }
                    : null,
                  parsed["Address"]
                    ? { key: "Address", val: parsed["Address"] }
                    : null,
                ].filter(Boolean) as { key: string; val: string }[];

                const InfoRow = ({
                  label,
                  value,
                }: {
                  label: string;
                  value?: string;
                }) =>
                  value ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        p: 1,
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                      }}
                    >
                      <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#1a202c",
                        }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ) : null;

                const SectionTitle = ({
                  children,
                }: {
                  children: React.ReactNode;
                }) => (
                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      mb: 1,
                      pb: 0.5,
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {children}
                  </Typography>
                );

                return (
                  <>
                    <Box>
                      <SectionTitle>Appointment</SectionTitle>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 1,
                        }}
                      >
                        <InfoRow
                          label="Date"
                          value={new Date(
                            appt.appointment_date,
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        />
                        <InfoRow label="Time" value={appt.appointment_time} />
                        <InfoRow
                          label="Department"
                          value={appt.department ?? undefined}
                        />
                        <InfoRow
                          label="Specialization"
                          value={(appt as any).specialization ?? undefined}
                        />
                        <InfoRow
                          label="Service"
                          value={
                            svc
                              ? `${svc.name} — ₱${svc.price.toLocaleString()}`
                              : undefined
                          }
                        />
                        <InfoRow
                          label="Assigned Doctor"
                          value={
                            doctor?.name ??
                            (appt.status === "Assigned"
                              ? "Awaiting claim"
                              : undefined)
                          }
                        />
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            p: 1,
                            backgroundColor: "#f9fafb",
                            borderRadius: "8px",
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "11px", color: "#9ca3af" }}
                          >
                            Status
                          </Typography>
                          {getStatusChip(appt.status)}
                        </Box>
                      </Box>
                    </Box>

                    {demoItems.length > 0 && (
                      <Box>
                        <SectionTitle>Patient Details</SectionTitle>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1,
                          }}
                        >
                          {demoItems.map(
                            (item) =>
                              item && (
                                <InfoRow
                                  key={item.key}
                                  label={item.key}
                                  value={item.val}
                                />
                              ),
                          )}
                        </Box>
                      </Box>
                    )}

                    {vitals.length > 0 && (
                      <Box>
                        <SectionTitle>Vital Signs</SectionTitle>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "1fr 1fr 1fr",
                            },
                            gap: 1,
                          }}
                        >
                          {vitals.map(
                            (item) =>
                              item && (
                                <InfoRow
                                  key={item.key}
                                  label={item.key}
                                  value={item.val}
                                />
                              ),
                          )}
                        </Box>
                      </Box>
                    )}

                    {(parsed["Chief Complaint"] || parsed["Allergies"]) && (
                      <Box>
                        <SectionTitle>Clinical Notes</SectionTitle>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <InfoRow
                            label="Chief Complaint"
                            value={parsed["Chief Complaint"]}
                          />
                          <InfoRow
                            label="Allergies"
                            value={parsed["Allergies"]}
                          />
                        </Box>
                      </Box>
                    )}

                    {!parsed["Chief Complaint"] &&
                      !vitals.length &&
                      !demoItems.length &&
                      appt.notes && (
                        <Box>
                          <SectionTitle>Notes</SectionTitle>
                          <Box
                            sx={{
                              p: 1.5,
                              backgroundColor: "#f9fafb",
                              borderRadius: "8px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "13px",
                                color: "#374151",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.7,
                              }}
                            >
                              {appt.notes}
                            </Typography>
                          </Box>
                        </Box>
                      )}

                    {prescription && (
                      <Box>
                        <SectionTitle>Prescription</SectionTitle>
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "8px",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            <FiClipboard
                              size={14}
                              color="#3b82f6"
                              style={{ marginTop: 2, flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontSize: "13px",
                                color: "#1d4ed8",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.7,
                              }}
                            >
                              {prescription}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </>
                );
              })()
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5 }}>
            <Button
              onClick={() => setViewModal({ open: false, appt: null })}
              sx={{ textTransform: "none", fontSize: "13px" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── PRESCRIPTION MODAL ── */}
        <Dialog
          open={prescriptionModal.open}
          onClose={() =>
            setPrescriptionModal({ open: false, appt: null, text: "" })
          }
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              margin: { xs: "16px", sm: "32px" },
              width: { xs: "calc(100% - 32px)", sm: "100%" },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiClipboard size={15} color="#3b82f6" />
              </Box>
              <Box>
                <Typography
                  sx={{ fontWeight: 600, fontSize: "15px", color: "#1a202c" }}
                >
                  Write Prescription
                </Typography>
                {prescriptionModal.appt && (
                  <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                    Patient:{" "}
                    {prescriptionModal.appt &&
                      getAppointmentPatientName(prescriptionModal.appt)}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton
              onClick={() =>
                setPrescriptionModal({ open: false, appt: null, text: "" })
              }
              size="small"
            >
              <FiX />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                Enter the prescription details below. This will be saved to the
                patient's appointment record.
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                placeholder={`e.g.\nAmoxicillin 500mg — 1 capsule 3x a day for 7 days\nParacetamol 500mg — 1 tablet every 4–6 hours as needed\nIbuprofen 400mg — 1 tablet twice daily after meals`}
                value={prescriptionModal.text}
                onChange={(e) =>
                  setPrescriptionModal((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "13px",
                    backgroundColor: "#fff",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e5e7eb",
                  },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  px: 1.5,
                  py: 1,
                }}
              >
                <FiAlertCircle
                  size={13}
                  color="#d97706"
                  style={{ marginTop: 1, flexShrink: 0 }}
                />
                <Typography sx={{ fontSize: "12px", color: "#92400e" }}>
                  The prescription will be appended to this appointment's notes
                  and visible in the patient record.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5 }}>
            <Button
              onClick={() =>
                setPrescriptionModal({ open: false, appt: null, text: "" })
              }
              sx={{ textTransform: "none", fontSize: "13px" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePrescription}
              startIcon={<FiClipboard size={13} />}
              sx={{
                textTransform: "none",
                fontSize: "13px",
                backgroundColor: "#3b82f6",
                "&:hover": { backgroundColor: "#2563eb" },
                borderRadius: "8px",
              }}
            >
              Save Prescription
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── RESCHEDULE MODAL ── */}
        <Dialog
          open={rescheduleModal.open}
          onClose={() =>
            setRescheduleModal({ open: false, id: "", date: "", time: "" })
          }
          maxWidth="xs"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              margin: { xs: "16px", sm: "32px" },
              width: { xs: "calc(100% - 32px)", sm: "100%" },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Reschedule Appointment
            <IconButton
              onClick={() =>
                setRescheduleModal({ open: false, id: "", date: "", time: "" })
              }
              size="small"
            >
              <FiX />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <TextField
                label="New Date *"
                type="date"
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: today },
                }}
                value={rescheduleModal.date}
                onChange={(e) =>
                  setRescheduleModal((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
              <TextField
                label="New Time *"
                type="time"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={rescheduleModal.time}
                onChange={(e) =>
                  setRescheduleModal((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setRescheduleModal({ open: false, id: "", date: "", time: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRescheduleSubmit}
              sx={{
                backgroundColor: "#3b82f6",
                "&:hover": { backgroundColor: "#2563eb" },
              }}
            >
              Confirm Reschedule
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}

export default Appointments;
