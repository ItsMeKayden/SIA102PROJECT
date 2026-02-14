import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './frontend/components/Sidebar';
import {
  Menu,
  MenuItem,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Layout = () => {
  const location = useLocation();

  const [staffAnchorEl, setStaffAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStaff, setSelectedStaff] = useState('John Doe');
  const staffOpen = Boolean(staffAnchorEl);

  const [dateAnchorEl, setDateAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState(
    'Jan 01 - Jan 31 2026',
  );

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
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: 'auto 1fr',
        height: '100vh',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          gridColumn: '1',
          gridRow: '1 / 3',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Sidebar />
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
          padding: '12px 20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
            <span style={{ fontWeight: 'lighter' }}>ACOWIS: </span>
            {getPageTitle()}
          </h2>
        </div>

        {/* Render different content based on current route */}
        {renderNavbarContent()}
      </nav>

      {/* Main Content */}
      <main
        style={{
          gridColumn: '2',
          gridRow: '2',
          padding: '20px',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
