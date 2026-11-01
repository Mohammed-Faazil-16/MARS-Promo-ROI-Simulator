import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout({
  activePage,
  mobileMenuOpen,
  setMobileMenuOpen,
  navigate,
  setNotice,
  isReportingFilterOpen,
  reportingPeriod,
  draftReportingPeriod,
  onOpenReportingFilters,
  onChangeReportingPeriod,
  onApplyReportingPeriod,
  onCloseReportingFilters,
  user,
  onLogout,
  notifications = [],
  onNotificationRead,
  onMarkAllNotificationsRead,
  onOpenNotification,
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        navigate={navigate}
        setNotice={setNotice}
        isReportingFilterOpen={isReportingFilterOpen}
        reportingPeriod={reportingPeriod}
        draftReportingPeriod={draftReportingPeriod}
        onOpenReportingFilters={onOpenReportingFilters}
        onChangeReportingPeriod={onChangeReportingPeriod}
        onApplyReportingPeriod={onApplyReportingPeriod}
        onCloseReportingFilters={onCloseReportingFilters}
        user={user}
      />

      <main className="main-area">
        <Topbar
          activePage={activePage}
          setMobileMenuOpen={setMobileMenuOpen}
          setNotice={setNotice}
          user={user}
          onLogout={onLogout}
          notifications={notifications}
          onNotificationRead={onNotificationRead}
          onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          onOpenNotification={onOpenNotification}
        />

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
