import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  MenuItem, 
  Button, 
  IconButton, 
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider
} from '@mui/material';
import { 
  FiMenu, 
  FiBell,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiCheck,
  FiX,
  FiLogOut,
  FiLogIn,
  FiKey
} from 'react-icons/fi';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from './backend/services/notificationService';
import { useAuth } from './contexts/AuthContext';
import { LoginModal } from './frontend/components/auth/LoginModal';
import { ChangePasswordModal } from './frontend/components/auth/ChangePasswordModal';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, staffProfile, signOut, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Navigation menu state
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const navMenuOpen = Boolean(navMenuAnchorEl);
  
  // Notification state
  interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    staff_id: string | null;
  }

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'Schedule',
      title: "Schedule Update",
      message: "John Doe's Shift on February 9 has been updated...",
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '2',
      type: 'Appointment',
      title: "New Appointment",
      message: 'New PATIENT appointment assigned at ...',
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '3',
      type: 'System',
      title: "System Alert",
      message: 'Please Acknowledge the overtime for February...',
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '4',
      type: 'Appointment',
      title: "New Appointment",
      message: 'New PATIENT appointment assigned at ...',
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '5',
      type: 'System',
      title: "Attendance Report",
      message: "John Di's Attendance report for Jan 1 to ...",
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '6',
      type: 'ALERT',
      title: "Alert",
      message: 'TUMAE YUNG PASYENTE SA ROOM 9',
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
    {
      id: '7',
      type: 'ALERT',
      title: "Emergency",
      message: 'EMERGENCY STAFF ASSISTANCE REQUIRED IN ROOM 5...',
      created_at: '2026-02-07T10:00:00Z',
      is_read: false,
      staff_id: null,
    },
  ]);

  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [_selectedNotificationFilter] = useState('unread');
  const [_detailsModalOpen, _setDetailsModalOpen] = useState(false);
  const [_selectedNotificationForDetails, _setSelectedNotificationForDetails] = useState<Notification | null>(null);

  const [staffAnchorEl, setStaffAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStaff, setSelectedStaff] = useState('John Doe');
  const staffOpen = Boolean(staffAnchorEl);

  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState(
    'Jan 01 - Jan 31 2026',
  );

  const [_searchQuery, _setSearchQuery] = useState('');

  const dateOpen = Boolean(dateAnchorEl);
  const staffList = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'];
  const dateRanges = [
    'Jan 01 - Jan 31 2026',
    'Feb 01 - Feb 28 2026',
    'Mar 01 - Mar 31 2026',
    'Dec 01 - Dec 31 2025',
  ];

  // Navigation menu items
  const menuItems = [
    { label: 'Overview', path: '/', icon: '🏠' },
    { label: 'Staff Information', path: '/staff', icon: '👥' },
    { label: 'Attendance', path: '/attendance', icon: '🕐' },
    { label: 'Analytics', path: '/analytics', icon: '📊' },
    { label: 'Appointments', path: '/appointments', icon: '📋' },
    { label: 'Schedule', path: '/schedule', icon: '📅' },
  ];

  const handleNavMenuClick = (event: MouseEvent<HTMLElement>) => {
    setNavMenuAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavMenuAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleNavMenuClose();
  };

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data } = await getUnreadNotificationCount();
      if (data !== null && data !== undefined) {
        setUnreadCount(data);
      }
    };

    fetchUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-show login modal if user is not authenticated
  useEffect(() => {
    if (!user && !showLoginModal) {
      setShowLoginModal(true);
    }
  }, [user, showLoginModal]);

  // Fetch notifications when modal opens
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    const [notifData, countData] = await Promise.all([
      getAllNotifications(),
      getUnreadNotificationCount()
    ]);

    if (notifData.data) setNotifications(notifData.data);
    if (typeof countData.data === 'number') setUnreadCount(countData.data);
    
    setNotificationsLoading(false);
  };

  const handleNotificationClick = () => {
    setNotificationModalOpen(true);
    fetchNotifications();
  };

  const handleCloseNotificationModal = () => {
    setNotificationModalOpen(false);
    setFilter('all');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await markNotificationAsRead(id);
    if (error) {
      showSnackbar(error, 'error');
    } else {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await markAllNotificationsAsRead();
    if (error) {
      showSnackbar(error, 'error');
    } else {
      showSnackbar('All notifications marked as read', 'success');
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteNotification(id);
    if (error) {
      showSnackbar(error, 'error');
    } else {
      showSnackbar('Notification deleted', 'success');
      fetchNotifications();
    }
  };

  const getIcon = (type: string) => {
    const icons = {
      'info': <FiInfo size={20} />,
      'warning': <FiAlertCircle size={20} />,
      'error': <FiXCircle size={20} />,
      'success': <FiCheckCircle size={20} />
    };
    return icons[type as keyof typeof icons] || icons['info'];
  };

  const getColor = (type: string) => {
    const colors = {
      'info': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
      'warning': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
      'error': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
      'success': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
    };
    return colors[type as keyof typeof colors] || colors['info'];
  };

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

  const handleUserMenuClick = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleUserMenuClose();
    navigate('/');
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    handleUserMenuClose();
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Navigation Bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '12px 16px' : '14px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          flexShrink: 0,
          gap: '16px',
          zIndex: 1000,
          position: 'relative',
        }}
      >
        {/* Left Section - Logo & Company Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '24px' }}>❤️</span>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: '#2563eb',
              fontSize: isMobile ? '18px' : '20px',
              letterSpacing: '0.5px'
            }}
          >
            CLINIKA+
          </Typography>
        </div>

        {/* Center Section - Staff & Date Filters (shown only on attendance/analytics) */}
        {(location.pathname === '/attendance' || location.pathname === '/analytics') && !isMobile && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '0 1 auto', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Staff:</span>
            <Button
              onClick={handleStaffClick}
              endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
              sx={{
                fontSize: '12px',
                color: '#374151',
                textTransform: 'none',
                fontWeight: 600,
                padding: '4px 8px',
                minWidth: 'auto',
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: '4px',
                },
              }}
            >
              {selectedStaff}
            </Button>

            <Button
              onClick={handleDateClick}
              endIcon={<span style={{ fontSize: '12px' }}>▼</span>}
              sx={{
                fontSize: '12px',
                color: '#374151',
                textTransform: 'none',
                padding: '4px 8px',
                minWidth: 'auto',
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: '4px',
                },
              }}
            >
              {selectedDateRange}
            </Button>
          </div>
        )}

        {/* Right Section - Notification Bell & Burger Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
          {/* Notification Bell */}
          <IconButton 
            onClick={handleNotificationClick}
            size="small"
            sx={{ 
              color: '#374151',
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '10px',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 5px',
                  fontWeight: 600
                }
              }}
            >
              <FiBell size={20} />
            </Badge>
          </IconButton>

          {/* User Menu */}
          {user ? (
            <IconButton
              onClick={handleUserMenuClick}
              size="small"
              sx={{
                color: '#374151',
                '&:hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: isAdmin ? '#3b82f6' : '#10b981',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {staffProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          ) : (
            <IconButton
              onClick={handleLogin}
              size="small"
              sx={{
                color: '#374151',
                '&:hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              <FiLogIn size={20} />
            </IconButton>
          )}

          {/* Burger Menu */}
          <IconButton 
            onClick={handleNavMenuClick}
            size="small"
            sx={{ 
              color: '#374151',
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <FiMenu size={22} />
          </IconButton>
        </div>

        {/* Navigation Dropdown Menu */}
        <Menu
          anchorEl={navMenuAnchorEl}
          open={navMenuOpen}
          onClose={handleNavMenuClose}
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
                minWidth: '220px',
                mt: 1,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                borderRadius: '8px'
              },
            },
          }}
        >
          {menuItems.map((item, _index) => (
            <MenuItem
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                fontSize: '14px',
                padding: '10px 16px',
                gap: '12px',
                '&.Mui-selected': {
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#dbeafe',
                  }
                },
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Staff Filter Menu */}
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
                padding: '6px 12px',
                minHeight: 'auto',
              }}
            >
              {staff}
            </MenuItem>
          ))}
        </Menu>

        {/* Date Range Menu */}
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
                padding: '6px 12px',
                minHeight: 'auto',
              }}
            >
              {range}
            </MenuItem>
          ))}
        </Menu>

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
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
                minWidth: '220px',
                mt: 1,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                borderRadius: '8px'
              },
            },
          }}
        >
          {user && staffProfile && (
            <>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  {staffProfile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  {staffProfile.email}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={isAdmin ? 'Admin' : 'Staff'} 
                    size="small"
                    sx={{ 
                      height: '20px',
                      fontSize: '11px',
                      backgroundColor: isAdmin ? '#dbeafe' : '#dcfce7',
                      color: isAdmin ? '#1e40af' : '#065f46',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              <Divider />
              <MenuItem
                onClick={handleChangePassword}
                sx={{
                  fontSize: '14px',
                  padding: '10px 16px',
                  gap: '12px',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                  }
                }}
              >
                <FiKey size={18} />
                Change Password
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleSignOut}
                sx={{
                  fontSize: '14px',
                  padding: '10px 16px',
                  gap: '12px',
                  color: '#dc2626',
                  '&:hover': {
                    backgroundColor: '#fef2f2',
                  }
                }}
              >
                <FiLogOut size={18} />
                Sign Out
              </MenuItem>
            </>
          )}
        </Menu>
      </nav>

      {/* Login Modal */}
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Change Password Modal */}
      <ChangePasswordModal open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '0',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#f3f4f6',
          position: 'relative',
        }}
      >
        <Outlet />
      </main>

      {/* Notification Modal */}
      <Dialog
        open={notificationModalOpen}
        onClose={handleCloseNotificationModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : '12px',
              maxHeight: isMobile ? '100vh' : '80vh'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e5e7eb', 
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} unread`} 
                size="small" 
                sx={{ 
                  backgroundColor: '#ef4444', 
                  color: 'white',
                  fontWeight: 600 
                }} 
              />
            )}
          </Box>
          <IconButton onClick={handleCloseNotificationModal} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter('all')}
                  sx={{ textTransform: 'none' }}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter('unread')}
                  sx={{ textTransform: 'none' }}
                >
                  Unread ({unreadCount})
                </Button>
              </Box>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FiCheck />}
                  onClick={handleMarkAllAsRead}
                  sx={{ textTransform: 'none' }}
                >
                  Mark All as Read
                </Button>
              )}
            </Box>

            {/* Notifications List */}
            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 'calc(80vh - 180px)', overflowY: 'auto' }}>
                {filteredNotifications.length === 0 ? (
                  <Card sx={{ textAlign: 'center', py: 6 }}>
                    <FiBell size={48} color="#9ca3af" />
                    <Typography variant="h6" sx={{ mt: 2, color: '#6b7280' }}>
                      No notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      You're all caught up!
                    </Typography>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => {
                    const colors = getColor(notification.type);
                    return (
                      <Card
                        key={notification.id}
                        sx={{
                          borderLeft: `4px solid ${colors.border}`,
                          backgroundColor: notification.is_read ? '#ffffff' : '#fafafa',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            {/* Icon */}
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: colors.bg,
                                color: colors.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {getIcon(notification.type)}
                            </Box>

                            {/* Content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a202c' }}>
                                  {notification.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9ca3af', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: '#4b5563', mb: 1, fontSize: '13px' }}>
                                {notification.message}
                              </Typography>
                              
                              {/* Actions */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                {!notification.is_read && (
                                  <Button
                                    size="small"
                                    startIcon={<FiCheck size={14} />}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    sx={{ 
                                      textTransform: 'none', 
                                      fontSize: '12px',
                                      color: colors.text
                                    }}
                                  >
                                    Mark as read
                                  </Button>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(notification.id)}
                                  sx={{ 
                                    color: '#ef4444',
                                    '&:hover': { backgroundColor: '#fee2e2' }
                                  }}
                                >
                                  <FiTrash2 size={14} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Layout;
