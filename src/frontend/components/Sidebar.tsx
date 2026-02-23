import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiClock,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
} from 'react-icons/fi';
import '../styles/Sidebar.css';

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const menuItems: MenuItem[] = [
  { label: 'Staff Information', path: 'staff', icon: <FiUsers /> },
  { label: 'Attendance', path: 'attendance', icon: <FiClock /> },
  { label: 'Analytics', path: 'analytics', icon: <FiBarChart2 /> },
  { label: 'Appointments', path: 'appointments', icon: <FiClipboard /> },
  { label: 'Schedule', path: 'schedule', icon: <FiCalendar /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logoIcon">❤️</span>
        CLINIKA+
      </div>

      <nav className="nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? 'menuItem active' : 'menuItem'
            }
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
