import { useState } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './frontend/components/Sidebar';
import { Menu, MenuItem, Button, IconButton, TextField } from '@mui/material';
import { FiMenu, FiSearch } from 'react-icons/fi';

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  /* 
  THIS IS FOR GETTING THE VALUE INSIDE THE SEARCHBAR,
  ITO NALANG GAMITIN NATIN SA PAGKUHA NG LAMAN NG SEARCHBAR
  PARA DI NA HUMABA YUNG CODE
  */
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
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
              '&:hover': { backgroundColor: '#f3f4f6' }
            }}
          >
            <FiMenu size={20} />
          </IconButton>
          <h2 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
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
                <FiSearch size={16} style={{ marginRight: '8px', color: '#666' }} />
              ),
            }}
          />
        )}
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
    </div>
  );
};

export default Layout;
