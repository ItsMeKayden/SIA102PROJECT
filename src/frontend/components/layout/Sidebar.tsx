import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiUsers,
  FiClock,
  FiBarChart2,
  FiCalendar,
  FiClipboard,
  FiHome,
} from "react-icons/fi";
import "../../styles/Sidebar.css";
import { useAuth } from "../../../contexts/AuthContext";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  doctorOrAdminOnly?: boolean;
};

const allMenuItems: MenuItem[] = [
  { label: "Overview", path: "overview", icon: <FiHome />, adminOnly: true },
  {
    label: "Staff & Services",
    path: "staffnservices",
    icon: <FiUsers />,
    adminOnly: true,
  },
  { label: "Attendance", path: "attendance", icon: <FiClock /> },
  {
    label: "Analytics",
    path: "analytics",
    icon: <FiBarChart2 />,
    adminOnly: true,
  },
  {
    label: "Walk Ins",
    path: "appointments",
    icon: <FiClipboard />,
    doctorOrAdminOnly: true,
  },
  { label: "Schedule", path: "schedule", icon: <FiCalendar /> },
];

type SidebarProps = Record<string, never>;

const Sidebar: React.FC<SidebarProps> = () => {
  const { isAdmin, staffProfile } = useAuth();

  const role = staffProfile?.role?.toLowerCase();
  const isDoctor = role === "doctor";

  const menuItems = allMenuItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.doctorOrAdminOnly) return isAdmin || isDoctor;
    return true;
  });

  const handleMenuItemClick = () => {
    // Menu item clicked
  };

  return (
    <aside className="sidebar">
      <nav className="nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "menuItem active" : "menuItem"
            }
            onClick={handleMenuItemClick}
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
