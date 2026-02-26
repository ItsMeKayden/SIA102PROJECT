import '../styles/Pages.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { FiSearch, FiPlus, FiEdit, FiX, FiTrash2 } from 'react-icons/fi';
import type { Staff, StaffFormData } from '../../types';
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../../backend/services';

function StaffInformation() {
  const { staffProfile, isAdmin } = useAuth();
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    role: '',
    specialization: '',
    status: 'Active',
    email: '',
    phone: '',
  });

  // Fetch staff data on mount
  useEffect(() => {
    fetchStaff();
  }, []);

  // Fetch all staff
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllStaff();
      if (error) {
        showSnackbar(error, 'error');
      } else {
        setStaffData(data || []);
      }
    } catch (err) {
      showSnackbar('Failed to load staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10b981';
      case 'Inactive':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const filteredStaff = staffData.filter((staff) => {
    // If current user is admin, hide other admin accounts
    if (
      isAdmin &&
      staffProfile &&
      staff.user_role === 'admin' &&
      staff.id !== staffProfile.id
    ) {
      return false;
    }
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization =
      specializationFilter === 'all' ||
      staff.specialization === specializationFilter;
    const matchesStatus =
      statusFilter === 'all' || staff.status === statusFilter;
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const handleOpenModal = (mode: 'add' | 'edit') => {
    setModalMode(mode);
    if (mode === 'add') {
      setFormData({
        name: '',
        role: '',
        specialization: '',
        status: 'Active',
        email: '',
        phone: '',
      });
      setSelectedStaffId('');
    } else {
      setSelectedStaffId('');
      setFormData({
        name: '',
        role: '',
        specialization: '',
        status: 'Active',
        email: '',
        phone: '',
      });
    }
    setOpenModal(true);
  };

  const handleStaffSelection = (staffId: string) => {
    const staff = staffData.find((s) => s.id === staffId);
    if (staff) {
      setSelectedStaffId(staffId);
      setFormData({
        name: staff.name,
        role: staff.role,
        specialization: staff.specialization || '',
        status: (staff.status as 'Active' | 'Inactive') || 'Active',
        email: staff.email || '',
        phone: staff.phone || '',
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStaffId('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role || !formData.specialization) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    if (modalMode === 'add') {
      const { data, error } = await createStaff(formData);
      if (error) {
        showSnackbar(error, 'error');
      } else {
        showSnackbar('Staff member added successfully', 'success');
        fetchStaff();
        handleCloseModal();
      }
    } else {
      const { data, error } = await updateStaff(selectedStaffId, formData);
      if (error) {
        showSnackbar(error, 'error');
      } else {
        showSnackbar('Staff member updated successfully', 'success');
        fetchStaff();
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      // Optimistic update - remove from UI immediately
      setStaffData((prevStaff) => prevStaff.filter((staff) => staff.id !== id));

      const { error } = await deleteStaff(id);
      if (error) {
        showSnackbar(error, 'error');
        // Revert optimistic update on error
        fetchStaff();
      } else {
        showSnackbar('Staff member deleted successfully', 'success');
      }
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: { xs: '16px', sm: '20px', md: '24px' },
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              Staff Profile
            </h2>

            <Box
              sx={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <TextField
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  flex: '1 1 180px',
                  minWidth: '150px',
                  maxWidth: '280px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSearch
                        style={{ color: '#6b7280', fontSize: '16px' }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl
                size="small"
                sx={{
                  minWidth: 120,
                  maxWidth: 160,
                  flex: '0 1 auto',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                }}
              >
                <Select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: '6px', fontSize: '14px' }}
                >
                  <MenuItem value="all">All Specializations</MenuItem>
                  <MenuItem value="Pharmacy">Pharmacy</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                  <MenuItem value="Surgery">Surgery</MenuItem>
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{
                  minWidth: 100,
                  maxWidth: 140,
                  flex: '0 1 auto',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginRight: '12px',
                }}
              >
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: '6px', fontSize: '14px' }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<FiPlus size={16} />}
                  onClick={() => handleOpenModal('add')}
                  sx={{
                    backgroundColor: '#3b82f6',
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '6px 16px',
                    fontSize: '13px',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    },
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FiEdit size={16} />}
                  onClick={() => handleOpenModal('edit')}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#4b5563',
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '6px 16px',
                    fontSize: '13px',
                    '&:hover': {
                      borderColor: '#9ca3af',
                      backgroundColor: '#f9fafb',
                    },
                  }}
                >
                  Edit
                </Button>
              </Box>
            </Box>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              border: '1px solid #e5e7eb',
              width: '100%',
              overflowX: 'auto',
            }}
          >
            <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '8%',
                      padding: '10px 8px',
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '20%',
                      padding: '10px 8px',
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '15%',
                      padding: '10px 8px',
                    }}
                  >
                    Role
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '15%',
                      padding: '10px 8px',
                    }}
                  >
                    Specialization
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '20%',
                      padding: '10px 8px',
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '12%',
                      padding: '10px 8px',
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: '12px',
                      width: '10%',
                      padding: '10px 8px',
                      textAlign: 'center',
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow
                    key={staff.id}
                    sx={{
                      '&:hover': { backgroundColor: '#f9fafb' },
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        padding: '10px 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {staff.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#1f2937',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '10px 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {staff.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '12px',
                        padding: '10px 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {staff.role}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '12px',
                        padding: '10px 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {staff.specialization || 'N/A'}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: '#6b7280',
                        fontSize: '11px',
                        padding: '10px 8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {staff.email || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ padding: '10px 8px' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Box
                          sx={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(staff.status),
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: '#6b7280',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {staff.status}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ padding: '10px 8px', textAlign: 'center' }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(staff.id, staff.name)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': { backgroundColor: '#fee2e2' },
                        }}
                      >
                        <FiTrash2 size={14} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStaff.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: '#9ca3af' }}
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
            onClose={handleCloseModal}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '12px',
                margin: '16px',
                width: 'calc(100% - 32px)',
                maxWidth: '500px',
              },
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                fontSize: '18px',
                fontWeight: 600,
                color: '#1f2937',
              }}
            >
              {modalMode === 'add' ? 'Add New Staff' : 'Edit Staff'}
              <IconButton onClick={handleCloseModal} size="small">
                <FiX />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Staff Selection Dropdown - Only in Edit Mode */}
                {modalMode === 'edit' && (
                  <Box>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#374151',
                      }}
                    >
                      Select Staff to Edit
                    </label>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedStaffId}
                        onChange={(e) => handleStaffSelection(e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: '6px' }}
                      >
                        <MenuItem value="" disabled>
                          <em>Choose a staff member</em>
                        </MenuItem>
                        {staffData.map((staff) => (
                          <MenuItem key={staff.id} value={staff.id}>
                            {staff.name} - {staff.role}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Full Name
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={modalMode === 'edit' && !selectedStaffId}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Role
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      displayEmpty
                      disabled={modalMode === 'edit' && !selectedStaffId}
                      sx={{ borderRadius: '6px' }}
                    >
                      <MenuItem value="">Select role</MenuItem>
                      <MenuItem value="Doctor">Doctor</MenuItem>
                      <MenuItem value="Nurse">Nurse</MenuItem>
                      <MenuItem value="Receptionist">Receptionist</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Specialization
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      displayEmpty
                      disabled={modalMode === 'edit' && !selectedStaffId}
                      sx={{ borderRadius: '6px' }}
                    >
                      <MenuItem value="">Select specialization</MenuItem>
                      <MenuItem value="Pharmacy">Pharmacy</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                      <MenuItem value="Surgery">Surgery</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Status
                  </label>
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'Active' | 'Inactive',
                        })
                      }
                      disabled={modalMode === 'edit' && !selectedStaffId}
                      sx={{ borderRadius: '6px' }}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Email
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="staff@clinika.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={modalMode === 'edit' && !selectedStaffId}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                      },
                    }}
                  />
                </Box>

                <Box>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                    }}
                  >
                    Phone (Optional)
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="tel"
                    placeholder="555-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={modalMode === 'edit' && !selectedStaffId}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                      },
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1 }}>
              <Button
                onClick={handleCloseModal}
                sx={{
                  textTransform: 'none',
                  color: '#6b7280',
                  fontWeight: 500,
                  fontSize: '14px',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={modalMode === 'edit' && !selectedStaffId}
                sx={{
                  backgroundColor: '#3b82f6',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px',
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  },
                  '&:disabled': {
                    backgroundColor: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                {modalMode === 'add' ? 'Add Staff' : 'Save Changes'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({ doctor }: { doctor: Doctor }) {
  const status = getStatus(doctor.availableSlots);
  const { label, bg, color } = statusConfig[status];
  const avatarColor = getAvatarColor(doctor.department);
  const initials = getInitials(doctor.doctor_name);
  const joinDate = new Date(doctor.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 12px 12px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.07)',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
    >
      <button
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#bbb',
          fontSize: 18,
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ⋮
      </button>

      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initials}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>
          {doctor.doctor_name}
        </div>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 5 }}>
          {doctor.department}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            background: bg,
            color,
            padding: '2px 10px',
            borderRadius: 20,
            display: 'inline-block',
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', margin: '10px 0 8px' }} />

      <div style={{ fontSize: 10, color: '#555' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
          }}
        >
          <span style={{ flexShrink: 0 }}>✉</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doctor.email_address}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 4,
          }}
        >
          <span style={{ flexShrink: 0 }}>📞</span>
          <span>{doctor.contact_number}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ flexShrink: 0 }}>🕐</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doctor.workingHours}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0 6px' }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10,
          gap: 4,
        }}
      >
        <span style={{ color: '#aaa', whiteSpace: 'nowrap' }}>
          Date of Joining
        </span>
        <span style={{ color: '#444', fontWeight: 600, textAlign: 'right' }}>
          {joinDate}
        </span>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 280 }}
    >
      <span
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#aaa',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        🔍
      </span>
      <input
        type="text"
        placeholder="Search staff..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 30px 6px 32px',
          fontSize: 13,
          color: '#333',
          outline: 'none',
          height: 34,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#aaa',
            fontSize: 13,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  search,
  onSearch,
  filter,
  onFilter,
  departments,
  onAddStaff,
}: {
  search: string;
  onSearch: (v: string) => void;
  filter: string;
  onFilter: (v: string) => void;
  departments: string[];
  onAddStaff: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <button style={navBtn}>‹</button>
      <button style={navBtn}>›</button>

      <button
        style={{
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          color: '#333',
        }}
      >
        New <span style={{ fontSize: 10 }}>▾</span>
      </button>

      <SearchBar value={search} onChange={onSearch} />

      <div style={{ flex: 1 }} />

      <select
        value={filter}
        onChange={(e) => onFilter(e.target.value)}
        style={{
          background: '#fff',
          border: '1px solid #dce0f0',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          cursor: 'pointer',
          color: '#333',
          appearance: 'none',
          WebkitAppearance: 'none',
          minWidth: 120,
          height: 34,
        }}
      >
        {departments.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <button
        onClick={onAddStaff}
        style={{
          background: '#2563EB',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '7px 16px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          whiteSpace: 'nowrap',
          height: 34,
        }}
      >
        + Add Staff
      </button>
    </div>
  );
}

