import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileNavDrawer } from './components/common/MobileNavDrawer';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { QuickDemoBar } from './components/common/QuickDemoBar';
import { AuthModal } from './components/auth/AuthModal';
import { ApplicantStatusView } from './components/auth/ApplicantStatusView';
import { SuspendedAccountView } from './components/auth/SuspendedAccountView';
import { DeactivatedAccountView } from './components/auth/DeactivatedAccountView';
import { AccessDeniedView } from './components/auth/AccessDeniedView';
import { LoginView } from './components/auth/LoginView';
import { RegisterCommunityView } from './components/auth/RegisterCommunityView';

// Public components
import { GuestLanding } from './components/public/GuestLanding';
import { PublicSafetyView } from './components/public/PublicSafetyView';

// Resident components
import { ResidentHome } from './components/resident/ResidentHome';
import { ResidentReportForm } from './components/resident/ResidentReportForm';
import { ResidentReportsList } from './components/resident/ResidentReportsList';
import { ResidentReportDetails } from './components/resident/ResidentReportDetails';
import { ResidentAccountView } from './components/resident/ResidentAccountView';

// Operations / Verifier components
import { OperationsDashboard } from './components/operations/OperationsDashboard';
import { ReportsQueue } from './components/operations/ReportsQueue';
import { IncidentsList } from './components/operations/IncidentsList';
import { IncidentDetails } from './components/operations/IncidentDetails';

// Field Engineer components
import { EngineerJobsView } from './components/engineer/EngineerJobsView';

// Manager components
import { ManagerApplicationsView } from './components/manager/ManagerApplicationsView';
import { ManagerAnalyticsView } from './components/manager/ManagerAnalyticsView';

// Admin components
import { AdminCockpitView } from './components/admin/AdminCockpitView';

// GIS Map
import { FullMapView } from './components/gis/FullMapView';
import { api } from './lib/api';

