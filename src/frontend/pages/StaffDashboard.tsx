import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import { FiCalendar, FiClock, FiCheckCircle, FiUsers } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { getAppointmentsByDoctorId } from "../../backend/services/appointmentService";
import { supabase } from "../../lib/supabase-client";
import type { Appointment } from "../../types";

export const StaffDashboard: React.FC = () => {
  const { staffProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dutyStatus, setDutyStatus] = useState<string>(
    staffProfile?.duty_status || "Off Duty",
  );
  const [loading, setLoading] = useState(true);
  // Fetch latest duty_status directly from DB on every mount so we never
  // show a stale value from the AuthContext (which is only fetched at login).
  useEffect(() => {
    if (!staffProfile?.id) return;
    supabase
      .from("staff")
      .select("duty_status")
      .eq("id", staffProfile.id)
      .single()
      .then(({ data }) => {
        if (data?.duty_status) setDutyStatus(data.duty_status);
      });
  }, [staffProfile?.id]);

  // Initial fetch with proper async handling
  useEffect(() => {
    let isMounted = true;

    const performFetch = async () => {
      if (!staffProfile?.id) return;
      const { data } = await getAppointmentsByDoctorId(staffProfile.id);
      if (isMounted && data) {
        setAppointments(data);
        setLoading(false);
      }
    };

    performFetch();

    return () => {
      isMounted = false;
    };
  }, [staffProfile?.id]);

  // Realtime: re-fetch appointments when any appointment assigned to this doctor changes
  useEffect(() => {
    if (!staffProfile?.id) return;

    const performFetch = async () => {
      const { data } = await getAppointmentsByDoctorId(staffProfile.id);
      if (data) setAppointments(data);
    };

    const appointmentChannel = supabase
      .channel(`dashboard-appointments-${staffProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${staffProfile.id}`,
        },
        () => {
          performFetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
    };
  }, [staffProfile?.id]);

  // Realtime: update duty status instantly when the staff record changes
  useEffect(() => {
    if (!staffProfile?.id) return;

    const staffChannel = supabase
      .channel(`dashboard-staff-${staffProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "staff",
          filter: `id=eq.${staffProfile.id}`,
        },
        (payload) => {
          const updated = payload.new as { duty_status?: string };
          if (updated.duty_status) setDutyStatus(updated.duty_status);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(staffChannel);
    };
  }, [staffProfile?.id]);

  // Polling fallback: refresh duty status every 5 seconds in case Realtime
  // replication is not enabled for the staff table in Supabase.
  useEffect(() => {
    if (!staffProfile?.id) return;
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("staff")
        .select("duty_status")
        .eq("id", staffProfile.id)
        .single();
      if (data?.duty_status) setDutyStatus(data.duty_status);
    }, 5000);
    return () => clearInterval(poll);
  }, [staffProfile?.id]);

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (a) => a.appointment_date === today,
  );
  const completed = appointments.filter((a) => a.status === "Completed").length;
  const pending = appointments.filter(
    (a) =>
      a.status === "Pending" ||
      a.status === "Approved" ||
      a.status === "Assigned",
  ).length;

  const cards = [
    {
      icon: <FiCalendar size={24} color="#3b82f6" />,
      bg: "#dbeafe",
      value: loading ? (
        <Skeleton variant="text" width={50} height={32} />
      ) : (
        todayAppointments.length
      ),
      label: "Today's Appointments",
    },
    {
      icon: <FiCheckCircle size={24} color="#10b981" />,
      bg: "#dcfce7",
      value: loading ? (
        <Skeleton variant="text" width={50} height={32} />
      ) : (
        completed
      ),
      label: "Completed",
    },
    {
      icon: <FiClock size={24} color="#f59e0b" />,
      bg: "#fef3c7",
      value: loading ? (
        <Skeleton variant="text" width={50} height={32} />
      ) : (
        pending
      ),
      label: "Pending",
    },
    {
      icon: <FiUsers size={24} color="#6366f1" />,
      bg: "#e0e7ff",
      value: dutyStatus,
      label: "Current Status",
    },
  ];

  return (
    <Box sx={{ p: 3, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: "#1f2937", mb: 1 }}
        >
          Welcome, {staffProfile?.name}!
        </Typography>
        <Typography variant="body1" sx={{ color: "#6b7280" }}>
          {staffProfile?.role}
          {staffProfile?.specialization
            ? ` • ${staffProfile.specialization}`
            : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
          gap: 3,
        }}
      >
        {cards.map((card, idx) => (
          <Card
            key={idx}
            sx={{
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{ p: 2, borderRadius: "8px", backgroundColor: card.bg }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    {card.label}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
