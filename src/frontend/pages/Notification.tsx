import { useState } from 'react';
import { Container, Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
          TableHead, TableRow, Button, Checkbox, } from '@mui/material';
import '../styles/NotificationStyles.css';

interface Notification {
  id: string;
  type: string;
  from: string;
  message: string;
  date: string;
  checked: boolean;
}

function Notification() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'Schedule',
      from: 'ACOWIS SYSTEM',
      message: "John Doe's Shift on February 9 has been updated...",
      date: 'February 7, 2026',
      checked: false,
    },
    {
      id: '2',
      type: 'Appointment',
      from: 'ACOWIS SYSTEM',
      message: 'New PATIENT appointment assigned at ...',
      date: 'February 7, 2026',
      checked: false,
    },
    {
      id: '3',
      type: 'System',
      from: 'ACOWIS SYSTEM',
      message: 'Please Acknowledge the overtime for February...',
      date: 'February 7, 2026',
      checked: false,
    },
    {
      id: '4',
      type: 'Appointment',
      from: 'ACOWIS SYSTEM',
      message: 'New PATIENT appointment assigned at ...',
      date: 'February 7, 2026',
      checked: false,
    },
    {
      id: '5',
      type: 'System',
      from: 'ACOWIS SYSTEM',
      message: "John Di's Attendance report for Jan 1 to ...",
      date: 'February 7, 2026',
      checked: false,
    },
    {
      id: '6',
      type: 'ALERT',
      from: 'ACOWIS SYSTEM',
      message: 'EMERGENCY STAFF ASSISTANCE REQUIRED IN ROOM 5...',
      date: 'February 7, 2026',
      checked: false,
    },
  ]);

  const handleCheckChange = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, checked: !notif.checked } : notif,
      ),
    );
  };

  const unreadCount = notifications.filter((n) => !n.checked).length;
  const todayAlertCount = 0;
  const pendingAcknowledgementCount = 0;

  return (
    <Container maxWidth={false} className="notification-container" sx={{ py: 3 }}>
      {/* Notification Summary */}
      <h2 className="notification-title">Notification Summary</h2>
      <Box className="notification-summary">
        {/* Unread Notification Card */}
        <Box>
          <Card
            className="notification-card"
            sx={{
              background: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)',
            }}
          >
            <CardContent className="notification-card-content">
              <Typography className="notification-card-title">
                Unread Notification
              </Typography>
              <Typography
                variant="h3"
                className="notification-card-value"
              >
                {unreadCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Today's Alert Card */}
        <Box>
          <Card
            className="notification-card"
            sx={{
              background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
            }}
          >
            <CardContent className="notification-card-content">
              <Typography className="notification-card-title">
                Today's Alert
              </Typography>
              <Typography
                variant="h3"
                className="notification-card-value"
              >
                {todayAlertCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Pending Acknowledgement Card */}
        <Box>
          <Card
            className="notification-card notification-card-yellow"
            sx={{
              background: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)',
            }}
          >
            <CardContent className="notification-card-content">
              <Typography className="notification-card-title">
                Pending Acknowledgement
              </Typography>
              <Typography
                variant="h3"
                className="notification-card-value"
              >
                {pendingAcknowledgementCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Notifications Table */}
      <Card>
        <CardContent>
          <TableContainer className="notification-table-wrapper">
            <Table>
              <TableHead>
                <TableRow className="notification-table-head">
                  <TableCell sx={{ width: '50px', fontWeight: 'bold' }}>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Message Preview</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell sx={{ width: '50px' }}>
                      <Checkbox
                        checked={notification.checked}
                        onChange={() => handleCheckChange(notification.id)}
                      />
                    </TableCell>
                    <TableCell
                      className={
                        notification.type === 'ALERT'
                          ? 'notification-alert-type'
                          : 'notification-normal-type'
                      }
                    >
                      {notification.type}
                    </TableCell>
                    <TableCell>{notification.from}</TableCell>
                    <TableCell className="notification-message">
                      {notification.message}
                    </TableCell>
                    <TableCell>{notification.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Send Notification Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              className="notification-button"
            >
              Send Notification
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Notification;
