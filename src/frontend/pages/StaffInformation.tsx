import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
  Typography,
} from "@mui/material";
import { FiSearch, FiX, FiTrash2, FiEdit2, FiEye } from "react-icons/fi";
import type { Staff, StaffFormData } from "../../types";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../../backend/services/staffService";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getAllDepartments,
  getAllDepartmentsWithIds,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllSpecializationsWithIds,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getSpecializations,
  type Service,
  type ServiceFormData,
  type Department,
  type SpecializationRecord,
  type SpecializationFormData,
} from "../../backend/services/serviceServices";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const EMPTY_SERVICE_FORM: ServiceFormData = {
  name: "",
  department: "",
  specialization: "",
  duration: "",
  price: 0,
  downpayment: 0,
  status: "Available",
  description: "",
};

const fieldLabel = (text: string, required = false) => (
  <label
    style={{
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: 500,
      color: "#374151",
    }}
  >
    {text}
    {required && " *"}
  </label>
);

// ─── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab() {
  const { staffProfile, isAdmin } = useAuth();

  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [allSpecializations, setAllSpecializations] = useState<string[]>([]);
  const [filteredSpecializations, setFilteredSpecializations] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    staff: Staff | null;
  }>({
    open: false,
    staff: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    role: "",
    specialization: "",
    department: "",
    status: "Active",
    email: "",
    phone: "",
  });

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: staffRes, error: staffErr },
        { data: deptRes },
        { data: specRes },
      ] = await Promise.all([
        getAllStaff(),
        getAllDepartments(),
        getSpecializations(),
      ]);
      if (staffErr) showSnackbar(staffErr, "error");
      else setStaffData(staffRes || []);
      setDepartments(deptRes || []);
      setAllSpecializations(specRes || []);
    } catch {
      showSnackbar("Failed to load staff data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (formData.department) {
      getSpecializations(formData.department).then(({ data }) => {
        setFilteredSpecializations(data || []);
      });
    } else {
      setFilteredSpecializations([]);
    }
  }, [formData.department]);

  const getStatusColor = (status: string) =>
    status === "Active" ? "#10b981" : "#6b7280";
  const getDutyStatusColor = (dutyStatus: string | null | undefined) => {
    if (dutyStatus === "On Duty") return "#3b82f6";
    if (dutyStatus === "On Leave") return "#f59e0b";
    return "#9ca3af";
  };

  const filteredStaff = staffData.filter((staff) => {
    if (
      isAdmin &&
      staffProfile &&
      staff.user_role === "admin" &&
      staff.id !== staffProfile.id
    )
      return false;
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.staffid ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization =
      specializationFilter === "all" ||
      staff.specialization === specializationFilter;
    const matchesStatus =
      statusFilter === "all" || staff.status === statusFilter;
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const handleOpenModal = (mode: "add" | "edit") => {
    setModalMode(mode);
    setSelectedStaffId("");
    setFormData({
      name: "",
      role: "",
      specialization: "",
      department: "",
      status: "Active",
      email: "",
      phone: "",
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role || !formData.specialization) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }
    if (!formData.email || !formData.email.includes("@")) {
      showSnackbar("Please enter a valid email address", "error");
      return;
    }
    if (modalMode === "add") {
      const { error } = await createStaff(formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Staff member added successfully", "success");
        fetchStaff();
        setOpenModal(false);
      }
    } else {
      const { error } = await updateStaff(selectedStaffId, formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Staff member updated successfully", "success");
        fetchStaff();
        setOpenModal(false);
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    const targetStaff = staffData.find((s) => s.id === id);
    if (targetStaff?.user_role === "admin") {
      showSnackbar("Admin accounts cannot be deleted.", "error");
      return;
    }
    setDeleteConfirm({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });
    setStaffData((prev) => prev.filter((s) => s.id !== id));
    const { error } = await deleteStaff(id);
    if (error) {
      showSnackbar(error, "error");
      fetchStaff();
    } else showSnackbar("Staff member deleted successfully", "success");
  };

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

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: "1 1 180px",
            minWidth: "150px",
            maxWidth: "280px",
            backgroundColor: "white",
            borderRadius: "6px",
            "& .MuiOutlinedInput-root": { borderRadius: "6px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: "#6b7280", fontSize: "16px" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            maxWidth: 160,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
          }}
        >
          <Select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Specializations</MenuItem>
            {allSpecializations.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          sx={{
            minWidth: 100,
            maxWidth: 140,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
            mr: "12px",
          }}
        >
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button
          onClick={() => handleOpenModal("add")}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#2563EB",
            fontWeight: 600,
            fontSize: "14px",
            ml: "auto",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          + Add Staff
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "8px",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: "1px solid #e5e7eb",
          overflowX: "auto",
          maxHeight: "460px",
          overflow: "auto",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              {["ID", "Name", "Role", "Status / Duty", "Actions"].map(
                (h, i) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "12px",
                      padding: "10px 8px",
                      width: ["15%", "20%", "15%", "12%", "10%"][i],
                      textAlign: h === "Actions" ? "center" : "left",
                    }}
                  >
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((staff) => (
              <TableRow
                key={staff.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <TableCell
                  sx={{
                    color: "#6b7280",
                    fontSize: "11px",
                    padding: "10px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {staff.staffid ?? staff.id.substring(0, 8) + "..."}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "10px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {staff.name}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#6b7280",
                    fontSize: "12px",
                    padding: "10px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {staff.role}
                </TableCell>
                <TableCell sx={{ padding: "10px 8px" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: getStatusColor(staff.status),
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "11px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {staff.status}
                      </span>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: getDutyStatusColor(
                            staff.duty_status,
                          ),
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: "11px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {staff.duty_status || "Off Duty"}
                      </span>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "10px 8px", textAlign: "center" }}>
                  <Box
                    sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setViewModal({ open: true, staff })}
                      sx={{
                        color: "#3b82f6",
                        "&:hover": { backgroundColor: "#dbeafe" },
                      }}
                      title="View Staff Info"
                    >
                      <FiEye size={14} />
                    </IconButton>
                    {staff.user_role !== "admin" ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(staff.id, staff.name)}
                        sx={{
                          color: "#ef4444",
                          "&:hover": { backgroundColor: "#fee2e2" },
                        }}
                      >
                        <FiTrash2 size={14} />
                      </IconButton>
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: "11px" }}>
                        —
                      </span>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredStaff.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 4, color: "#9ca3af" }}
                >
                  No staff members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            margin: "16px",
            width: "calc(100% - 32px)",
            maxWidth: "500px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontSize: "18px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {modalMode === "add" ? "Add New Staff" : "Edit Staff"}
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {[
              {
                label: "Full Name",
                key: "name",
                type: "text",
                placeholder: "Enter full name",
              },
              {
                label: "Email",
                key: "email",
                type: "email",
                placeholder: "staff@clinika.com",
                disableOnEdit: true,
              },
              {
                label: "Phone (Optional)",
                key: "phone",
                type: "tel",
                placeholder: "555-0000",
              },
            ].map(({ label, key, type, placeholder, disableOnEdit }) => (
              <Box key={key}>
                {fieldLabel(label)}
                <TextField
                  fullWidth
                  size="small"
                  type={type}
                  placeholder={placeholder}
                  value={formData[key as keyof StaffFormData]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  disabled={modalMode === "edit" && !!disableOnEdit}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
            ))}
            <Box>
              {fieldLabel("Role")}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  displayEmpty
                  sx={{ borderRadius: "6px" }}
                >
                  <MenuItem value="">Select role</MenuItem>
                  {["Doctor", "Nurse", "Receptionist"].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              {fieldLabel("Department")}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department: e.target.value,
                      specialization: "",
                    })
                  }
                  displayEmpty
                  sx={{ borderRadius: "6px" }}
                >
                  <MenuItem value="">Select department</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              {fieldLabel("Specialization")}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  displayEmpty
                  sx={{ borderRadius: "6px" }}
                >
                  <MenuItem value="">
                    {formData.department
                      ? "Select specialization"
                      : "Select department first"}
                  </MenuItem>
                  {filteredSpecializations.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {modalMode === "add" ? "Add Staff" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirm.open}
        name={deleteConfirm.name}
        title="Delete Staff Member"
        onClose={() => setDeleteConfirm({ open: false, id: "", name: "" })}
        onConfirm={handleConfirmDelete}
      />

      {/* Staff Info Card Modal */}
      <Dialog
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, staff: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            maxWidth: "360px",
            overflow: "hidden",
          },
        }}
      >
        {viewModal.staff && (
          <>
            {/* Header with back arrow and close */}
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            >
              <IconButton
                onClick={() => setViewModal({ open: false, staff: null })}
                size="small"
              >
                <FiX size={18} color="#374151" />
              </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pt: 1, pb: 0 }}>
              {/* Avatar */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: 92,
                    height: 92,
                    borderRadius: "50%",
                    border: "3px solid #e0eaff",
                    mb: 1.5,
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(viewModal.staff as any).avatar_url ? (
                    <img
                      src={(viewModal.staff as any).avatar_url}
                      alt={viewModal.staff.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "36px",
                        fontWeight: 700,
                        color: "#2563eb",
                      }}
                    >
                      {viewModal.staff.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Box>

                {/* Name + Role */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "18px",
                    color: "#111827",
                    lineHeight: 1.2,
                  }}
                >
                  {viewModal.staff.name}
                </Typography>
                <Typography
                  sx={{ fontSize: "13px", color: "#6b7280", mt: 0.3 }}
                >
                  {viewModal.staff.role}
                </Typography>

                {/* Status badge */}
                <Box
                  sx={{
                    mt: 1.2,
                    px: 2,
                    py: 0.4,
                    borderRadius: "20px",
                    backgroundColor:
                      viewModal.staff.status === "Active"
                        ? "#10b981"
                        : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "white",
                    }}
                  />
                  <Typography
                    sx={{ fontSize: "12px", fontWeight: 600, color: "white" }}
                  >
                    {viewModal.staff.status}
                  </Typography>
                </Box>

                {/* Full ID below status */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    mt: 1.5,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      fontFamily: "monospace",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {viewModal.staff.staffid ?? viewModal.staff.id}
                  </Typography>
                </Box>
              </Box>

              {/* Divider */}
              <Box
                sx={{
                  height: "1px",
                  backgroundColor: "#f3f4f6",
                  mx: -3,
                  mb: 2,
                }}
              />

              {/* Info rows */}
              {[
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  ),
                  label: "Staff ID",
                  value: viewModal.staff.staffid ?? viewModal.staff.id,
                },
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: "Email",
                  value: viewModal.staff.email || "—",
                },
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  ),
                  label: "Specialization",
                  value: viewModal.staff.specialization || "—",
                },
                {
                  icon: (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                  label: "Department",
                  value: viewModal.staff.department || "—",
                },
              ].map(({ icon, label, value }) => (
                <Box key={label} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.4,
                    }}
                  >
                    {icon}
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#6b7280",
                      pl: "24px",
                      wordBreak: "break-all",
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}

              {/* Divider */}
              <Box
                sx={{
                  height: "1px",
                  backgroundColor: "#f3f4f6",
                  mx: -3,
                  mb: 2,
                }}
              />

              {/* Last attendance & total days */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                    Last attendance:{" "}
                    <span style={{ color: "#374151", fontWeight: 500 }}>
                      {viewModal.staff.duty_status === "On Duty"
                        ? "Currently on duty"
                        : "N/A"}
                    </span>
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                    Duty status:{" "}
                    <span style={{ color: "#374151", fontWeight: 500 }}>
                      {viewModal.staff.duty_status || "Off Duty"}
                    </span>
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            {/* Bottom action buttons */}
            <Box
              sx={{ display: "flex", borderTop: "1px solid #f3f4f6", mt: 1 }}
            >
              {/* Edit button */}
              <Button
                onClick={() => {
                  setViewModal({ open: false, staff: null });
                  setModalMode("edit");
                  setSelectedStaffId(viewModal.staff!.id);
                  setFormData({
                    name: viewModal.staff!.name,
                    role: viewModal.staff!.role,
                    specialization: viewModal.staff!.specialization || "",
                    department: viewModal.staff!.department || "",
                    status:
                      (viewModal.staff!.status as "Active" | "Inactive") ||
                      "Active",
                    email: viewModal.staff!.email || "",
                    phone: viewModal.staff!.phone || "",
                  });
                  setOpenModal(true);
                }}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                  backgroundColor: "white",
                  borderRadius: 0,
                  borderRight: "1px solid #f3f4f6",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { backgroundColor: "#eff6ff" },
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </Button>

              {/* Activate / Deactivate button */}
              <Button
                onClick={async () => {
                  const staff = viewModal.staff!;
                  const newStatus =
                    staff.status === "Active" ? "Inactive" : "Active";
                  const updatedStaff = { ...staff, status: newStatus };
                  setViewModal({ open: true, staff: updatedStaff });
                  setStaffData((prev) =>
                    prev.map((s) =>
                      s.id === staff.id ? { ...s, status: newStatus } : s,
                    ),
                  );
                  const { error } = await updateStaff(staff.id, {
                    name: staff.name,
                    role: staff.role,
                    specialization: staff.specialization || "",
                    department: staff.department || "",
                    status: newStatus as "Active" | "Inactive",
                    email: staff.email || "",
                    phone: staff.phone || "",
                  });
                  if (error) {
                    setViewModal({ open: true, staff });
                    setStaffData((prev) =>
                      prev.map((s) =>
                        s.id === staff.id ? { ...s, status: staff.status } : s,
                      ),
                    );
                    showSnackbar(error, "error");
                  } else {
                    showSnackbar(
                      `Staff member ${newStatus === "Active" ? "activated" : "deactivated"} successfully`,
                      "success",
                    );
                  }
                }}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  color:
                    viewModal.staff!.status === "Active"
                      ? "#ef4444"
                      : "#10b981",
                  backgroundColor: "white",
                  borderRadius: 0,
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": {
                    backgroundColor:
                      viewModal.staff!.status === "Active"
                        ? "#fef2f2"
                        : "#f0fdf4",
                  },
                }}
              >
                {viewModal.staff!.status === "Active" ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Deactivate
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Activate
                  </>
                )}
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      <AppSnackbar
        snackbar={snackbar}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
}

