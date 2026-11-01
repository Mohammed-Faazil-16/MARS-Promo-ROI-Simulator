import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Clock3,
  LogOut,
  Menu,
  UserRound,
  X,
  Check,
} from "lucide-react";

function formatNotificationTime(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function decisionDetails(decision) {
  const normalized = String(decision || "").toLowerCase();

  if (normalized === "approve" || normalized === "approved") {
    return { label: "Approved", className: "approved", icon: Check };
  }
  if (normalized === "reject" || normalized === "rejected") {
    return { label: "Rejected", className: "rejected", icon: X };
  }
  return { label: "Review", className: "review", icon: Clock3 };
}

function Topbar({
  activePage,
  setMobileMenuOpen,
  setNotice,
  user,
  onLogout,
  notifications = [],
  onNotificationRead,
  onMarkAllNotificationsRead,
  onOpenNotification,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const initials = (user?.name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleNotificationClick(notification) {
    if (!notification.read) {
      onNotificationRead?.(notification.id);
    }
    setNotificationsOpen(false);
    onOpenNotification?.(notification);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button mobile-menu-button"
          aria-label="Open navigation"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{activePage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <span className="environment-label">
          <span className="environment-dot" />
          Workspace active
        </span>

        <div className="topbar-notifications" ref={notificationRef}>
          <button
            type="button"
            className="icon-button notification-button"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              className="notification-dropdown"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="notification-dropdown-header">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {unreadCount
                      ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                      : "You're all caught up"}
                  </span>
                </div>
                <div className="notification-header-actions">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-mark-all"
                      onClick={onMarkAllNotificationsRead}
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notification-close"
                    aria-label="Close notifications"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {notifications.length > 0 ? (
                <div className="notification-list">
                  {notifications.map((notification) => {
                    const decision = decisionDetails(notification.decision);
                    const DecisionIcon = decision.icon;

                    return (
                      <button
                        type="button"
                        key={notification.id}
                        className={`notification-item ${notification.read ? "is-read" : "is-unread"}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <span className={`notification-decision-icon ${decision.className}`}>
                          <DecisionIcon size={16} />
                        </span>
                        <span className="notification-item-content">
                          <span className="notification-item-topline">
                            <strong>
                              {notification.title ||
                                `Scenario ${decision.label.toLowerCase()}`}
                            </strong>
                            {!notification.read && (
                              <span className="notification-unread-dot" />
                            )}
                          </span>
                          <span className="notification-scenario-name">
                            {notification.scenarioName ||
                              notification.name ||
                              "Saved scenario"}
                          </span>
                          <span className="notification-item-meta">
                            <span className={`notification-status ${decision.className}`}>
                              {decision.label}
                            </span>
                            {Number.isFinite(Number(notification.roi)) && (
                              <span>ROI {Number(notification.roi).toFixed(1)}%</span>
                            )}
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="notification-empty">
                  <span className="notification-empty-icon">
                    <Bell size={21} />
                  </span>
                  <strong>No notifications yet</strong>
                  <p>
                    When you save a promotion scenario, its decision and ROI
                    summary will appear here.
                  </p>
                </div>
              )}

              <div className="notification-dropdown-footer">
                <span>Scenario activity</span>
                <span>{notifications.length} total</span>
              </div>
            </section>
          )}
        </div>

        <div className="topbar-profile" ref={profileRef}>
          <button
            type="button"
            className="topbar-profile-trigger"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-label="Open user profile menu"
          >
            <div className="topbar-avatar">{initials}</div>

            <div className="topbar-user-info">
              <strong>{user?.name || "Workspace User"}</strong>
              <span>{user?.userId || "User ID"}</span>
            </div>

            <ChevronDown
              size={15}
              className={profileOpen ? "profile-chevron-open" : ""}
            />
          </button>

          {profileOpen && (
            <div className="topbar-profile-dropdown">
              <div className="profile-dropdown-heading">
                <div className="profile-dropdown-avatar">{initials}</div>
                <div>
                  <strong>{user?.name || "Workspace User"}</strong>
                  <span>{user?.userId || "User ID"}</span>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <div className="profile-workspace-status">
                <UserRound size={16} />
                <span>Authorised workspace user</span>
              </div>

              <button
                type="button"
                className="profile-logout-button"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
