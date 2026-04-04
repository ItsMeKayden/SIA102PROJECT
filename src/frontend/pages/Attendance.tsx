import "../styles/Pages.css";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Skeleton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  FiClock,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiPhone,
  FiMinusCircle,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { QRScanner } from "../components/scanner/QRScanner";
import { useAuth } from "../../contexts/AuthContext";
import {
  getCurrentLocation,
  getLocationStatusMessage,
  calculateDistance,
  CLINIC_LOCATION,
} from "../../lib/locationUtils";
import {
  getAllAttendance,
  clockIn,
  clockOut,
  isStaffClockedIn,
  markStaffAbsent,
} from "../../backend/services/attendanceService";
import {
  recordQRCodeScan,
  validateQRCode,
  getDailyQRCode,
} from "../../backend/services/qrCodeService";
import { getAllStaff } from "../../backend/services/staffService";
import { getAllSchedules } from "../../backend/services/scheduleService";
import type {
  Attendance as AttendanceType,
  AttendanceWithStaff,
  Staff,
  Schedule,
} from "../../types";

// Utility function to get today's date in local timezone
function getTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Main Component
function Attendance() {
  const { userRole, staffProfile } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceWithStaff[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    onCall: 0,
  });
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [generateQRModalOpen, setGenerateQRModalOpen] = useState(false);
  const [selectedStaffForQR, setSelectedStaffForQR] = useState<Staff | null>(
    null,
  );
  const [qrCodeData, setQrCodeData] = useState<{
    qrValue: string;
    scanCount: number;
    status: "active" | "invalid";
  } | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getTodayDateString();
  });
  const lastDateRef = useRef<string>(getTodayDateString());
  const [shiftSession, setShiftSession] = useState<"AM" | "PM">("AM");
  const [schedulesByStaffAndDay, setSchedulesByStaffAndDay] = useState<
    Map<string, Map<number, Schedule[]>>
  >(new Map());
  const absentMarkingCompleteRef = useRef<Set<string>>(new Set()); // Track staff/date combos already marked absent to prevent duplicates
  const lastAbsentCheckTimeRef = useRef<number>(0); // Track when we last checked for absent marking (by date)

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching attendance data...");

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 8000),
      );

      const [attendanceRes, staffRes, schedulesRes] = await Promise.all([
        Promise.race([getAllAttendance(), timeoutPromise]) as Promise<{
          data: AttendanceType[] | null;
          error: string | null;
        }>,
        getAllStaff(),
        getAllSchedules(),
      ]);

      const { data: attendanceRecords, error: attendanceError } = attendanceRes;
      const { data: allStaff } = staffRes;
      const { data: allSchedules } = schedulesRes;

      console.log("Attendance records fetched:", attendanceRecords);

      if (attendanceError) {
        console.error("Attendance error:", attendanceError);
        setError(attendanceError);
        setLoading(false);
        return;
      }

      const records = attendanceRecords || [];
      const staffMembers =
        allStaff?.filter((staff) => staff.user_role !== "admin") || [];
      const today = getTodayDateString();

      console.log("=== FETCH ATTENDANCE DATA DEBUG ===");
      console.log("Today computed as:", today);
      console.log("Raw attendance records from DB (first 3):");
      console.log(
        records
          .slice(0, 3)
          .map((r) => ({ date: r.date, staff_id: r.staff_id, id: r.id })),
      );

      // Create a complete attendance dataset
      // Group records by date
      const recordsByDate = new Map<string, AttendanceType[]>();
      records.forEach((record) => {
        const date = record.date;
        if (!recordsByDate.has(date)) {
          recordsByDate.set(date, []);
        }
        recordsByDate.get(date)!.push(record);
      });

      // Ensure today exists in the map
      if (!recordsByDate.has(today)) {
        recordsByDate.set(today, []);
      }

      // Build a map of schedules by staff_id and day_of_week for quick lookup
      const schedByStaffDay = new Map<string, Map<number, Schedule[]>>();
      allSchedules?.forEach((schedule) => {
        if (!schedByStaffDay.has(schedule.staff_id)) {
          schedByStaffDay.set(schedule.staff_id, new Map());
        }
        const dayMap = schedByStaffDay.get(schedule.staff_id)!;
        if (!dayMap.has(schedule.day_of_week)) {
          dayMap.set(schedule.day_of_week, []);
        }
        dayMap.get(schedule.day_of_week)!.push(schedule);
      });
      setSchedulesByStaffAndDay(schedByStaffDay);

      // For each date, ensure all staff members have a record
      const completeRecords: AttendanceType[] = [];
      recordsByDate.forEach((dateRecords, date) => {
        const recordedStaffIds = new Set(dateRecords.map((r) => r.staff_id));
        const dayOfWeek = new Date(date).getDay();

        // Add existing records
        completeRecords.push(...dateRecords);

        // Add placeholder records for staff without attendance
        staffMembers.forEach((staff) => {
          if (!recordedStaffIds.has(staff.id)) {
            // Check if staff has a schedule for this day of the week (any shift)
            const hasSchedule =
              allSchedules?.some(
                (schedule) =>
                  schedule.staff_id === staff.id &&
                  schedule.day_of_week === dayOfWeek &&
                  schedule.is_active,
              ) || false;

            completeRecords.push({
              id: `placeholder-${staff.id}-${date}`,
              staff_id: staff.id,
              staff_name: staff.name,
              date,
              time_in: null,
              time_out: null,
              status: hasSchedule ? "Pending" : "Not Scheduled",
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as unknown as AttendanceType);
          }
        });
      });

      // Sort records by date descending (most recent first), then by staff id
      completeRecords.sort((a, b) => {
        const dateCompare =
          new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.staff_id.localeCompare(b.staff_id);
      });

      setAttendanceData(completeRecords);
      console.log("Set attendance data, count:", completeRecords.length);

      // Calculate stats for today only
      const todayRecords = completeRecords.filter(
        (a: AttendanceType) => a.date === today,
      );
      if (todayRecords.length > 0) {
        const present = todayRecords.filter(
          (a: AttendanceType) => a.status === "Present",
        ).length;
        const late = todayRecords.filter(
          (a: AttendanceType) => a.status === "Late",
        ).length;
        const absent = todayRecords.filter(
          (a: AttendanceType) => a.status === "Absent",
        ).length;
        const onCall = todayRecords.filter(
          (a: AttendanceType) => a.status === "On-Call",
        ).length;

        setStats({
          present,
          late,
          absent,
          onCall,
        });
      } else {
        setStats({
          present: 0,
          late: 0,
          absent: 0,
          onCall: 0,
        });
      }

      // Set staff list with full staff data including department
      setStaffList(staffMembers);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch attendance data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle clock in/out
  const handleClockInOut = useCallback(
    async (staffId: string) => {
      console.log("DEBUG: handleClockInOut called with staffId:", staffId);
      if (!staffId.trim()) {
        setSnackbar({
          open: true,
          message: "Please enter a valid staff ID",
          severity: "error",
        });
        return;
      }

      try {
        console.log(
          "Clock in/out triggered at local time:",
          getTodayDateString(),
        );
        // Get device location
        let latitude: number | undefined;
        let longitude: number | undefined;
        let locationMessage = "";

        try {
          const location = await getCurrentLocation();
          latitude = location.latitude;
          longitude = location.longitude;
          const distance = calculateDistance(
            latitude,
            longitude,
            CLINIC_LOCATION.latitude,
            CLINIC_LOCATION.longitude,
          );
          locationMessage = ` ${getLocationStatusMessage(distance <= 100, distance)}`;
        } catch (locationError) {
          console.warn("Location error:", locationError);
          locationMessage = " ⚠ Location unavailable";
        }

        // Check if staff is already clocked in
        const { isClockedIn: isCurrentlyClockedIn, error: checkError } =
          await isStaffClockedIn(staffId);

        if (checkError) {
          setSnackbar({
            open: true,
            message: checkError,
            severity: "error",
          });
          return;
        }

        if (isCurrentlyClockedIn) {
          // Clock out
          const { error } = await clockOut(
            staffId,
            staffProfile?.id || "",
            latitude,
            longitude,
          );
          if (error) {
            setSnackbar({
              open: true,
              message: error,
              severity: "error",
            });
          } else {
            setSnackbar({
              open: true,
              message: `Clocked out successfully at ${new Date().toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                },
              )}${locationMessage}`,
              severity: "success",
            });
            setQrScannerOpen(false);
            fetchAttendanceData(); // Refresh attendance data
          }
        } else {
          // Clock in
          const { error } = await clockIn(
            staffId,
            undefined,
            staffProfile?.id || "",
            latitude,
            longitude,
          );
          if (error) {
            setSnackbar({
              open: true,
              message: error,
              severity: "error",
            });
          } else {
            setSnackbar({
              open: true,
              message: `Clocked in successfully at ${new Date().toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                },
              )}${locationMessage}`,
              severity: "success",
            });
            setQrScannerOpen(false);
            fetchAttendanceData(); // Refresh attendance data
          }
        }
      } catch (error) {
        console.error("Error during clock in/out:", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setSnackbar({
          open: true,
          message: errorMsg,
          severity: "error",
        });
      }
    },
    [fetchAttendanceData, staffProfile?.id],
  );

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Initialize selectedDate to today on component mount and whenever date changes
  useEffect(() => {
    const today = getTodayDateString();
    setSelectedDate(today);
    lastDateRef.current = today;
    console.log("Component mounted, set selectedDate to:", today);
  }, []);

  // Auto-detect day change and update date + fetch data
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getTodayDateString();
      if (currentDate !== lastDateRef.current) {
        console.log("Day changed from", lastDateRef.current, "to", currentDate);
        lastDateRef.current = currentDate;
        setSelectedDate(currentDate);
        // Fetch fresh data for the new day
        fetchAttendanceData();
      }
    };

    // Check immediately
    checkDateChange();

    // Check every minute for day change
    const intervalId = setInterval(checkDateChange, 60000);

    return () => clearInterval(intervalId);
  }, [fetchAttendanceData]);

  // Force display date to be today for non-admin users
  useEffect(() => {
    if (userRole !== "admin") {
      const today = getTodayDateString();
      setSelectedDate(today);
    }
  }, [userRole]);

  // Update stats when selected date or shift changes (for admin users)
  useEffect(() => {
    const today = getTodayDateString();
    const displayDate = userRole === "admin" ? selectedDate : today;
    const displayRecords = attendanceData.filter(
      (a: AttendanceType) => a.date === displayDate,
    );

    // Filter records by shift session - only show staff scheduled for this shift
    const shiftFilteredRecords = displayRecords.filter(
      (record: AttendanceType) => {
        const dayOfWeek = new Date(record.date).getDay();
        const staffSchedules =
          schedulesByStaffAndDay.get(record.staff_id)?.get(dayOfWeek) || [];
        const hasShiftSchedule = staffSchedules.some(
          (schedule: Schedule) =>
            schedule.shift_session === shiftSession && schedule.is_active,
        );
        // Only include if they're scheduled for this shift
        return hasShiftSchedule;
      },
    );

    if (shiftFilteredRecords.length > 0) {
      const present = shiftFilteredRecords.filter(
        (a: AttendanceType) => a.status === "Present",
      ).length;
      const late = shiftFilteredRecords.filter(
        (a: AttendanceType) => a.status === "Late",
      ).length;
      const absent = shiftFilteredRecords.filter(
        (a: AttendanceType) => a.status === "Absent",
      ).length;
      const onCall = shiftFilteredRecords.filter(
        (a: AttendanceType) => a.status === "On-Call",
      ).length;

      setStats({
        present,
        late,
        absent,
        onCall,
      });
    } else {
      setStats({
        present: 0,
        late: 0,
        absent: 0,
        onCall: 0,
      });
    }
  }, [
    selectedDate,
    attendanceData,
    userRole,
    shiftSession,
    schedulesByStaffAndDay,
  ]);

  // Update status to Absent for staff past their scheduled end time without clocking in
  // Run when attendance data loads, but only once per day
  useEffect(() => {
    const updateAbsentStatus = async () => {
      const today = getTodayDateString();
      const currentTime = new Date().toTimeString().split(" ")[0];
      const dayOfWeek = new Date().getDay();

      // Check if we've already done absent marking for today
      const lastCheckTime = lastAbsentCheckTimeRef.current;
      const today_timestamp = new Date(today).getTime();
      const todayDate = Math.floor(today_timestamp / (1000 * 60 * 60 * 24));
      const lastCheckDate = Math.floor(lastCheckTime / (1000 * 60 * 60 * 24));

      // Only run this check once per day (if we already checked today, skip)
      if (lastCheckTime !== 0 && lastCheckDate === todayDate) {
        console.log("Absent status already checked for today, skipping...");
        return;
      }

      lastAbsentCheckTimeRef.current = today_timestamp;

      // Fetch all schedules once
      const { data: allSchedules } = await getAllSchedules();
      const scheduleMap = new Map<string, Schedule>();

      if (allSchedules) {
        allSchedules.forEach((schedule) => {
          if (schedule.day_of_week === dayOfWeek && schedule.is_active) {
            // Only keep the first schedule for each staff (in case there are multiple)
            if (!scheduleMap.has(schedule.staff_id)) {
              scheduleMap.set(schedule.staff_id, schedule);
            }
          }
        });
      }

      const staffToMarkAbsent: { staffId: string; date: string }[] = [];
      const staffDateKey = (staffId: string, date: string) =>
        `${staffId}-${date}`;

      // Only process if we have attendance data
      if (!attendanceData || attendanceData.length === 0) {
        console.log("No attendance data to process for absent marking");
        return;
      }

      // Check today's records with Pending status and no clock-in
      for (const record of attendanceData) {
        if (
          record.date === today &&
          record.status === "Pending" &&
          !record.time_in
        ) {
          const todaySchedule = scheduleMap.get(record.staff_id);
          const key = staffDateKey(record.staff_id, today);

          // Skip if we've already marked this staff/date as absent
          if (absentMarkingCompleteRef.current.has(key)) {
            console.log(
              `Already processed ${record.staff_id} for absent marking`,
            );
            continue;
          }

          if (todaySchedule && todaySchedule.end_time) {
            // Parse times for comparison
            const [schedEndHour, schedEndMin] = todaySchedule.end_time
              .split(":")
              .map(Number);
            const [currentHour, currentMin] = currentTime
              .split(":")
              .map(Number);

            const schedEndMinutes = schedEndHour * 60 + schedEndMin;
            const currentMinutes = currentHour * 60 + currentMin;

            // If current time is past scheduled end time, mark as Absent
            if (currentMinutes >= schedEndMinutes) {
              console.log(
                `Staff ${record.staff_id} is past end time (${todaySchedule.end_time} < ${currentTime}), marking absent`,
              );
              staffToMarkAbsent.push({ staffId: record.staff_id, date: today });
              absentMarkingCompleteRef.current.add(key); // Mark as processed
            }
          }
        }
      }

      // Save each absent record to database without triggering state updates
      if (staffToMarkAbsent.length > 0) {
        console.log(`Marking ${staffToMarkAbsent.length} staff as absent...`);
        for (const { staffId, date } of staffToMarkAbsent) {
          await markStaffAbsent(
            staffId,
            date,
            "Automatically marked as absent after scheduled end time",
          );
        }
        console.log("Absent marking complete");
      } else {
        console.log("No staff to mark as absent at this time");
      }
    };

    // Run the update
    if (attendanceData && attendanceData.length > 0) {
      updateAbsentStatus();
    }
  }, [attendanceData]); // Run when attendance data changes

  const handleGenerateQRCode = async (staff: Staff) => {
    setQrCodeLoading(true);
    try {
      const { data, error } = await getDailyQRCode(staff.id);
      if (error) {
        setSnackbar({
          open: true,
          message: `Error: ${error}`,
          severity: "error",
        });
        setQrCodeLoading(false);
      } else if (data && data.qr_value) {
        setQrCodeData({
          qrValue: data.qr_value,
          scanCount: data.scan_count,
          status: data.status,
        });
        setSelectedStaffForQR(staff);
        setQrCodeLoading(false);
      } else {
        setSnackbar({
          open: true,
          message: "Failed to generate QR code",
          severity: "error",
        });
        setQrCodeLoading(false);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        severity: "error",
      });
      setQrCodeLoading(false);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateHours = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn) return "";
    if (!timeOut) return "In Progress";

    const start = new Date(`2000-01-01T${timeIn}`);
    const end = new Date(`2000-01-01T${timeOut}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return `${hours.toFixed(1)} Hours`;
  };

  const handleQRScan = (code: string) => {
    console.log("QR Code scanned - Raw value:", code);
    console.log("QR Code length:", code.length);
    console.log(
      "QR Code character analysis:",
      code
        .split("")
        .map((c, i) => `${i}: ${c} (${c.charCodeAt(0)})`)
        .join(", "),
    );

    const trimmedCode = code.trim();
    console.log("QR Code after trim:", trimmedCode);

    // Extract staff ID from QR value
    // The QR code contains the full UUID at the beginning, followed by date and token
    // Format: staffId-date-token or staffId_date_token

    let staffId: string | null = null;

    // Try to extract UUID pattern (8-4-4-4-12 hex digit groups)
    // This is a UUID in standard format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidMatch = trimmedCode.match(
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i,
    );

    console.log("UUID Regex Match Result:", uuidMatch);

    if (uuidMatch && uuidMatch[1]) {
      staffId = uuidMatch[1];
      console.log("✓ Successfully extracted staff ID from QR code:", staffId);
      console.log("DEBUG: Full staff ID in handleClockInOut will be:", staffId);
    } else {
      console.error("✗ Could not extract UUID from QR code");
      console.error("  Full QR value:", trimmedCode);
      console.error("  First 50 chars:", trimmedCode.substring(0, 50));
      setSnackbar({
        open: true,
        message: "Invalid QR code format. Could not extract staff ID.",
        severity: "error",
      });
      return;
    }

    // Check if staff is already marked as absent TODAY
    const today = getTodayDateString();
    const staffAbsentToday = attendanceData.some(
      (record) =>
        record.staff_id === staffId &&
        record.date === today &&
        record.status === "Absent",
    );

    if (staffAbsentToday) {
      setSnackbar({
        open: true,
        message:
          "Staff is already marked as absent today. Cannot clock in/out.",
        severity: "error",
      });
      return;
    }

    // Validate QR code before recording
    validateQRCode(trimmedCode).then((validation) => {
      if (!validation.isValid) {
        console.error("QR code validation failed:", validation.message);
        setSnackbar({
          open: true,
          message: validation.message,
          severity: "error",
        });
        return;
      }

      // Check authorization: staff can only clock in/out for themselves, admins can do for anyone
      if (staffProfile && staffProfile.id !== staffId && userRole !== "admin") {
        setSnackbar({
          open: true,
          message:
            "You can only clock in/out for yourself. Contact an administrator for manual entries.",
          severity: "error",
        });
        return; // Don't record the scan if unauthorized
      }

      // Record the QR code scan only after authorization check passes
      recordQRCodeScan(trimmedCode).then((result) => {
        if (result.error) {
          console.error("QR code scan recording failed:", result.error);
          setSnackbar({
            open: true,
            message: result.error,
            severity: "error",
          });
          return;
        }

        // Proceed with clock in/out using the extracted full staff ID
        console.log(
          "✓ QR code scan successful, proceeding with clock in/out for staff:",
          staffId,
        );
        handleClockInOut(staffId!);
      });
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          maxWidth: "1400px",
          mx: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Header skeleton */}
        <Box>
          <Skeleton variant="text" width="200px" height={32} sx={{ mb: 1 }} />
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="text" width="80px" height={20} />
            ))}
          </Box>
        </Box>
        {/* Table skeleton - 7 columns */}
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Headers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 1,
              p: 2,
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} variant="text" height={20} />
            ))}
          </Box>
          {/* Rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <Box
              key={i}
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 1,
                p: 2,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <Skeleton key={j} variant="text" height={20} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: "1400px",
        mx: "auto",
        width: "100%",
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 3, sm: { mb: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 3, md: 0 },
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "flex-start", sm: "space-between" },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 550,
                  fontSize: { xs: "20px", sm: "24px" },
                  color: "#1a202c",
                }}
              >
                Attendance Tracking
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 2 },
                  flexDirection: { xs: "column", sm: "row" },
                  width: { xs: "100%", sm: "auto" },
                  alignItems: { xs: "stretch", sm: "center" },
                }}
              >
                {userRole !== "admin" && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: { xs: 1, sm: 2 },
                      flexDirection: { xs: "column", sm: "row" },
                      width: { xs: "100%", sm: "auto" },
                      alignItems: { xs: "stretch", sm: "center" },
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<FiClock size={16} />}
                      onClick={() => setQrScannerOpen(true)}
                      sx={{
                        textTransform: "none",
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: { xs: "12px", sm: "13px" },
                        backgroundColor: "#10b981",
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": {
                          backgroundColor: "#059669",
                        },
                        "&:active": {
                          backgroundColor: "#10b981",
                        },
                      }}
                    >
                      Scan QR Code
                    </Button>
                  </Box>
                )}
                {userRole === "admin" && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      flexDirection: { xs: "column", sm: "row" },
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Select Date"
                        value={dayjs(selectedDate)}
                        onChange={(date) => {
                          if (date) {
                            const formattedDate = dayjs.isDayjs(date)
                              ? date.format("YYYY-MM-DD")
                              : dayjs(date).format("YYYY-MM-DD");
                            setSelectedDate(formattedDate);
                          }
                        }}
                        sx={{
                          width: { xs: "100%", sm: "200px" },
                        }}
                      />
                    </LocalizationProvider>
                    <Button
                      variant="contained"
                      onClick={() => setGenerateQRModalOpen(true)}
                      sx={{
                        textTransform: "none",
                        backgroundColor: "#3b82f6",
                        fontWeight: 600,
                        fontSize: { xs: "12px", sm: "13px" },
                        width: { xs: "100%", sm: "auto" },
                        "&:hover": { backgroundColor: "#2563eb" },
                      }}
                    >
                      Generate QR Code
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 2, sm: 2 },
                alignItems: { xs: "stretch", sm: "flex-start" },
                flexWrap: "wrap",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                  width: "100%",
                }}
              >
                {[
                  {
                    label: "Present",
                    value: stats.present,
                    color: "#16a34a",
                    borderColor: "rgba(22, 163, 74, 0.3)",
                    bgColor: "rgba(22, 163, 74, 0.1)",
                    icon: FiCheckCircle,
                  },
                  {
                    label: "Late",
                    value: stats.late,
                    color: "#d97706",
                    borderColor: "rgba(217, 119, 6, 0.3)",
                    bgColor: "rgba(217, 119, 6, 0.1)",
                    icon: FiAlertCircle,
                  },
                  {
                    label: "Absent",
                    value: stats.absent,
                    color: "#dc2626",
                    borderColor: "rgba(220, 38, 38, 0.3)",
                    bgColor: "rgba(220, 38, 38, 0.1)",
                    icon: FiMinusCircle,
                  },
                  {
                    label: "On-Call",
                    value: stats.onCall,
                    color: "#3b82f6",
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    bgColor: "rgba(59, 130, 246, 0.1)",
                    icon: FiPhone,
                  },
                ].map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <Card
                      key={card.label}
                      sx={{
                        background: "#ffffff",
                        border: `1px solid ${card.borderColor}`,
                        borderRadius: "12px",
                        boxShadow: "none",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <CardContent
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          py: "12px",
                          px: "16px",
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexShrink: 0,
                            backgroundColor: card.bgColor,
                            padding: "8px",
                            borderRadius: "8px",
                          }}
                        >
                          <IconComponent size={32} color={card.color} />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#9ca3af",
                              mb: 0.5,
                              fontWeight: 500,
                              fontSize: { xs: "11px", sm: "12px" },
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {card.label}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              color: "#000000",
                              fontWeight: 700,
                              fontSize: { xs: "24px", sm: "28px" },
                            }}
                          >
                            {card.value}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Attendance Table */}
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "auto",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 2 },
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "16px", sm: "18px" },
                color: "#1f2937",
              }}
            >
              Attendance Log
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "13px",
              }}
            >
              Daily attendance records
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={shiftSession}
            exclusive
            onChange={(_event, newShift) => {
              if (newShift !== null) {
                setShiftSession(newShift);
              }
            }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              backgroundColor: "#f3f4f6",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              "& .MuiToggleButton-root": {
                flex: 1,
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "12px", sm: "13px" },
                borderRadius: "8px",
                border: "none",
                padding: "8px 16px",
                color: "#6b7280",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "#e5e7eb",
                },
              },
              "& .MuiToggleButton-root.Mui-selected": {
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              },
            }}
          >
            <ToggleButton value="AM">AM Shift</ToggleButton>
            <ToggleButton value="PM">PM Shift</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer sx={{ overflowX: "auto", overflowY: "hidden" }}>
          <Table sx={{ minWidth: { xs: "600px", sm: "900px", md: "100%" } }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  {selectedDate === getTodayDateString()
                    ? "Date Today"
                    : "Date"}
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Staff Name
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Time In
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Time Out
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Hours Worked
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "10px", sm: "12px" },
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1,
                    px: { xs: 0.5, sm: 2 },
                  }}
                >
                  Location
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const today = getTodayDateString();
                const displayDate = userRole === "admin" ? selectedDate : today;

                // Debug logging
                console.log("=== ATTENDANCE TABLE DEBUG ===");
                console.log("Current date (today):", today);
                console.log("Display date (selectedDate):", displayDate);
                console.log("User role:", userRole);
                console.log("Shift session:", shiftSession);
                console.log("selectedDate state:", selectedDate);

                // Get unique dates in attendanceData
                const uniqueDates = [
                  ...new Set(attendanceData.map((record) => record.date)),
                ].sort();
                console.log("Unique dates in attendanceData:", uniqueDates);
                console.log("Total attendance records:", attendanceData.length);

                let displayRecords = attendanceData.filter(
                  (record) => record.date === displayDate,
                );

                // Filter by shift session - only show staff scheduled for this shift
                displayRecords = displayRecords.filter((record) => {
                  const dayOfWeek = new Date(record.date).getDay();
                  const staffSchedules =
                    schedulesByStaffAndDay
                      .get(record.staff_id)
                      ?.get(dayOfWeek) || [];
                  const hasShiftSchedule = staffSchedules.some(
                    (schedule: Schedule) =>
                      schedule.shift_session === shiftSession &&
                      schedule.is_active,
                  );
                  // Only include if they're scheduled for this shift
                  return hasShiftSchedule;
                });

                console.log(
                  "Filtered records for displayDate:",
                  displayRecords.length,
                );
                console.log("=== END DEBUG ===");

                if (displayRecords.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography
                          color="textSecondary"
                          sx={{ fontSize: "14px" }}
                        >
                          No attendance records found for this date and shift
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                }
                return displayRecords.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      borderBottom: "1px solid #e5e7eb",
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "13px" },
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {formatDate(row.date)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}>
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "13px" },
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {row.staff_name || "Unknown"}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "13px" },
                          color: "#374151",
                        }}
                      >
                        {formatTime(row.time_in)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "13px" },
                          color: "#374151",
                        }}
                      >
                        {formatTime(row.time_out)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "13px" },
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {calculateHours(row.time_in, row.time_out)}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}
                    >
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: "9px", sm: "11px" },
                          backgroundColor:
                            row.status === "Present"
                              ? "#d1fae5"
                              : row.status === "Late"
                                ? "#fef3c7"
                                : row.status === "Pending"
                                  ? "#f3f4f6"
                                  : row.status === "On-Call"
                                    ? "#dbeafe"
                                    : row.status === "Not Scheduled"
                                      ? "#e5e7eb"
                                      : "#fee2e2",
                          color:
                            row.status === "Present"
                              ? "#065f46"
                              : row.status === "Late"
                                ? "#92400e"
                                : row.status === "Pending"
                                  ? "#6b7280"
                                  : row.status === "On-Call"
                                    ? "#1e40af"
                                    : row.status === "Not Scheduled"
                                      ? "#6b7280"
                                      : "#991b1b",
                        }}
                      />
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 1, px: { xs: 0.5, sm: 2 } }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {row.status === "Absent" ||
                        row.status === "Pending" ||
                        row.status === "Not Scheduled" ? (
                          <Typography
                            sx={{
                              fontSize: { xs: "10px", sm: "12px" },
                              color: "#9ca3af",
                            }}
                          >
                            —
                          </Typography>
                        ) : (
                          <>
                            {row.clock_in_within_premises !== null && (
                              <Chip
                                label={
                                  row.clock_in_within_premises
                                    ? "Clocked in Inside"
                                    : "Clocked in Outside"
                                }
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "8px", sm: "10px" },
                                  backgroundColor: row.clock_in_within_premises
                                    ? "#d1fae5"
                                    : "#fee2e2",
                                  color: row.clock_in_within_premises
                                    ? "#065f46"
                                    : "#991b1b",
                                  padding: { xs: "2px 4px", sm: "4px 8px" },
                                }}
                              />
                            )}
                            {row.clock_out_within_premises !== null && (
                              <Chip
                                label={
                                  row.clock_out_within_premises
                                    ? "Clocked out Inside"
                                    : "Clocked out Outside"
                                }
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "8px", sm: "10px" },
                                  backgroundColor: row.clock_out_within_premises
                                    ? "#d1fae5"
                                    : "#fee2e2",
                                  color: row.clock_out_within_premises
                                    ? "#065f46"
                                    : "#991b1b",
                                  padding: { xs: "2px 4px", sm: "4px 8px" },
                                }}
                              />
                            )}
                            {row.clock_in_within_premises === null &&
                              row.clock_out_within_premises === null && (
                                <Typography
                                  sx={{
                                    fontSize: { xs: "10px", sm: "12px" },
                                    color: "#9ca3af",
                                  }}
                                >
                                  —
                                </Typography>
                              )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Camera Scanner Modal */}
      <QRScanner
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
      />

      {/* Generate QR Code Modal */}
      <Dialog
        open={generateQRModalOpen}
        onClose={() => {
          if (!qrCodeLoading) {
            setGenerateQRModalOpen(false);
            setSelectedStaffForQR(null);
            setQrCodeData(null);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            margin: "16px",
            width: "calc(100% - 32px)",
          },
        }}
        disableEscapeKeyDown={qrCodeLoading}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontSize: { xs: "16px", sm: "18px" },
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {selectedStaffForQR ? "QR Code" : "Select Staff"}
          <IconButton
            onClick={() => {
              if (!qrCodeLoading) {
                setGenerateQRModalOpen(false);
                setSelectedStaffForQR(null);
                setQrCodeData(null);
              }
            }}
            size="small"
            disabled={qrCodeLoading}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {!selectedStaffForQR ? (
            // Staff Selection
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              {staffList.length === 0 ? (
                <Typography
                  sx={{ color: "#6b7280", textAlign: "center", py: 2 }}
                >
                  No staff members available
                </Typography>
              ) : (
                staffList.map((staff) => (
                  <Button
                    key={staff.id}
                    onClick={() => handleGenerateQRCode(staff)}
                    disabled={qrCodeLoading}
                    fullWidth
                    sx={{
                      textAlign: "left",
                      p: 2,
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      color: "#1f2937",
                      backgroundColor: "#f9fafb",
                      "&:hover": {
                        backgroundColor: "#f3f4f6",
                        borderColor: "#d1d5db",
                      },
                      "&:disabled": {
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                      },
                      textTransform: "none",
                      fontWeight: 500,
                      justifyContent: "flex-start",
                    }}
                  >
                    {qrCodeLoading ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={20} />
                        <Typography>Loading...</Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "14px" }}>
                          {staff.name}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                          {staff.role} • {staff.department || "N/A"}
                        </Typography>
                      </Box>
                    )}
                  </Button>
                ))
              )}
            </Box>
          ) : (
            // QR Code Display
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              {qrCodeData ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                    }}
                  >
                    <QRCodeSVG
                      value={qrCodeData.qrValue}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                  <Box sx={{ textAlign: "center", width: "100%" }}>
                    <Typography
                      sx={{
                        mb: 2,
                        fontSize: "14px",
                        color: "#1f2937",
                        fontWeight: 600,
                      }}
                    >
                      {selectedStaffForQR.name}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                        mb: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={`Status: ${qrCodeData.status === "active" ? "Active" : "Invalid"}`}
                        color={
                          qrCodeData.status === "active" ? "success" : "error"
                        }
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Scans: ${qrCodeData.scanCount}/2`}
                        color={qrCodeData.scanCount >= 2 ? "error" : "default"}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#6b7280",
                        wordBreak: "break-all",
                        p: 1,
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                      }}
                    >
                      {qrCodeData.qrValue}
                    </Typography>
                  </Box>
                </>
              ) : (
                <CircularProgress />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {selectedStaffForQR && (
            <Button
              onClick={() => {
                setSelectedStaffForQR(null);
                setQrCodeData(null);
              }}
              variant="outlined"
              sx={{
                textTransform: "none",
                color: "#6b7280",
                borderColor: "#d1d5db",
              }}
            >
              Select Different Staff
            </Button>
          )}
          <Button
            onClick={() => {
              setGenerateQRModalOpen(false);
              setSelectedStaffForQR(null);
              setQrCodeData(null);
            }}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Attendance;
