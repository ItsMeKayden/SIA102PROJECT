import '../styles/Pages.css';
import { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { FiSearch, FiPlus, FiEdit, FiX } from 'react-icons/fi';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'On Leave' | 'On Duty' | 'Off Duty';
}

interface StaffFormData {
  name: string;
  role: string;
  department: string;
  status: 'On Leave' | 'On Duty' | 'Off Duty';
}

function StaffInformation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    role: '',
    department: '',
    status: 'On Duty'
  });

  const staffData: Staff[] = [
    { id: '01', name: 'Janna Depp', role: 'Receptionist', department: 'Pharmacy', status: 'On Leave' },
    { id: '02', name: 'John Doe', role: 'Nurse', department: 'Pharmacy', status: 'On Duty' },
    { id: '03', name: 'John Dir', role: 'Doctor', department: 'Pharmacy', status: 'On Duty' },
    { id: '04', name: 'Ana Reyes', role: 'Nurse', department: 'Pharmacy', status: 'Off Duty' },
    { id: '05', name: 'Jane Cruz', role: 'Doctor', department: 'Pharmacy', status: 'Off Duty' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'On Leave': return '#f59e0b';
      case 'On Duty': return '#10b981';
      case 'Off Duty': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleOpenModal = (mode: 'add' | 'edit') => {
    setModalMode(mode);
    if (mode === 'add') {
      setFormData({ name: '', role: '', department: '', status: 'On Duty' });
      setSelectedStaffId('');
    } else {
      // Reset to empty for staff selection
      setSelectedStaffId('');
      setFormData({ name: '', role: '', department: '', status: 'On Duty' });
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
        department: staff.department,
        status: staff.status
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedStaffId('');
  };

  const handleSubmit = () => {
    // Handle form submission here
    console.log('Submitting:', formData);
    handleCloseModal();
  };

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
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
          
          <FormControl size="small" sx={{ minWidth: 120, flex: '0 1 auto', backgroundColor: 'white', borderRadius: '6px' }}>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '6px', fontSize: '14px' }}
            >
              <MenuItem value="all">All Depts</MenuItem>
              <MenuItem value="Pharmacy">Pharmacy</MenuItem>
              <MenuItem value="Emergency">Emergency</MenuItem>
              <MenuItem value="Surgery">Surgery</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100, flex: '0 1 auto', backgroundColor: 'white', borderRadius: '6px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '6px', fontSize: '14px' }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="On Duty">On Duty</MenuItem>
              <MenuItem value="Off Duty">Off Duty</MenuItem>
              <MenuItem value="On Leave">On Leave</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                }
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
                }
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
          width: '100%'
        }}
      >
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '8%', padding: '10px 8px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '28%', padding: '10px 8px' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '22%', padding: '10px 8px' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '22%', padding: '10px 8px' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '12px', width: '20%', padding: '10px 8px' }}>Status</TableCell>
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
                <TableCell sx={{ color: '#6b7280', fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.id}</TableCell>
                <TableCell sx={{ color: '#1f2937', fontSize: '12px', fontWeight: 500, padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.role}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '12px', padding: '10px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.department}</TableCell>
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
                Department
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  displayEmpty
                  disabled={modalMode === 'edit' && !selectedStaffId}
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="">Select department</MenuItem>
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'On Leave' | 'On Duty' | 'Off Duty' })}
                  disabled={modalMode === 'edit' && !selectedStaffId}
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value="On Duty">On Duty</MenuItem>
                  <MenuItem value="Off Duty">Off Duty</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                </Select>
              </FormControl>
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
                color: '#9ca3af'
              }
            }}
          >
            {modalMode === 'add' ? 'Add Staff' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default StaffInformation;
