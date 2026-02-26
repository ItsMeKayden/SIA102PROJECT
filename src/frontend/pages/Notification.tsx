import '../styles/Pages.css';
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  FiBell, 
  FiAlertCircle, 
  FiInfo, 
  FiCheckCircle, 
  FiXCircle,
  FiTrash2,
  FiCheck
} from 'react-icons/fi';
import type { Notification as NotificationType } from '../../types';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../../backend/services/notificationService';

function Notification() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notifData, countData] = await Promise.all([
        getAllNotifications(),
        getUnreadNotificationCount()
      ]);

      if (notifData.data) setNotifications(notifData.data);
      if (typeof countData.data === 'number') setUnreadCount(countData.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
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

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a202c' }}>
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

        {/* Filter Buttons */}
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
      </Box>

      {/* Notifications List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    transform: 'translateY(-2px)'
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
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c' }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', flexShrink: 0, ml: 2 }}>
                          {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#4b5563', mb: 1 }}>
                        {notification.message}
                      </Typography>
                      
                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
}

export default Notification;