// ─── Staff Grid ───────────────────────────────────────────────────────────────

function StaffGrid({ doctors }: { doctors: Doctor[] }) {
  if (doctors.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: '#aaa',
          padding: 40,
          fontSize: 14,
        }}
      >
        No staff found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {doctors.map((doctor) => (
        <div
          key={doctor.doctorID}
          style={{
            flex: '0 0 calc(20% - 10px)',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <StaffCard doctor={doctor} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function StaffInformation() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All Members');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await fetchDoctors();
      if (error) setError(error);
      else setDoctors(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleNewDoctor(doctor: Doctor) {
    setDoctors((prev) => [...prev, doctor]);
  }

  const departments = [
    'All Members',
    ...Array.from(new Set(doctors.map((d) => d.department))),
  ];

  const filtered = doctors.filter((d) => {
    const matchesDept = filter === 'All Members' || d.department === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.doctor_name.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q) ||
      d.email_address.toLowerCase().includes(q) ||
      d.contact_number.includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div
      style={{
        background: '#EEF2FB',
        minHeight: '100vh',
        padding: 20,
        fontFamily: "'Segoe UI', 'DM Sans', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <Toolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        departments={departments}
        onAddStaff={() => setShowModal(true)}
      />

      {loading && (
        <div
          style={{
            textAlign: 'center',
            color: '#888',
            padding: 40,
            fontSize: 14,
          }}
        >
          Loading staff data...
        </div>
      )}

      {error && (
        <div
          style={{
            textAlign: 'center',
            color: '#C62828',
            background: '#FFEBEE',
            borderRadius: 10,
            padding: '16px 20px',
            fontSize: 13,
          }}
        >
          ⚠️ Failed to load data: {error}
        </div>
      )}

      {!loading && !error && <StaffGrid doctors={filtered} />}

      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onSuccess={handleNewDoctor}
        />
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dce0f0',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  color: '#555',
  padding: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#444',
  marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #dce0f0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#333',
  outline: 'none',
  background: '#fff',
};

export default StaffInformation;
