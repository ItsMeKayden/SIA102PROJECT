import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Button,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Divider,
  Drawer,
} from "@mui/material";
import {
  FiBell,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiCheck,
  FiX,
  FiMenu,
  FiLogOut,
  FiLogIn,
  FiKey,
  FiUser,
  FiCamera,
  FiMenu,
} from "react-icons/fi";
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from "./backend/services/notificationService";
import { updateStaff } from "./backend/services/staffService";
import { supabase } from "./lib/supabase-client";
import { useAuth } from "./contexts/AuthContext";
import Sidebar from "./frontend/components/layout/Sidebar";
import { LoginModal } from "./frontend/components/auth/LoginModal";
import { ChangePasswordModal } from "./frontend/components/auth/ChangePasswordModal";
import logo from "./assets/logo.png";

const fieldLabel = (text: string, required = false) => (
  <label
    style={{
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: 500,
      color: "#374151",
    }}
  >
    {text}
    {required && " *"}
  </label>
);

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, staffProfile, signOut, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    staff_id: string | null;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data } = await getUnreadNotificationCount();
      if (data !== null && data !== undefined) setUnreadCount(data);
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) setTimeout(() => setShowLoginModal(true), 0);
  }, [user]);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    const [notifData, countData] = await Promise.all([
      getAllNotifications(),
      getUnreadNotificationCount(),
    ]);
    if (notifData.data) setNotifications(notifData.data);
    if (typeof countData.data === "number") setUnreadCount(countData.data);
    setNotificationsLoading(false);
  };

  const showSnackbar = (message: string, severity: "success" | "error") =>
    setSnackbar({ open: true, message, severity });

  const handleNotificationClick = () => {
    setNotificationModalOpen(true);
    fetchNotifications();
  };

  const handleCloseNotificationModal = () => {
    setNotificationModalOpen(false);
    setFilter("all");
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await markNotificationAsRead(id);
    if (error) showSnackbar(error, "error");
    else fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    const { error } = await markAllNotificationsAsRead();
    if (error) showSnackbar(error, "error");
    else {
      showSnackbar("All notifications marked as read", "success");
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteNotification(id);
    if (error) showSnackbar(error, "error");
    else {
      showSnackbar("Notification deleted", "success");
      fetchNotifications();
    }
  };

  const getIcon = (type: string) => {
    const icons = {
      info: <FiInfo size={20} />,
      warning: <FiAlertCircle size={20} />,
      error: <FiXCircle size={20} />,
      success: <FiCheckCircle size={20} />,
    };
    return icons[type as keyof typeof icons] || icons["info"];
  };

  const getColor = (type: string) => {
    const colors = {
      info: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },
      warning: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },
      error: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
      success: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
    };
    return colors[type as keyof typeof colors] || colors["info"];
  };

  const handleUserMenuClick = (event: MouseEvent<HTMLElement>) =>
    setUserMenuAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchorEl(null);

  const handleSignOut = async () => {
    await signOut();
    handleUserMenuClose();
    navigate("/");
  };
  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    handleUserMenuClose();
  };

  const handleOpenEditProfile = () => {
    setEditProfileForm({
      name: staffProfile?.name || "",
      phone: staffProfile?.phone || "",
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    setShowEditProfileModal(true);
    handleUserMenuClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar("Image must be under 2MB", "error");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!staffProfile?.id) return;
    if (!editProfileForm.name.trim()) {
      showSnackbar("Name is required", "error");
      return;
    }
    setEditProfileLoading(true);
    let avatarUrl = (staffProfile as any).avatar_url || "";
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${staffProfile.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });
      if (uploadError) {
        showSnackbar(`Avatar upload failed: ${uploadError.message}`, "error");
        setEditProfileLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }
    const { error } = await updateStaff(staffProfile.id, {
      name: editProfileForm.name.trim(),
      role: staffProfile.role || "",
      specialization: staffProfile.specialization || "",
      department: staffProfile.department || "",
      status: (staffProfile.status as "Active" | "Inactive") || "Active",
      email: staffProfile.email || "",
      phone: editProfileForm.phone.trim() || "",
      avatar_url: avatarUrl,
    });
    setEditProfileLoading(false);
    if (error) {
      showSnackbar(error, "error");
    } else {
      showSnackbar("Profile updated successfully", "success");
      setShowEditProfileModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Navigation Bar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "100%",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "12px 16px" : "14px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          flexShrink: 0,
          gap: "16px",
          zIndex: 1000,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {isMobile && (
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              size="small"
              sx={{
                color: "#374151",
                "&:hover": { backgroundColor: "#f3f4f6" },
              }}
              aria-label="Open navigation menu"
            >
              <FiMenu size={20} />
            </IconButton>
          )}
          <img
            src={logo}
            alt="Logo"
            style={{ height: "32px", width: "auto" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          <IconButton
            onClick={handleNotificationClick}
            size="small"
            sx={{ color: "#374151", "&:hover": { backgroundColor: "#f3f4f6" } }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "10px",
                  height: "18px",
                  minWidth: "18px",
                  padding: "0 5px",
                  fontWeight: 600,
                },
              }}
            >
              <FiBell size={20} />
            </Badge>
          </IconButton>

          {user ? (
            <IconButton
              onClick={handleUserMenuClick}
              size="small"
              sx={{
                color: "#374151",
                "&:hover": { backgroundColor: "#f3f4f6" },
              }}
            >
              <Avatar
                src={(staffProfile as any)?.avatar_url || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: isAdmin ? "#3b82f6" : "#10b981",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {staffProfile?.name?.charAt(0).toUpperCase() || "U"}
              </Avatar>
            </IconButton>
          ) : (
            <IconButton
              onClick={() => setShowLoginModal(true)}
              size="small"
              sx={{
                color: "#374151",
                "&:hover": { backgroundColor: "#f3f4f6" },
              }}
            >
              <FiLogIn size={20} />
            </IconButton>
          )}
        </div>

        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: "220px",
                mt: 1,
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                borderRadius: "8px",
              },
            },
          }}
        >
          {user && staffProfile && (
            <>
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e5e7eb" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#1f2937" }}
                >
                  {staffProfile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                  {staffProfile.email}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={isAdmin ? "Admin" : "Staff"}
                    size="small"
                    sx={{
                      height: "20px",
                      fontSize: "11px",
                      backgroundColor: isAdmin ? "#dbeafe" : "#dcfce7",
                      color: isAdmin ? "#1e40af" : "#065f46",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Divider />
              <MenuItem
                onClick={handleOpenEditProfile}
                sx={{
                  fontSize: "14px",
                  padding: "10px 16px",
                  gap: "12px",
                  "&:hover": { backgroundColor: "#f3f4f6" },
                }}
              >
                <FiUser size={18} /> Edit Profile
              </MenuItem>
              <MenuItem
                onClick={handleChangePassword}
                sx={{
                  fontSize: "14px",
                  padding: "10px 16px",
                  gap: "12px",
                  "&:hover": { backgroundColor: "#f3f4f6" },
                }}
              >
                <FiKey size={18} /> Change Password
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={handleSignOut}
                sx={{
                  fontSize: "14px",
                  padding: "10px 16px",
                  gap: "12px",
                  color: "#dc2626",
                  "&:hover": { backgroundColor: "#fef2f2" },
                }}
              >
                <FiLogOut size={18} /> Sign Out
              </MenuItem>
            </>
          )}
        </Menu>
      </nav>

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Edit Profile Modal */}
      <Dialog
        open={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxWidth: "420px",
            margin: "16px",
            width: "calc(100% - 32px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "18px",
            fontWeight: 600,
            color: "#1f2937",
            pb: 2,
          }}
        >
          Edit Profile
          <IconButton
            onClick={() => setShowEditProfileModal(false)}
            size="small"
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {staffProfile && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    src={
                      avatarPreview ||
                      (staffProfile as any)?.avatar_url ||
                      undefined
                    }
                    sx={{
                      width: 72,
                      height: 72,
                      bgcolor: isAdmin ? "#3b82f6" : "#10b981",
                      fontSize: "28px",
                      fontWeight: 700,
                    }}
                  >
                    {editProfileForm.name.charAt(0).toUpperCase() || "U"}
                  </Avatar>
                  <label htmlFor="avatar-upload" style={{ cursor: "pointer" }}>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid white",
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#1d4ed8" },
                      }}
                    >
                      <FiCamera size={12} color="white" />
                    </Box>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{ fontWeight: 600, fontSize: "15px", color: "#1f2937" }}
                  >
                    {editProfileForm.name || staffProfile.name}
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                    {staffProfile.role} ·{" "}
                    {staffProfile.department || "No department"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "11px", color: "#9ca3af", mt: 0.3 }}
                  >
                    Click the camera icon to change photo
                  </Typography>
                </Box>
              </Box>
              <Box>
                {fieldLabel("Email")}
                <TextField
                  fullWidth
                  size="small"
                  value={staffProfile.email || ""}
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "6px" },
                    "& .Mui-disabled": { backgroundColor: "#f9fafb" },
                  }}
                />
              </Box>
              <Box>
                {fieldLabel("Staff ID")}
                <TextField
                  fullWidth
                  size="small"
                  value={(staffProfile as any).staffid || staffProfile.id}
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontFamily: "monospace",
                    },
                    "& .Mui-disabled": { backgroundColor: "#f9fafb" },
                  }}
                />
              </Box>
              <Box>
                {fieldLabel("Role")}
                <TextField
                  fullWidth
                  size="small"
                  value={staffProfile.role || ""}
                  disabled
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "6px" },
                    "& .Mui-disabled": { backgroundColor: "#f9fafb" },
                  }}
                />
              </Box>
              <Divider />
              <Box>
                {fieldLabel("Full Name", true)}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter your full name"
                  value={editProfileForm.name}
                  onChange={(e) =>
                    setEditProfileForm({
                      ...editProfileForm,
                      name: e.target.value,
                    })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
              <Box>
                {fieldLabel("Phone (Optional)")}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 09XX-XXX-XXXX"
                  value={editProfileForm.phone}
                  onChange={(e) =>
                    setEditProfileForm({
                      ...editProfileForm,
                      phone: e.target.value,
                    })
                  }
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setShowEditProfileModal(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={editProfileLoading}
            sx={{
              textTransform: "none",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1d4ed8" },
              minWidth: "100px",
            }}
          >
            {editProfileLoading ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content with Sidebar */}
      <div
        style={{
          display: "flex",
          flex: 1,
          height: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Desktop sidebar — always visible */}
        {!isMobile && <Sidebar />}
        <Drawer
          anchor="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: 250,
                borderRight: "1px solid #ddd",
              },
            },
          }}
        >
          <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </Drawer>
        <main
          style={{
            flex: 1,
            padding: "0",
            paddingBottom: "80px",
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            backgroundColor: "#f3f4f6",
            position: "relative",
          }}
        >
          <Outlet />
        </main>
      </div>

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
              borderRadius: isMobile ? 0 : "12px",
              maxHeight: isMobile ? "100vh" : "90vh",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid #e5e7eb",
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1a202c" }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                sx={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseNotificationModal} size="small">
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant={filter === "all" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setFilter("all")}
                  sx={{ textTransform: "none" }}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === "unread" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setFilter("unread")}
                  sx={{ textTransform: "none" }}
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
                  sx={{ textTransform: "none" }}
                >
                  Mark All as Read
                </Button>
              )}
            </Box>
            {notificationsLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 8,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  maxHeight: "calc(80vh - 180px)",
                  overflowY: "auto",
                  pr: 0.5,
                }}
              >
                {filteredNotifications.length === 0 ? (
                  <Card sx={{ textAlign: "center", py: 6 }}>
                    <FiBell size={48} color="#9ca3af" />
                    <Typography variant="h6" sx={{ mt: 2, color: "#6b7280" }}>
                      No notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
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
                          backgroundColor: notification.is_read
                            ? "#ffffff"
                            : "#fafafa",
                          transition: "all 0.2s",
                          flexShrink: 0,
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: colors.bg,
                                color: colors.text,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {getIcon(notification.type)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  mb: 0.5,
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, color: "#1a202c" }}
                                >
                                  {notification.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#9ca3af",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {new Date(
                                    notification.created_at,
                                  ).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#4b5563",
                                  mb: 1,
                                  fontSize: "13px",
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  mt: 2,
                                  flexWrap: "wrap",
                                }}
                              >
                                {!notification.is_read && (
                                  <Button
                                    size="small"
                                    startIcon={<FiCheck size={14} />}
                                    onClick={() =>
                                      handleMarkAsRead(notification.id)
                                    }
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "12px",
                                      color: colors.text,
                                    }}
                                  >
                                    Mark as read
                                  </Button>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(notification.id)}
                                  sx={{
                                    color: "#ef4444",
                                    "&:hover": { backgroundColor: "#fee2e2" },
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