function MainAppShell() {
  const { currentUser, isLoading } = useAuth();
  
  // Navigation State
  const [activeView, setActiveView] = useState<string>('guest');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Badge counters
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  // Sync initial default view when user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'RESIDENT') {
        setActiveView('home');
      } else if (currentUser.role === 'VERIFIER') {
        setActiveView('dashboard');
      } else if (currentUser.role === 'ENGINEER') {
        setActiveView('jobs');
      } else if (currentUser.role === 'MANAGER' || currentUser.role === 'PROVIDER_MANAGER') {
        setActiveView('dashboard');
      } else if (currentUser.role === 'ADMIN' || currentUser.role === 'SYSTEM_ADMINISTRATOR') {
        setActiveView('admin');
      }
    } else {
      // Keep on current public view if already on one, else go to guest
      setActiveView(prev => ['guest', 'login', 'register', 'safety', 'map'].includes(prev) ? prev : 'guest');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Load badge counts for queue and jobs
  useEffect(() => {
    if (!currentUser) return;
    const fetchBadgeData = async () => {
      try {
        if (['VERIFIER', 'MANAGER', 'PROVIDER_MANAGER', 'ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(currentUser.role)) {
          const res = await api.reports.list({ status: 'SUBMITTED' });
          setUnreadReportsCount(res.reports?.length || 0);
        }
        if (['ENGINEER', 'ADMIN'].includes(currentUser.role)) {
          const res = await api.incidents.list({ status: 'DISPATCHED' });
          setActiveJobsCount(res.incidents?.length || 0);
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchBadgeData();
  }, [currentUser?.id, currentUser?.role, activeView]);

  // Handle navigation
  const handleNavigate = (view: string) => {
    setSelectedReportId(null);
    setSelectedIncidentId(null);
    let normalized = view;
    if (view === 'resident-home') normalized = 'home';
    if (view === 'resident-report') normalized = 'report';
    if (view === 'resident-reports') normalized = 'reports';
    if (view === 'engineer-jobs') normalized = 'jobs';
    if (view === 'manager-analytics') normalized = 'analytics';
    if (view === 'manager-applications') normalized = 'applications';
    if (view === 'admin-cockpit') normalized = 'admin';
    setActiveView(normalized);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveView('report-detail');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setActiveView('incident-detail');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-500 font-bold text-sm tracking-wider uppercase gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing PowerPulse Grid...</span>
      </div>
    );
  }

  // Permission checkers
  const isVerifierOrHigher = currentUser && ['VERIFIER', 'MANAGER', 'PROVIDER_MANAGER', 'ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(currentUser.role);
  const isManagerOrHigher = currentUser && ['MANAGER', 'PROVIDER_MANAGER', 'ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(currentUser.role);
  const isAdmin = currentUser && ['ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(currentUser.role);
  const isEngineerOrAdmin = currentUser && ['ENGINEER', 'ADMIN', 'SYSTEM_ADMINISTRATOR'].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top Demo Bar for Evaluation and Persona Testing */}
      <QuickDemoBar
        currentRole={currentUser?.role}
        onSelectRole={role => {
          setSelectedReportId(null);
          setSelectedIncidentId(null);
          if (role === 'GUEST') setActiveView('guest');
          else if (role === 'RESIDENT') setActiveView('home');
          else if (role === 'VERIFIER') setActiveView('dashboard');
          else if (role === 'ENGINEER') setActiveView('jobs');
          else if (role === 'MANAGER' || role === 'PROVIDER_MANAGER') setActiveView('dashboard');
          else if (role === 'ADMIN' || role === 'SYSTEM_ADMINISTRATOR') setActiveView('admin');
        }}
      />

      {/* Main Header with Mobile Drawer Hamburger Toggle */}
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Slide-in Navigation Drawer for Mobile Phones & Tablets */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeView={activeView}
        onNavigate={handleNavigate}
        unreadReportsCount={unreadReportsCount}
        activeJobsCount={activeJobsCount}
      />

      {/* Body Layout: Row on desktop/tablet, column on mobile, with bottom padding for mobile bar */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6 pb-24 md:pb-8">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          onOpenAuth={() => setActiveView('login')}
        />

        {/* Dynamic View Center with Motion Transitions */}
        <main className="flex-1 min-w-0">
          {/* Account Status Guards */}
          {currentUser?.status === 'DEACTIVATED' ? (
            <DeactivatedAccountView onNavigate={handleNavigate} />
          ) : currentUser?.status === 'SUSPENDED' ? (
            <SuspendedAccountView />
          ) : (currentUser?.status === 'PENDING_APPROVAL' || currentUser?.status === 'PENDING_VERIFICATION') ? (
            <ApplicantStatusView />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + (selectedReportId || '') + (selectedIncidentId || '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full"
              >
                {/* PUBLIC & AUTH VIEWS */}
                {activeView === 'guest' && (
                  <GuestLanding onNavigate={handleNavigate} />
                )}

                {activeView === 'login' && (
                  <LoginView onNavigate={handleNavigate} />
                )}

                {activeView === 'register' && (
                  <RegisterCommunityView onNavigate={handleNavigate} />
                )}

                {activeView === 'safety' && (
                  <PublicSafetyView onNavigate={handleNavigate} />
                )}

                {/* GIS HEATMAP (Accessible to all) */}
                {activeView === 'map' && (
                  <FullMapView
                    onSelectIncident={handleSelectIncident}
                    onSelectReport={handleSelectReport}
                  />
                )}

                {/* RESIDENT VIEWS */}
                {activeView === 'home' && (
                  currentUser?.role === 'RESIDENT' ? (
                    <ResidentHome onNavigate={handleNavigate} />
                  ) : (
                    <OperationsDashboard
                      onNavigate={handleNavigate}
                      onSelectIncident={handleSelectIncident}
                      onSelectReport={handleSelectReport}
                    />
                  )
                )}

                {activeView === 'report' && (
                  <ResidentReportForm
                    onSuccess={report => {
                      handleSelectReport(report.id);
                    }}
                    onCancel={() => handleNavigate(currentUser?.role === 'RESIDENT' ? 'home' : 'dashboard')}
                  />
                )}

                {activeView === 'reports' && (
                  <ResidentReportsList
                    onSelectReport={handleSelectReport}
                    onNewReport={() => handleNavigate('report')}
                  />
                )}

                {activeView === 'report-detail' && selectedReportId && (
                  <ResidentReportDetails
                    reportId={selectedReportId}
                    onBack={() => {
                      if (isVerifierOrHigher) {
                        handleNavigate('reports-queue');
                      } else {
                        handleNavigate('reports');
                      }
                    }}
                    onSelectIncident={handleSelectIncident}
                  />
                )}

                {activeView === 'account' && (
                  <ResidentAccountView />
                )}

                {/* OPERATIONS / VERIFIER VIEWS */}
                {activeView === 'dashboard' && (
                  isVerifierOrHigher ? (
                    <OperationsDashboard
                      onNavigate={handleNavigate}
                      onSelectIncident={handleSelectIncident}
                      onSelectReport={handleSelectReport}
                    />
                  ) : (
                    <AccessDeniedView requiredRole="VERIFIER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {activeView === 'reports-queue' && (
                  isVerifierOrHigher ? (
                    <ReportsQueue
                      onSelectReport={handleSelectReport}
                      onSelectIncident={handleSelectIncident}
                    />
                  ) : (
                    <AccessDeniedView requiredRole="VERIFIER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {activeView === 'incidents' && (
                  isVerifierOrHigher ? (
                    <IncidentsList onSelectIncident={handleSelectIncident} />
                  ) : (
                    <AccessDeniedView requiredRole="VERIFIER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {activeView === 'incident-detail' && selectedIncidentId && (
                  (isVerifierOrHigher || isEngineerOrAdmin) ? (
                    <IncidentDetails
                      incidentId={selectedIncidentId}
                      onBack={() => {
                        if (currentUser?.role === 'ENGINEER') {
                          handleNavigate('jobs');
                        } else {
                          handleNavigate('incidents');
                        }
                      }}
                      onSelectReport={handleSelectReport}
                    />
                  ) : (
                    <AccessDeniedView requiredRole="VERIFIER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {/* ENGINEER VIEWS */}
                {activeView === 'jobs' && (
                  isEngineerOrAdmin ? (
                    <EngineerJobsView onSelectIncident={handleSelectIncident} />
                  ) : (
                    <AccessDeniedView requiredRole="ENGINEER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {/* MANAGER VIEWS */}
                {activeView === 'applications' && (
                  isManagerOrHigher ? (
                    <ManagerApplicationsView />
                  ) : (
                    <AccessDeniedView requiredRole="PROVIDER_MANAGER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {activeView === 'analytics' && (
                  isManagerOrHigher ? (
                    <ManagerAnalyticsView />
                  ) : (
                    <AccessDeniedView requiredRole="PROVIDER_MANAGER" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}

                {/* ADMIN VIEWS */}
                {activeView === 'admin' && (
                  isAdmin ? (
                    <AdminCockpitView />
                  ) : (
                    <AccessDeniedView requiredRole="SYSTEM_ADMINISTRATOR" attemptedView={activeView} onNavigate={handleNavigate} />
                  )
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phones & Small Tablets) */}
      <MobileBottomBar
        activeView={activeView}
        onNavigate={handleNavigate}
        onToggleMenu={() => setMobileMenuOpen(true)}
        unreadReportsCount={unreadReportsCount}
        activeJobsCount={activeJobsCount}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="SIGNIN"
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainAppShell />
      </NotificationProvider>
    </AuthProvider>
  );
}