// ─── Services Tab ─────────────────────────────────────────────────────────────
function ServicesTab() {
  const { isAdmin } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [allSpecializations, setAllSpecializations] = useState<string[]>([]);
  const [filteredSpecializations, setFilteredSpecializations] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_SERVICE_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: svcRes, error: svcErr },
        { data: deptRes },
        { data: specRes },
      ] = await Promise.all([
        getAllServices(),
        getAllDepartments(),
        getSpecializations(),
      ]);
      if (svcErr) showSnackbar(svcErr, "error");
      else setServices(svcRes || []);
      setDepartments(deptRes || []);
      setAllSpecializations(specRes || []);
    } catch {
      showSnackbar("Failed to load services", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (formData.department) {
      getSpecializations(formData.department).then(({ data }) =>
        setFilteredSpecializations(data || []),
      );
    } else {
      setFilteredSpecializations([]);
    }
  }, [formData.department]);

  if (!isAdmin)
    return (
      <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
        You don't have permission to view this section.
      </Box>
    );
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

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.specialization ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === "all" || s.department === departmentFilter;
    const matchesSpec =
      specializationFilter === "all" ||
      s.specialization === specializationFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesSpec && matchesStatus;
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData(EMPTY_SERVICE_FORM);
    setEditingService(null);
    setOpenModal(true);
  };
  const openEditModal = (service: Service) => {
    setModalMode("edit");
    setEditingService(service);
    setFormData({
      name: service.name,
      department: service.department || "",
      specialization: service.specialization || "",
      duration: service.duration,
      price: service.price,
      downpayment: service.downpayment,
      status: service.status,
      description: service.description || "",
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.duration) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }
    if (formData.price < 0) {
      showSnackbar("Price must be a positive number", "error");
      return;
    }
    if (modalMode === "add") {
      const { error } = await createService(formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Service added successfully", "success");
        fetchServices();
        setOpenModal(false);
      }
    } else if (editingService) {
      const { error } = await updateService(editingService.id, formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Service updated successfully", "success");
        fetchServices();
        setOpenModal(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });
    setServices((prev) => prev.filter((s) => s.id !== id));
    const { error } = await deleteService(id);
    if (error) {
      showSnackbar(error, "error");
      fetchServices();
    } else showSnackbar("Service deleted successfully", "success");
  };

  const getServiceStatusColor = (status: string) =>
    status === "Available" ? "#10b981" : "#6b7280";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: "1 1 180px",
            minWidth: "150px",
            maxWidth: "200px",
            backgroundColor: "white",
            borderRadius: "6px",
            "& .MuiOutlinedInput-root": { borderRadius: "6px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: "#6b7280", fontSize: "16px" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            maxWidth: 150,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
          }}
        >
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          sx={{
            minWidth: 130,
            maxWidth: 160,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
          }}
        >
          <Select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Specializations</MenuItem>
            {allSpecializations.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl
          size="small"
          sx={{
            minWidth: 100,
            maxWidth: 130,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
            mr: "12px",
          }}
        >
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="Available">Available</MenuItem>
            <MenuItem value="Unavailable">Unavailable</MenuItem>
          </Select>
        </FormControl>
        <Button
          onClick={openAddModal}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#2563EB",
            fontWeight: 600,
            fontSize: "14px",
            ml: "auto",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          + Add Service
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "8px",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: "1px solid #e5e7eb",
          overflowX: "auto",
          maxHeight: "460px",
          overflow: "auto",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              {[
                { label: "Name", w: "20%" },
                { label: "Department", w: "12%" },
                { label: "Specialization", w: "12%" },
                { label: "Duration", w: "9%" },
                { label: "Price (₱)", w: "9%" },
                { label: "Downpayment (₱)", w: "11%" },
                { label: "Description", w: "13%" },
                { label: "Status", w: "7%" },
                { label: "Actions", w: "7%", center: true },
              ].map(({ label, w, center }) => (
                <TableCell
                  key={label}
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "12px",
                    padding: "12px 8px",
                    width: w,
                    textAlign: center ? "center" : "left",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((service) => (
              <TableRow
                key={service.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "10px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {service.name}
                </TableCell>
                <TableCell sx={{ padding: "10px 8px" }}>
                  {service.department ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: "4px",
                        px: "6px",
                        py: "2px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {service.department}
                    </Box>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                      All
                    </span>
                  )}
                </TableCell>
                <TableCell sx={{ padding: "10px 8px" }}>
                  {service.specialization ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        backgroundColor: "#f0fdf4",
                        color: "#16a34a",
                        borderRadius: "4px",
                        px: "6px",
                        py: "2px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {service.specialization}
                    </Box>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                      All
                    </span>
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#6b7280",
                    fontSize: "12px",
                    padding: "10px 8px",
                  }}
                >
                  {service.duration}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "10px 8px",
                  }}
                >
                  ₱{service.price.toLocaleString()}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "10px 8px",
                  }}
                >
                  ₱{service.downpayment.toLocaleString()}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#6b7280",
                    fontSize: "11px",
                    padding: "10px 8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {service.description || "—"}
                </TableCell>
                <TableCell sx={{ padding: "10px 8px" }}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: getServiceStatusColor(service.status),
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        color: "#6b7280",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {service.status}
                    </span>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "10px 8px", textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => openEditModal(service)}
                      sx={{
                        color: "#2563eb",
                        "&:hover": { backgroundColor: "#eff6ff" },
                      }}
                    >
                      <FiEdit2 size={13} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          id: service.id,
                          name: service.name,
                        })
                      }
                      sx={{
                        color: "#ef4444",
                        "&:hover": { backgroundColor: "#fee2e2" },
                      }}
                    >
                      <FiTrash2 size={13} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{ py: 4, color: "#9ca3af" }}
                >
                  No services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Service Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            margin: "16px",
            width: "calc(100% - 32px)",
            maxWidth: "500px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontSize: "18px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {modalMode === "add" ? "Add New Service" : "Edit Service"}
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              {fieldLabel("Service Name", true)}
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. General Consultation"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                {fieldLabel("Department")}
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.department ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        specialization: "",
                      })
                    }
                    displayEmpty
                    sx={{ borderRadius: "6px" }}
                  >
                    <MenuItem value="">All departments</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                {fieldLabel("Specialization")}
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!formData.department}
                >
                  <Select
                    value={formData.specialization ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    displayEmpty
                    sx={{ borderRadius: "6px" }}
                  >
                    <MenuItem value="">All specializations</MenuItem>
                    {filteredSpecializations.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                {fieldLabel("Duration", true)}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 30 min"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                {fieldLabel("Price (₱)", true)}
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                {fieldLabel("Downpayment (₱)", true)}
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="0"
                  value={formData.downpayment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      downpayment: parseFloat(e.target.value) || 0,
                    })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
            </Box>
            <Box>
              {fieldLabel("Status")}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "Available" | "Unavailable",
                    })
                  }
                  sx={{ borderRadius: "6px" }}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Unavailable">Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              {fieldLabel("Description (Optional)")}
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Brief description of the service..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {modalMode === "add" ? "Add Service" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirm.open}
        name={deleteConfirm.name}
        title="Delete Service"
        onClose={() => setDeleteConfirm({ open: false, id: "", name: "" })}
        onConfirm={handleConfirmDelete}
      />
      <AppSnackbar
        snackbar={snackbar}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllDepartmentsWithIds();
      if (error) showSnackbar(error, "error");
      else setDepartments(data || []);
    } catch {
      showSnackbar("Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  if (!isAdmin)
    return (
      <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
        You don't have permission to view this section.
      </Box>
    );
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

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openAddModal = () => {
    setModalMode("add");
    setDeptName("");
    setEditingDept(null);
    setOpenModal(true);
  };
  const openEditModal = (dept: Department) => {
    setModalMode("edit");
    setEditingDept(dept);
    setDeptName(dept.name);
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!deptName.trim()) {
      showSnackbar("Department name is required", "error");
      return;
    }
    if (modalMode === "add") {
      const { error } = await createDepartment(deptName.trim());
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Department added successfully", "success");
        fetchDepartments();
        setOpenModal(false);
      }
    } else if (editingDept) {
      const { error } = await updateDepartment(editingDept.id, deptName.trim());
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Department updated successfully", "success");
        fetchDepartments();
        setOpenModal(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    const { error } = await deleteDepartment(id);
    if (error) {
      showSnackbar(error, "error");
      fetchDepartments();
    } else showSnackbar("Department deleted successfully", "success");
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: "1 1 180px",
            minWidth: "150px",
            maxWidth: "280px",
            backgroundColor: "white",
            borderRadius: "6px",
            "& .MuiOutlinedInput-root": { borderRadius: "6px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: "#6b7280", fontSize: "16px" }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          onClick={openAddModal}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#2563EB",
            fontWeight: 600,
            fontSize: "14px",
            ml: "auto",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          + Add Department
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "8px",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: "1px solid #e5e7eb",
          overflowX: "auto",
          maxHeight: "460px",
          overflow: "auto",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              {[
                { label: "#", w: "6%" },
                { label: "Department Name", w: "80%" },
                { label: "Actions", w: "14%", center: true },
              ].map(({ label, w, center }) => (
                <TableCell
                  key={label}
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "12px",
                    padding: "10px 8px",
                    width: w,
                    textAlign: center ? "center" : "left",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((dept, index) => (
              <TableRow
                key={dept.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <TableCell
                  sx={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    padding: "10px 8px",
                  }}
                >
                  {index + 1}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "10px 8px",
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "4px",
                      px: "8px",
                      py: "3px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {dept.name}
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "10px 8px", textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => openEditModal(dept)}
                      sx={{
                        color: "#2563eb",
                        "&:hover": { backgroundColor: "#eff6ff" },
                      }}
                    >
                      <FiEdit2 size={13} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          id: dept.id,
                          name: dept.name,
                        })
                      }
                      sx={{
                        color: "#ef4444",
                        "&:hover": { backgroundColor: "#fee2e2" },
                      }}
                    >
                      <FiTrash2 size={13} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{ py: 4, color: "#9ca3af" }}
                >
                  No departments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            margin: "16px",
            width: "calc(100% - 32px)",
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontSize: "18px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {modalMode === "add" ? "Add Department" : "Edit Department"}
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box>
            {fieldLabel("Department Name", true)}
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Cardiology"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {modalMode === "add" ? "Add Department" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirm.open}
        name={deleteConfirm.name}
        title="Delete Department"
        onClose={() => setDeleteConfirm({ open: false, id: "", name: "" })}
        onConfirm={handleConfirmDelete}
      />
      <AppSnackbar
        snackbar={snackbar}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
}

// ─── Specializations Tab ──────────────────────────────────────────────────────
function SpecializationsTab() {
  const { isAdmin } = useAuth();
  const [specializations, setSpecializations] = useState<
    SpecializationRecord[]
  >([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingSpec, setEditingSpec] = useState<SpecializationRecord | null>(
    null,
  );
  const [formData, setFormData] = useState<SpecializationFormData>({
    name: "",
    department_id: "",
    department_name: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: specRes, error: specErr }, { data: deptRes }] =
        await Promise.all([
          getAllSpecializationsWithIds(),
          getAllDepartmentsWithIds(),
        ]);
      if (specErr) showSnackbar(specErr, "error");
      else setSpecializations(specRes || []);
      setDepartments(deptRes || []);
    } catch {
      showSnackbar("Failed to load specializations", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isAdmin)
    return (
      <Box sx={{ textAlign: "center", py: 6, color: "#9ca3af" }}>
        You don't have permission to view this section.
      </Box>
    );
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

  const filtered = specializations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === "all" || s.department_id === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name: "", department_id: "", department_name: "" });
    setEditingSpec(null);
    setOpenModal(true);
  };
  const openEditModal = (spec: SpecializationRecord) => {
    setModalMode("edit");
    setEditingSpec(spec);
    setFormData({
      name: spec.name,
      department_id: spec.department_id,
      department_name: spec.department,
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Specialization name is required", "error");
      return;
    }
    if (!formData.department_id) {
      showSnackbar("Please select a department", "error");
      return;
    }
    if (modalMode === "add") {
      const { error } = await createSpecialization(formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Specialization added successfully", "success");
        fetchData();
        setOpenModal(false);
      }
    } else if (editingSpec) {
      const { error } = await updateSpecialization(editingSpec.id, formData);
      if (error) showSnackbar(error, "error");
      else {
        showSnackbar("Specialization updated successfully", "success");
        fetchData();
        setOpenModal(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });
    setSpecializations((prev) => prev.filter((s) => s.id !== id));
    const { error } = await deleteSpecialization(id);
    if (error) {
      showSnackbar(error, "error");
      fetchData();
    } else showSnackbar("Specialization deleted successfully", "success");
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search specializations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: "1 1 180px",
            minWidth: "150px",
            maxWidth: "280px",
            backgroundColor: "white",
            borderRadius: "6px",
            "& .MuiOutlinedInput-root": { borderRadius: "6px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: "#6b7280", fontSize: "16px" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            maxWidth: 160,
            flex: "0 1 auto",
            backgroundColor: "white",
            borderRadius: "6px",
            mr: "12px",
          }}
        >
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: "6px", fontSize: "14px" }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={openAddModal}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#2563EB",
            fontWeight: 600,
            fontSize: "14px",
            ml: "auto",
            "&:hover": { backgroundColor: "#1d4ed8" },
          }}
        >
          + Add Specialization
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "8px",
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          border: "1px solid #e5e7eb",
          overflowX: "auto",
          maxHeight: "460px",
          overflow: "auto",
        }}
      >
        <Table stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow>
              {[
                { label: "#", w: "6%" },
                { label: "Specialization Name", w: "45%" },
                { label: "Department", w: "35%" },
                { label: "Actions", w: "14%", center: true },
              ].map(({ label, w, center }) => (
                <TableCell
                  key={label}
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "12px",
                    padding: "10px 8px",
                    width: w,
                    textAlign: center ? "center" : "left",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((spec, index) => (
              <TableRow
                key={spec.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <TableCell
                  sx={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    padding: "10px 8px",
                  }}
                >
                  {index + 1}
                </TableCell>
                <TableCell
                  sx={{
                    color: "#1f2937",
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "10px 8px",
                  }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor: "#f0fdf4",
                      color: "#16a34a",
                      borderRadius: "4px",
                      px: "8px",
                      py: "3px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {spec.name}
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "10px 8px" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      borderRadius: "4px",
                      px: "8px",
                      py: "3px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {spec.department}
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: "10px 8px", textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => openEditModal(spec)}
                      sx={{
                        color: "#2563eb",
                        "&:hover": { backgroundColor: "#eff6ff" },
                      }}
                    >
                      <FiEdit2 size={13} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          id: spec.id,
                          name: spec.name,
                        })
                      }
                      sx={{
                        color: "#ef4444",
                        "&:hover": { backgroundColor: "#fee2e2" },
                      }}
                    >
                      <FiTrash2 size={13} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 4, color: "#9ca3af" }}
                >
                  No specializations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            margin: "16px",
            width: "calc(100% - 32px)",
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontSize: "18px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {modalMode === "add" ? "Add Specialization" : "Edit Specialization"}
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              {fieldLabel("Specialization Name", true)}
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Interventional Cardiology"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                autoFocus
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />
            </Box>
            <Box>
              {fieldLabel("Department", true)}
              <FormControl fullWidth size="small">
                <Select
                  value={formData.department_id}
                  onChange={(e) => {
                    const selected = departments.find(
                      (d) => d.id === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      department_id: e.target.value,
                      department_name: selected?.name ?? "",
                    });
                  }}
                  displayEmpty
                  sx={{ borderRadius: "6px" }}
                >
                  <MenuItem value="">Select department</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            {modalMode === "add" ? "Add Specialization" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirm.open}
        name={deleteConfirm.name}
        title="Delete Specialization"
        onClose={() => setDeleteConfirm({ open: false, id: "", name: "" })}
        onConfirm={handleConfirmDelete}
      />
      <AppSnackbar
        snackbar={snackbar}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  open,
  name,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "18px",
          fontWeight: 600,
          color: "#1f2937",
          pb: 1,
        }}
      >
        {title}
        <IconButton onClick={onClose} size="small">
          <FiX />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: -2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FiTrash2 size={18} color="#ef4444" />
          </Box>
          <Box>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#1f2937",
                fontWeight: 500,
              }}
            >
              Are you sure you want to delete <strong>{name}</strong>?
            </p>
            <p
              style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}
            >
              This action cannot be undone.
            </p>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", color: "#6b7280" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: "#ef4444",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#dc2626" },
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AppSnackbar({
  snackbar,
  onClose,
}: {
  snackbar: { open: boolean; message: string; severity: "success" | "error" };
  onClose: () => void;
}) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}

const TAB_LABELS = [
  "Staff Information",
  "Services",
  "Departments",
  "Specializations",
];
const TAB_TITLES = [
  "Staff Profile",
  "Services",
  "Departments",
  "Specializations",
];

function StaffInformation() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      style={{
        padding: "24px",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          padding: { xs: "16px", sm: "20px", md: "24px" },
        }}
      >
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: "clamp(18px, 4vw, 24px)",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          {TAB_TITLES[activeTab]}
        </h2>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mb: 3,
            borderBottom: "1px solid #e5e7eb",
            minHeight: "40px",
            "& .MuiTabs-indicator": {
              backgroundColor: "#2563EB",
              height: "2px",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "14px",
              minHeight: "40px",
              padding: "8px 16px",
              color: "#6b7280",
              outline: "none",
              "&:focus-visible": { outline: "none" },
              "&.Mui-selected": { color: "#2563EB" },
            },
          }}
        >
          {TAB_LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        {activeTab === 0 && <StaffTab />}
        {activeTab === 1 && <ServicesTab />}
        {activeTab === 2 && <DepartmentsTab />}
        {activeTab === 3 && <SpecializationsTab />}
      </Box>
    </div>
  );
}

export default StaffInformation;
