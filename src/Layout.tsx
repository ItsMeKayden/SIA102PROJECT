import { useState } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './frontend/components/Sidebar';
import {
  Menu,
  MenuItem,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  Box,
  Typography
} from '@mui/material';
import { FiMenu, FiSearch } from 'react-icons/fi';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Notification state
  interface Notification {
    id: string;
    type: string;
    from: string;
    message: string;
    date: string;
    checked: boolean;
    archived: boolean;
  }

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'Schedule',
      from: 'ACOWIS SYSTEM',
      message: "John Doe's Shift on February 9 has been updated...",
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '2',
      type: 'Appointment',
      from: 'ACOWIS SYSTEM',
      message: 'New PATIENT appointment assigned at ...',
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '3',
      type: 'System',
      from: 'ACOWIS SYSTEM',
      message: 'Please Acknowledge the overtime for February...',
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '4',
      type: 'Appointment',
      from: 'ACOWIS SYSTEM',
      message: 'New PATIENT appointment assigned at ...',
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '5',
      type: 'System',
      from: 'ACOWIS SYSTEM',
      message: "John Di's Attendance report for Jan 1 to ...",
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '6',
      type: 'ALERT',
      from: 'ACOWIS SYSTEM',
      message: 'TUMAE YUNG PASYENTE SA ROOM 9',
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
    {
      id: '7',
      type: 'ALERT',
      from: 'ACOWIS SYSTEM',
      message: 'EMERGENCY STAFF ASSISTANCE REQUIRED IN ROOM 5...',
      date: 'February 7, 2026',
      checked: false,
      archived: false,
    },
  ]);

  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotificationFilter] = useState('unread');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedNotificationForDetails, setSelectedNotificationForDetails] = useState<Notification | null>(null);

  const [staffAnchorEl, setStaffAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStaff, setSelectedStaff] = useState('John Doe');
  const staffOpen = Boolean(staffAnchorEl);

  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState(
    'Jan 01 - Jan 31 2026',
  );

  const [searchQuery, setSearchQuery] = useState('');

  const dateOpen = Boolean(dateAnchorEl);
  const staffList = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'];
  const dateRanges = [
    'Jan 01 - Jan 31 2026',
    'Feb 01 - Feb 28 2026',
    'Mar 01 - Mar 31 2026',
    'Dec 01 - Dec 31 2025',
  ];

  const handleStaffClick = (event: MouseEvent<HTMLElement>) => {
    setStaffAnchorEl(event.currentTarget);
  };

  const handleStaffClose = () => {
    setStaffAnchorEl(null);
  };

  const handleStaffSelect = (staff: string) => {
    setSelectedStaff(staff);
    handleStaffClose();
  };

  const handleDateClick = (event: MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  const handleDateClose = () => {
    setDateAnchorEl(null);
  };

  const handleDateSelect = (dateRange: string) => {
    setSelectedDateRange(dateRange);
    handleDateClose();
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCheckChange = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, checked: !notif.checked } : notif,
      ),
    );
  };

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotificationForDetails(notification);
    setDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setDetailsModalOpen(false);
    setSelectedNotificationForDetails(null);
  };

  const handleNotificationModalOpen = () => {
    setNotificationModalOpen(true);
  };

  const handleNotificationModalClose = () => {
    setNotificationModalOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.checked).length;

  const getFilteredNotifications = () => {
    switch (selectedNotificationFilter) {
      case 'unread':
        return notifications.filter((n) => !n.checked && !n.archived);
      case 'alerts':
        return notifications.filter((n) => n.type === 'ALERT' && !n.archived);
      case 'pending':
        return notifications.filter((n) => n.type === 'System' && !n.archived);
      case 'archive':
        return notifications.filter((n) => n.archived);
      default:
        return notifications.filter((n) => !n.archived);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Overview';
      case '/staff':
        return 'Staff Information';
      case '/attendance':
        return 'Attendance';
      case '/analytics':
        return 'Analytics';
      case '/appointments':
        return 'Appointments';
      case '/schedule':
        return 'Schedule';
      case '/notification':
        return 'Notification';
      default:
        return 'NavBar';
    }
  };

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const renderNavbarContent = () => {
    const path = location.pathname;

    if (path === '/attendance' || path === '/analytics') {
      return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Staff Dropdown */}
          <span style={{ fontSize: '12px', color: '#666' }}>Staff:</span>
          <Button
            onClick={handleStaffClick}
            endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
            sx={{
              fontSize: '12px',
              color: '#333',
              textTransform: 'none',
              fontWeight: 600,
              padding: '2px 6px',
              minWidth: 'auto',
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
              '& .MuiButton-endIcon': {
                marginLeft: '2px',
              },
            }}
          >
            {selectedStaff}
          </Button>

          {/* Date Range Dropdown */}
          <Button
            onClick={handleDateClick}
            endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
            sx={{
              fontSize: '12px',
              color: '#333',
              textTransform: 'none',
              padding: '2px 6px',
              minWidth: 'auto',
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
              '& .MuiButton-endIcon': {
                marginLeft: '2px',
              },
            }}
          >
            {selectedDateRange}
          </Button>

          {/* Menus */}
          <Menu
            anchorEl={staffAnchorEl}
            open={staffOpen}
            onClose={handleStaffClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: '100px',
                  width: 'auto',
                },
              },
            }}
          >
            {staffList.map((staff) => (
              <MenuItem
                key={staff}
                onClick={() => handleStaffSelect(staff)}
                selected={staff === selectedStaff}
                sx={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  minHeight: 'auto',
                }}
              >
                {staff}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={dateAnchorEl}
            open={dateOpen}
            onClose={handleDateClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: '140px',
                  width: 'auto',
                },
              },
            }}
          >
            {dateRanges.map((range) => (
              <MenuItem
                key={range}
                onClick={() => handleDateSelect(range)}
                selected={range === selectedDateRange}
                sx={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  minHeight: 'auto',
                }}
              >
                {range}
              </MenuItem>
            ))}
          </Menu>
        </div>
      );
    }

    if (path === '/appointments') {
      return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Search Bar */}
          <TextField
            placeholder="Search appointments..."
            size="small"
            sx={{
              width: '280px',
              '& .MuiOutlinedInput-root': {
                height: '32px',
                fontSize: '12px',
              },
              '& .MuiOutlinedInput-input': {
                textAlign: 'center',
                padding: '6px 10px',
                paddingLeft: '0px',
                '&::placeholder': {
                  textAlign: 'center',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" style={{ marginRight: -200 }}>
                  <SearchIcon sx={{ fontSize: '16px', color: '#666' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Current Date */}
          <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
            {getCurrentDate()}
          </span>
        </div>
      );
    }

    // For other pages - return null or empty div
    return null;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: sidebarOpen ? '240px 1fr' : '0 1fr',
        gridTemplateRows: 'auto 1fr',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        transition: 'grid-template-columns 0.3s ease',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          gridColumn: '1',
          gridRow: '1 / 3',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: sidebarOpen ? '240px' : '0',
          transition: 'width 0.3s ease',
        }}
      >
        {sidebarOpen && <Sidebar />}
      </div>

      {/* Navigation Bar */}
      <nav
        style={{
          gridColumn: '2',
          gridRow: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          padding: '20px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="small"
            sx={{
              color: '#374151',
              '&:hover': { backgroundColor: '#f3f4f6' },
            }}
          >
            <FiMenu size={20} />
          </IconButton>
          <h2 style={{ margin: 0, fontSize: '25px', color: '#333' }}>
            <span style={{ fontWeight: 'lighter' }}>ACOWIS: </span>
            {getPageTitle()}
          </h2>
        </div>

        {(location.pathname === '/attendance' ||
          location.pathname === '/analytics') && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {/* Staff Dropdown */}
            <span style={{ fontSize: '12px', color: '#666' }}>Staff:</span>
            <Button
              onClick={handleStaffClick}
              endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
              sx={{
                fontSize: '12px',
                color: '#333',
                textTransform: 'none',
                fontWeight: 600,
                padding: '2px 6px',
                minWidth: 'auto',
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: '2px',
                },
              }}
            >
              {selectedStaff}
            </Button>

            {/* Date Range Dropdown */}
            <Button
              onClick={handleDateClick}
              endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
              sx={{
                fontSize: '12px',
                color: '#333',
                textTransform: 'none',
                padding: '2px 6px',
                minWidth: 'auto',
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: '2px',
                },
              }}
            >
              {selectedDateRange}
            </Button>

            {/* Menus */}
            <Menu
              anchorEl={staffAnchorEl}
              open={staffOpen}
              onClose={handleStaffClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: '100px',
                    width: 'auto',
                  },
                },
              }}
            >
              {staffList.map((staff) => (
                <MenuItem
                  key={staff}
                  onClick={() => handleStaffSelect(staff)}
                  selected={staff === selectedStaff}
                  sx={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    minHeight: 'auto',
                  }}
                >
                  {staff}
                </MenuItem>
              ))}
            </Menu>

            <Menu
              anchorEl={dateAnchorEl}
              open={dateOpen}
              onClose={handleDateClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: '140px',
                    width: 'auto',
                  },
                },
              }}
            >
              {dateRanges.map((range) => (
                <MenuItem
                  key={range}
                  onClick={() => handleDateSelect(range)}
                  selected={range === selectedDateRange}
                  sx={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    minHeight: 'auto',
                  }}
                >
                  {range}
                </MenuItem>
              ))}
            </Menu>
          </div>
        )}

        {/* FOR SEARCHBAR IN NOIFICATION */}
        {location.pathname === '/notification' && (
          <TextField
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{
              width: '300px',
              height: '32px',
              '& .MuiOutlinedInput-root': {
                height: '32px',
              },
              '& .MuiInputBase-input::placeholder': {
                opacity: 0.7,
              },
            }}
            InputProps={{
              startAdornment: (
                <FiSearch
                  size={16}
                  style={{ marginRight: '8px', color: '#666' }}
                />
              ),
            }}
          />
        )}
        {/* Render different content based on current route */}
        {renderNavbarContent()}

        {/* Notification Bell Icon */}
        <Badge badgeContent={unreadCount} color="error">
          <IconButton
            onClick={handleNotificationModalOpen}
            size="medium"
            sx={{
              color: '#374151',
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#f3f4f6' },
            }}
          >
            <NotificationsIcon />
          </IconButton>
        </Badge>
      </nav>

      {/* Main Content */}
      <main
        style={{
          gridColumn: '2',
          gridRow: '2',
          padding: '0',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarGutter: 'stable',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      {/* Notification Modal */}
      <Dialog
        open={notificationModalOpen}
        onClose={handleNotificationModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '18px', pb: 1, overflow: 'hidden' }}>
          Notifications
        </DialogTitle>
        
        {/* Action Bar */}
        <Box sx={{ display: 'flex', gap: 1, px: 2, py: 2, borderBottom: '1px solid #eee', flexWrap: 'wrap', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none', flexShrink: 0 }}>
            ☑ Unread
          </Button>
          <Button variant="contained" size="small" sx={{ backgroundColor: '#c4e157', color: '#000', textTransform: 'none', flexShrink: 0, '&:hover': { backgroundColor: '#9ccc65' } }}>
            ✓ Mark All as Read
          </Button>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none', flexShrink: 0 }}>
            📎 Archive
          </Button>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none', flexShrink: 0, color: '#d32f2f', borderColor: '#d32f2f' }}>
            🗑 Delete
          </Button>
          <Box sx={{ flex: 1, minWidth: 0 }} />
          <Button variant="contained" size="small" sx={{ backgroundColor: '#c4e157', color: '#000', textTransform: 'none', flexShrink: 0, '&:hover': { backgroundColor: '#9ccc65' } }}>
            ✏️ Compose
          </Button>
        </Box>

        <DialogContent sx={{ p: 2, flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box', backgroundColor: '#e8eef7' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', boxSizing: 'border-box' }}>
            {getFilteredNotifications().map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  width: '100%',
                  boxSizing: 'border-box',
                  minWidth: 0,
                  backgroundColor: '#fff',
                }}
              >
                {/* First Row: Checkbox, Badge, Title, Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <input
                    type="checkbox"
                    checked={notification.checked}
                    onChange={() => handleCheckChange(notification.id)}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                  />
                  <Box
                    sx={{
                      display: 'inline-flex',
                      px: 0.7,
                      py: 0.25,
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor:
                        notification.type === 'Appointment'
                          ? '#4caf50'
                          : notification.type === 'Schedule'
                          ? '#2196f3'
                          : notification.type === 'ALERT'
                          ? '#f44336'
                          : notification.type === 'System'
                          ? '#ff9800'
                          : '#757575',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      width: 'fit-content',
                    }}
                  >
                    {notification.type}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1, minWidth: 0 }}>
                    {notification.from === 'ACOWIS SYSTEM' ? 'New Patient Appointment Assigned' : 'Shift Update'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {notification.date}
                  </Typography>
                </Box>

                {/* Second Row: Description */}
                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5 }}>
                  {notification.message}
                </Typography>

                {/* Third Row: ACOWIS Badge and Action Icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      px: 0.8,
                      py: 0.2,
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor: '#f44336',
                      flexShrink: 0,
                      width: 'fit-content',
                    }}
                  >
                    ACOWIS
                  </Box>
                  
                  {/* Action Icons */}
                  <Box sx={{ display: 'flex', gap: 0, ml: 'auto', flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      sx={{ color: '#666', p: 0.5 }}
                      title="Print"
                    >
                      🖨️
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: '#666', p: 0.5 }}
                      title="View Details"
                      onClick={() => handleViewDetails(notification)}
                    >
                      ✎
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ color: '#d32f2f', p: 0.5 }}
                      title="Delete"
                    >
                      🗑
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        
      </Dialog>

      {/* Notification Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={handleDetailsModalClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '18px' }}>
          Notification Details
        </DialogTitle>
        {selectedNotificationForDetails && (
          <DialogContent sx={{ pt: 2, boxSizing: 'border-box', overflow: 'hidden', width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: '100%' }}>
              {/* Notification Type Badge */}
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Type:
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    width: 'fit-content',
                    px: 2,
                    py: 0.5,
                    borderRadius: '20px',
                    backgroundColor:
                      selectedNotificationForDetails.type === 'ALERT'
                        ? '#ffebee'
                        : '#e3f2fd',
                    color:
                      selectedNotificationForDetails.type === 'ALERT'
                        ? '#d32f2f'
                        : '#1976d2',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                >
                  {selectedNotificationForDetails.type}
                </Box>
              </Box>

              {/* From */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  From:
                </Typography>
                <Typography variant="body2">{selectedNotificationForDetails.from}</Typography>
              </Box>

              {/* Date */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Date:
                </Typography>
                <Typography variant="body2">{selectedNotificationForDetails.date}</Typography>
              </Box>

              {/* Full Message */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Message:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6, wordBreak: 'break-word', width: '100%' }}>
                    {selectedNotificationForDetails.message}
                  </Typography>
                </Box>
              </Box>

              {/* Status */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Status:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: selectedNotificationForDetails.checked ? '#4caf50' : '#ff9800',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedNotificationForDetails.checked ? 'Read' : 'Unread'}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color={selectedNotificationForDetails.checked ? 'inherit' : 'primary'}
                  onClick={() => {
                    handleCheckChange(selectedNotificationForDetails.id);
                  }}
                  sx={{ flex: 1 }}
                >
                  {selectedNotificationForDetails.checked ? 'Mark as Unread' : 'Mark as Read'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleDetailsModalClose}
                  sx={{ flex: 1 }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Layout;
