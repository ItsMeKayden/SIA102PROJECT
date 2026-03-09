import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiUsers,
  FiClock,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
  FiHome,
} from 'react-icons/fi';
import '../../styles/Sidebar.css';
import { useAuth } from '../../../contexts/AuthContext';

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const allMenuItems: MenuItem[] = [
  { label: 'Overview', path: '/', icon: <FiHome /> },
  {
    label: 'Staff Information',
    path: 'staff',
    icon: <FiUsers />,
    adminOnly: true,
  },
  { label: 'Attendance', path: 'attendance', icon: <FiClock /> },
  {
    label: 'Analytics',
    path: 'analytics',
    icon: <FiBarChart2 />,
    adminOnly: true,
  },
  { label: 'Appointments', path: 'appointments', icon: <FiClipboard /> },
  { label: 'Schedule', path: 'schedule', icon: <FiCalendar /> },
];

const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const menuItems = allMenuItems
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) =>
      item.path === '/' && !isAdmin ? { ...item, label: 'Dashboard' } : item,
    );

  return (
    <aside className="sidebar">
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
