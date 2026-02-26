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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import type { Staff, StaffFormData } from '../../types';
import { 
  getAllStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    role: '',
    specialization: '',
    status: 'Active',
    email: '',
    phone: ''
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
    switch(status) {
      case 'Active': return '#10b981';
      case 'Inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredStaff = staffData.filter(staff => {
    // If current user is admin, hide other admin accounts
    if (isAdmin && staffProfile && staff.user_role === 'admin' && staff.id !== staffProfile.id) {
      return false;
    }
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = specializationFilter === 'all' || staff.specialization === specializationFilter;
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  // Open modal in add or edit mode
  const handleOpenModal = (mode: 'add' | 'edit') => {
    setModalMode(mode);
    if (mode === 'add') {
      setFormData({ name: '', role: '', specialization: '', status: 'Active', email: '', phone: '' });
      setSelectedStaffId('');
    } else {
      setSelectedStaffId('');
      setFormData({ name: '', role: '', specialization: '', status: 'Active', email: '', phone: '' });
    }
    setOpenModal(true);
  };

  const handleStaffSelection = (staffId: string) => {
    const staff = staffData.find(s => s.id === staffId);
    if (staff) {
      setSelectedStaffId(staffId);
      setFormData({
        name: staff.name,
        role: staff.role,
        specialization: staff.specialization || '',
        status: (staff.status as 'Active' | 'Inactive') || 'Active',
        email: staff.email || '',
        phone: staff.phone || ''
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
      const { error } = await createStaff(formData);
      if (error) {
        showSnackbar(error, 'error');
      } else {
        showSnackbar('Staff member added successfully', 'success');
        fetchStaff();
        handleCloseModal();
      }
    } else {
      const { error } = await updateStaff(selectedStaffId, formData);
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
      setStaffData(prevStaff => prevStaff.filter(staff => staff.id !== id));
      
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
    <div style={{ padding: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            padding: { xs: '16px', sm: '20px', md: '24px' },
            marginBottom: '20px'
          }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          fontSize: 'clamp(18px, 4vw, 24px)', 
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Staff Profile
        </h2>
        
        <Box sx={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
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
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch style={{ color: '#6b7280', fontSize: '16px' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120, maxWidth: 160, flex: '0 1 auto', backgroundColor: 'white', borderRadius: '6px' }}>
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

          <FormControl size="small" sx={{ minWidth: 100, maxWidth: 140, flex: '0 1 auto', backgroundColor: 'white', borderRadius: '6px', marginRight: '12px' }}>
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
              '&:hover': {
                backgroundColor: '#1d4ed8'
              },
              marginLeft: 'auto'
            }}
          >
            + Add Staff
          </Button>
        </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%',
          overflowX: 'auto'
        }}
      >
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '8%', padding: '10px 8px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '20%', padding: '10px 8px' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '15%', padding: '10px 8px' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '15%', padding: '10px 8px' }}>Specialization</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '20%', padding: '10px 8px' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '12%', padding: '10px 8px' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '10%', padding: '10px 8px', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((staff) => (
              <TableRow 
                key={staff.id}
                sx={{ 
                  '&:hover': { backgroundColor: '#f9fafb' },
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <TableCell sx={{ color: '#6b7280', fontSize: '11px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {staff.id.substring(0, 8)}...
                </TableCell>
                <TableCell sx={{ color: '#1f2937', fontSize: '12px', fontWeight: 500, padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.role}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.specialization || 'N/A'}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '11px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.email || 'N/A'}</TableCell>
                <TableCell sx={{ padding: '10px 8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Box
                      sx={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(staff.status),
                        flexShrink: 0
                      }}
                    />
                    <span style={{ color: '#6b7280', fontSize: '11px', whiteSpace: 'nowrap' }}>{staff.status}</span>
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '10px 8px', textAlign: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(staff.id, staff.name)}
                    sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}
                  >
                    <FiTrash2 size={14} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredStaff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                  No staff members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

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
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          fontSize: '18px',
          fontWeight: 600,
          color: '#1f2937'
        }}>
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
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#374151'
                }}>
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
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Full Name
              </label>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={modalMode === 'edit' && !selectedStaffId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  }
                }}
              />
            </Box>

            <Box>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Role
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Specialization
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Status
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  disabled={modalMode === 'edit' && !selectedStaffId}
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Email
              </label>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="staff@clinika.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={modalMode === 'edit' && !selectedStaffId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  }
                }}
              />
            </Box>

            <Box>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                Phone (Optional)
              </label>
              <TextField
                fullWidth
                size="small"
                type="tel"
                placeholder="555-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={modalMode === 'edit' && !selectedStaffId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                  }
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
                backgroundColor: '#f3f4f6'
              }
            }}
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
              fontSize: '14px',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
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

export default StaffInformation;
