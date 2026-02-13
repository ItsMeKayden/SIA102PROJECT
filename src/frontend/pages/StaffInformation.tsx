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
  Box
} from '@mui/material';
import { FiSearch, FiPlus, FiEdit } from 'react-icons/fi';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'On Leave' | 'On Duty' | 'Off Duty';
}

function StaffInformation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  return (
    <div style={{ padding: '24px' }}>
      <Box sx={{ 
        backgroundColor: '#f3f4f6', 
        borderRadius: '12px', 
        padding: '32px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '28px', 
          fontWeight: '700',
          color: '#1f2937'
        }}>
          Staff Profile
        </h2>
        
        <Box sx={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Staff, Patient, Type Of Service"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              flex: '1 1 300px',
              minWidth: '250px',
              backgroundColor: 'white',
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch style={{ color: '#6b7280' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 140, backgroundColor: 'white', borderRadius: '8px' }}>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="all">Department</MenuItem>
              <MenuItem value="Pharmacy">Pharmacy</MenuItem>
              <MenuItem value="Emergency">Emergency</MenuItem>
              <MenuItem value="Surgery">Surgery</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white', borderRadius: '8px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="all">Status</MenuItem>
              <MenuItem value="On Duty">On Duty</MenuItem>
              <MenuItem value="Off Duty">Off Duty</MenuItem>
              <MenuItem value="On Leave">On Leave</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              sx={{
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                padding: '6px 20px',
                '&:hover': {
                  backgroundColor: '#2563eb',
                }
              }}
            >
              Add
            </Button>
            <Button
              variant="contained"
              startIcon={<FiEdit />}
              sx={{
                backgroundColor: '#3b82f6',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                padding: '6px 20px',
                '&:hover': {
                  backgroundColor: '#2563eb',
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
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#dbeafe' }}>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((staff) => (
              <TableRow 
                key={staff.id}
                sx={{ 
                  '&:hover': { backgroundColor: '#f9fafb' },
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <TableCell sx={{ color: '#4b5563', fontSize: '14px' }}>{staff.id}</TableCell>
                <TableCell sx={{ color: '#1f2937', fontSize: '14px', fontWeight: 500 }}>{staff.name}</TableCell>
                <TableCell sx={{ color: '#4b5563', fontSize: '14px' }}>{staff.role}</TableCell>
                <TableCell sx={{ color: '#4b5563', fontSize: '14px' }}>{staff.department}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box
                      sx={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(staff.status),
                      }}
                    />
                    <span style={{ color: '#4b5563', fontSize: '14px' }}>{staff.status}</span>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {/* Empty rows for visual consistency */}
            {[...Array(Math.max(0, 5 - filteredStaff.length))].map((_, index) => (
              <TableRow key={`empty-${index}`} sx={{ height: '53px' }}>
                <TableCell colSpan={5} sx={{ borderBottom: '1px solid #e5e7eb' }} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default StaffInformation;
