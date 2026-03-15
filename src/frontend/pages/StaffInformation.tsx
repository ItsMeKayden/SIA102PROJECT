import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
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
} from '@mui/material';
import { FiSearch, FiX, FiTrash2, FiEdit2, FiCode } from 'react-icons/fi';
import type { Staff, StaffFormData } from '../../types';
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../../backend/services/staffService';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getAllDepartments,
  getSpecializations,
  type Service,
  type ServiceFormData,
} from '../../backend/services/serviceServices';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const EMPTY_SERVICE_FORM: ServiceFormData = {
  serviceName: '',
  department: '',
  specialization: '',
  duration: '',
  price: 0,
  downpayment: 0,
  status: 'Available',
  description: '',
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [qrCodeModal, setQrCodeModal] = useState<{
    open: boolean;
    staffId: string;
    staffName: string;
  }>({ open: false, staffId: '', staffName: '' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    role: '',
    specialization: '',
    department: '',
    status: 'Active',
    email: '',
    phone: '',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
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
      if (staffErr) showSnackbar(staffErr, 'error');
      else setStaffData(staffRes || []);
      setDepartments(deptRes || []);
      setAllSpecializations(specRes || []);
    } catch {
      showSnackbar('Failed to load staff data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter specializations when department changes in form
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
    status === 'Active' ? '#10b981' : '#6b7280';
  const getDutyStatusColor = (dutyStatus: string | null | undefined) => {
    if (dutyStatus === 'On Duty') return '#3b82f6';
    if (dutyStatus === 'On Leave') return '#f59e0b';
    return '#9ca3af';
  };

  const filteredStaff = staffData.filter((staff) => {
    if (
      isAdmin &&
      staffProfile &&
      staff.user_role === 'admin' &&
      staff.id !== staffProfile.id
    )
      return false;
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
    setSelectedStaffId('');
    setFormData({
      name: '',
      role: '',
      specialization: '',
      department: '',
      status: 'Active',
      email: '',
      phone: '',
    });
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
        department: staff.department || '',
        status: (staff.status as 'Active' | 'Inactive') || 'Active',
        email: staff.email || '',
        phone: staff.phone || '',
      });
    }
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
      const { error } = await createStaff(formData);
      if (error) showSnackbar(error, 'error');
      else {
        showSnackbar('Staff member added successfully', 'success');
        fetchStaff();
        setOpenModal(false);
      }
    } else {
      const { error } = await updateStaff(selectedStaffId, formData);
      if (error) showSnackbar(error, 'error');
      else {
        showSnackbar('Staff member updated successfully', 'success');
        fetchStaff();
        setOpenModal(false);
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    const targetStaff = staffData.find((s) => s.id === id);
    if (targetStaff?.user_role === 'admin') {
      showSnackbar('Admin accounts cannot be deleted.', 'error');
      return;
    }
    setDeleteConfirm({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: '', name: '' });
    setStaffData((prev) => prev.filter((s) => s.id !== id));
    const { error } = await deleteStaff(id);
    if (error) {
      showSnackbar(error, 'error');
      fetchStaff();
    } else showSnackbar('Staff member deleted successfully', 'success');
  };

  const handleGenerateQRCode = (staffId: string, staffName: string) => {
    setQrCodeModal({ open: true, staffId, staffName });
  };

  if (loading)
    return (
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
    );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2,
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
            '& .MuiOutlinedInput-root': { borderRadius: '6px' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: '#6b7280', fontSize: '16px' }} />
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
            flex: '0 1 auto',
            backgroundColor: 'white',
            borderRadius: '6px',
            mr: '12px',
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
        <Button
          onClick={() => handleOpenModal('add')}
          variant="contained"
          sx={{
            textTransform: 'none',
            backgroundColor: '#2563EB',
            fontWeight: 600,
            fontSize: '14px',
            ml: 'auto',
            '&:hover': { backgroundColor: '#1d4ed8' },
          }}
        >
          + Add Staff
        </Button>
        <Button
          onClick={() => handleOpenModal('edit')}
          variant="outlined"
          sx={{
            textTransform: 'none',
            borderColor: '#d1d5db',
            color: '#4b5563',
            fontWeight: 600,
            fontSize: '14px',
            '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
          }}
        >
          Edit Staff
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
          maxHeight: '460px',
          overflow: 'auto',
        }}
      >
        <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {[
                'ID',
                'Name',
                'Role',
                'Specialization',
                'Department',
                'Email',
                'Status / Duty',
                'Actions',
              ].map((h, i) => (
                <TableCell
                  key={h}
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '12px',
                    padding: '10px 8px',
                    width: [
                      '8%',
                      '20%',
                      '15%',
                      '15%',
                      '15%',
                      '20%',
                      '12%',
                      '10%',
                    ][i],
                    textAlign: h === 'Actions' ? 'center' : 'left',
                  }}
                >
                  {h}
                </TableCell>
              ))}
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
                    fontSize: '12px',
                    padding: '10px 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {staff.department || 'N/A'}
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
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
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
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: getDutyStatusColor(
                            staff.duty_status,
                          ),
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
                        {staff.duty_status || 'Off Duty'}
                      </span>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '10px 8px', textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {staff.user_role !== 'admin' && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleGenerateQRCode(staff.id, staff.name)
                        }
                        sx={{
                          color: '#3b82f6',
                          '&:hover': { backgroundColor: '#dbeafe' },
                        }}
                        title="Generate QR Code"
                      >
                        <FiCode size={14} />
                      </IconButton>
                    )}
                    {staff.user_role !== 'admin' ? (
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
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '11px' }}>
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
        onClose={() => setOpenModal(false)}
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
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                    {staffData.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} - {s.role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            {[
              {
                label: 'Full Name',
                key: 'name',
                type: 'text',
                placeholder: 'Enter full name',
              },
              {
                label: 'Email',
                key: 'email',
                type: 'email',
                placeholder: 'staff@clinika.com',
                disableOnEdit: true,
              },
              {
                label: 'Phone (Optional)',
                key: 'phone',
                type: 'tel',
                placeholder: '555-0000',
              },
            ].map(({ label, key, type, placeholder, disableOnEdit }) => (
              <Box key={key}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  {label}
                </label>
                <TextField
                  fullWidth
                  size="small"
                  type={type}
                  placeholder={placeholder}
                  value={formData[key as keyof StaffFormData]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  disabled={
                    (modalMode === 'edit' && !selectedStaffId) ||
                    (modalMode === 'edit' && !!disableOnEdit)
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />
              </Box>
            ))}

            {/* Role */}
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
                  {['Doctor', 'Nurse', 'Receptionist'].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Department — dynamic from staff table */}
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
                Department
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department: e.target.value,
                      specialization: '',
                    })
                  }
                  displayEmpty
                  disabled={modalMode === 'edit' && !selectedStaffId}
                  sx={{ borderRadius: '6px' }}
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

            {/* Specialization — filtered by selected department */}
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
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  displayEmpty
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="">
                    {formData.department
                      ? 'Select specialization'
                      : 'Select department first'}
                  </MenuItem>
                  {filteredSpecializations.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Status */}
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
                  displayEmpty
                  disabled={modalMode === 'edit' && !selectedStaffId}
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="">Select status</MenuItem>
                  {['Active', 'Inactive'].map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
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
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#2563EB',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#1d4ed8' },
            }}
          >
            {modalMode === 'add' ? 'Add Staff' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
            pb: 1,
          }}
        >
          Delete Staff Member
          <IconButton
            onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}
            size="small"
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: -2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiTrash2 size={18} color="#ef4444" />
            </Box>
            <Box>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: 500,
                }}
              >
                Are you sure you want to delete{' '}
                <strong>{deleteConfirm.name}</strong>?
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: '#6b7280',
                }}
              >
                This action cannot be undone.
              </p>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#ef4444',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog
        open={qrCodeModal.open}
        onClose={() => setQrCodeModal({ open: false, staffId: '', staffName: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
            pb: 2,
          }}
        >
          Staff QR Code
          <IconButton
            onClick={() =>
              setQrCodeModal({ open: false, staffId: '', staffName: '' })
            }
            size="small"
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
            }}
            id="staff-qr-code"
          >
            <QRCodeSVG
              value={qrCodeModal.staffId}
              size={256}
              level="H"
              includeMargin={true}
            />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                color: '#1f2937',
                fontWeight: 500,
              }}
            >
              {qrCodeModal.staffName}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              Staff ID: {qrCodeModal.staffId}
            </p>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() =>
              setQrCodeModal({ open: false, staffId: '', staffName: '' })
            }
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Close
          </Button>

        </DialogActions>
      </Dialog>

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
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(EMPTY_SERVICE_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
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
      if (svcErr) showSnackbar(svcErr, 'error');
      else setServices(svcRes || []);
      setDepartments(deptRes || []);
      setAllSpecializations(specRes || []);
    } catch {
      showSnackbar('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter specializations when department changes in modal form
  useEffect(() => {
    if (formData.department) {
      getSpecializations(formData.department).then(({ data }) => {
        setFilteredSpecializations(data || []);
      });
    } else {
      setFilteredSpecializations([]);
    }
  }, [formData.department]);

  if (!isAdmin)
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9ca3af' }}>
        You don't have permission to view this section.
      </Box>
    );

  if (loading)
    return (
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
    );

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.specialization ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === 'all' || s.department === departmentFilter;
    const matchesSpec =
      specializationFilter === 'all' ||
      s.specialization === specializationFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesSpec && matchesStatus;
  });

  const openAddModal = () => {
    setModalMode('add');
    setFormData(EMPTY_SERVICE_FORM);
    setEditingService(null);
    setOpenModal(true);
  };

  const openEditModal = (service: Service) => {
    setModalMode('edit');
    setEditingService(service);
    setFormData({
      serviceName: service.serviceName,
      department: service.department || '',
      specialization: service.specialization || '',
      duration: service.duration,
      price: service.price,
      downpayment: service.downpayment,
      status: service.status,
      description: service.description || '',
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.serviceName || !formData.duration) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    if (formData.price < 0) {
      showSnackbar('Price must be a positive number', 'error');
      return;
    }
    if (modalMode === 'add') {
      const { error } = await createService(formData);
      if (error) showSnackbar(error, 'error');
      else {
        showSnackbar('Service added successfully', 'success');
        fetchServices();
        setOpenModal(false);
      }
    } else if (editingService) {
      const { error } = await updateService(editingService.serviceID, formData);
      if (error) showSnackbar(error, 'error');
      else {
        showSnackbar('Service updated successfully', 'success');
        fetchServices();
        setOpenModal(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: '', name: '' });
    setServices((prev) => prev.filter((s) => s.serviceID !== id));
    const { error } = await deleteService(id);
    if (error) {
      showSnackbar(error, 'error');
      fetchServices();
    } else showSnackbar('Service deleted successfully', 'success');
  };

  const getServiceStatusColor = (status: string) =>
    status === 'Available' ? '#10b981' : '#6b7280';

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: '1 1 180px',
            minWidth: '150px',
            maxWidth: '200px',
            backgroundColor: 'white',
            borderRadius: '6px',
            '& .MuiOutlinedInput-root': { borderRadius: '6px' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch style={{ color: '#6b7280', fontSize: '16px' }} />
              </InputAdornment>
            ),
          }}
        />
        {/* Department filter — dynamic */}
        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            maxWidth: 150,
            flex: '0 1 auto',
            backgroundColor: 'white',
            borderRadius: '6px',
          }}
        >
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: '6px', fontSize: '14px' }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Specialization filter — dynamic */}
        <FormControl
          size="small"
          sx={{
            minWidth: 130,
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
            flex: '0 1 auto',
            backgroundColor: 'white',
            borderRadius: '6px',
            mr: '12px',
          }}
        >
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ borderRadius: '6px', fontSize: '14px' }}
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
            textTransform: 'none',
            backgroundColor: '#2563EB',
            fontWeight: 600,
            fontSize: '14px',
            ml: 'auto',
            '&:hover': { backgroundColor: '#1d4ed8' },
          }}
        >
          + Add Service
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
          maxHeight: '460px',
          overflow: 'auto',
        }}
      >
        <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              {[
                { label: 'Name', w: '20%' },
                { label: 'Department', w: '12%' },
                { label: 'Specialization', w: '12%' },
                { label: 'Duration', w: '9%' },
                { label: 'Price (₱)', w: '9%' },
                { label: 'Downpayment (₱)', w: '11%' },
                { label: 'Description', w: '13%' },
                { label: 'Status', w: '7%' },
                { label: 'Actions', w: '7%', center: true },
              ].map(({ label, w, center }) => (
                <TableCell
                  key={label}
                  sx={{
                    fontWeight: 600,
                    color: '#374151',
                    fontSize: '12px',
                    padding: '12px 8px',
                    width: w,
                    textAlign: center ? 'center' : 'left',
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
                key={service.serviceID}
                sx={{
                  '&:hover': { backgroundColor: '#f9fafb' },
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
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
                  {service.serviceName}
                </TableCell>
                <TableCell sx={{ padding: '10px 8px' }}>
                  {service.department ? (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '4px',
                        px: '6px',
                        py: '2px',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {service.department}
                    </Box>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                      All
                    </span>
                  )}
                </TableCell>
                <TableCell sx={{ padding: '10px 8px' }}>
                  {service.specialization ? (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        borderRadius: '4px',
                        px: '6px',
                        py: '2px',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {service.specialization}
                    </Box>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                      All
                    </span>
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    color: '#6b7280',
                    fontSize: '12px',
                    padding: '10px 8px',
                  }}
                >
                  {service.duration}
                </TableCell>
                <TableCell
                  sx={{
                    color: '#1f2937',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '10px 8px',
                  }}
                >
                  ₱{service.price.toLocaleString()}
                </TableCell>
                <TableCell
                  sx={{
                    color: '#1f2937',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '10px 8px',
                  }}
                >
                  ₱{service.downpayment.toLocaleString()}
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
                  {service.description || '—'}
                </TableCell>
                <TableCell sx={{ padding: '10px 8px' }}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: getServiceStatusColor(service.status),
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
                      {service.status}
                    </span>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '10px 8px', textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => openEditModal(service)}
                      sx={{
                        color: '#2563eb',
                        '&:hover': { backgroundColor: '#eff6ff' },
                      }}
                    >
                      <FiEdit2 size={13} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          id: service.serviceID,
                          name: service.serviceName,
                        })
                      }
                      sx={{
                        color: '#ef4444',
                        '&:hover': { backgroundColor: '#fee2e2' },
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
                  sx={{ py: 4, color: '#9ca3af' }}
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
          {modalMode === 'add' ? 'Add New Service' : 'Edit Service'}
          <IconButton onClick={() => setOpenModal(false)} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                Service Name *
              </label>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. General Consultation"
                value={formData.serviceName}
                onChange={(e) =>
                  setFormData({ ...formData, serviceName: e.target.value })
                }
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
              />
            </Box>

            {/* Department + Specialization — both dynamic */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Department
                </label>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.department ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                        specialization: '',
                      })
                    }
                    displayEmpty
                    sx={{ borderRadius: '6px' }}
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
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!formData.department}
                >
                  <Select
                    value={formData.specialization ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    displayEmpty
                    sx={{ borderRadius: '6px' }}
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

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Duration *
                </label>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 30 min"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Price (₱) *
                </label>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Downpayment (₱) *
                </label>
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                />
              </Box>
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
                      status: e.target.value as 'Available' | 'Unavailable',
                    })
                  }
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Unavailable">Unavailable</MenuItem>
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
                Description (Optional)
              </label>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#2563EB',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#1d4ed8' },
            }}
          >
            {modalMode === 'add' ? 'Add Service' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
            pb: 1,
          }}
        >
          Delete Service
          <IconButton
            onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}
            size="small"
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: -2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FiTrash2 size={18} color="#ef4444" />
            </Box>
            <Box>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: 500,
                }}
              >
                Are you sure you want to delete{' '}
                <strong>{deleteConfirm.name}</strong>?
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: '#6b7280',
                }}
              >
                This action cannot be undone.
              </p>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#ef4444',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
function StaffInformation() {
  const [activeTab, setActiveTab] = useState(0);

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
      <Box
        sx={{
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: { xs: '16px', sm: '20px', md: '24px' },
        }}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          {activeTab === 0 ? 'Staff Profile' : 'Services'}
        </h2>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mb: 3,
            borderBottom: '1px solid #e5e7eb',
            minHeight: '40px',
            '& .MuiTabs-indicator': {
              backgroundColor: '#2563EB',
              height: '2px',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              minHeight: '40px',
              padding: '8px 16px',
              color: '#6b7280',
              outline: 'none',
              '&:focus-visible': { outline: 'none' },
              '&.Mui-selected': { color: '#2563EB' },
            },
          }}
        >
          <Tab label="Staff Information" />
          <Tab label="Services" />
        </Tabs>
        {activeTab === 0 && <StaffTab />}
        {activeTab === 1 && <ServicesTab />}
      </Box>
    </div>
  );
}

export default StaffInformation;
