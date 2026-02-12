import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiClock,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
  FiBell,
} from 'react-icons/fi';
import styles from '../styles/Sidebar.module.css';

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const menuItems: MenuItem[] = [
  { label: 'Overview', path: '/', icon: <FiHome /> },
  { label: 'Staff Information', path: 'staff', icon: <FiUsers /> },
  { label: 'Attendance', path: 'attendance', icon: <FiClock /> },
  { label: 'Analytics', path: 'analytics', icon: <FiBarChart2 /> },
  { label: 'Appointments', path: 'appointments', icon: <FiClipboard /> },
  { label: 'Schedule', path: 'schedule', icon: <FiCalendar /> },
  { label: 'Notification', path: 'notification', icon: <FiBell /> },
];

const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>❤️</span>
        CLINIKA+
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
