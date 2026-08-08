import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { FluidBackground } from './components/layout/FluidBackground';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { SubjectSelectPage } from './pages/SubjectSelectPage';
import { ExperimentSelectPage } from './pages/ExperimentSelectPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AIChatWidget } from './components/workspace/AIChatWidget';
import { Watermark } from './components/common/Watermark';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { DerivationModal } from './components/modals/DerivationModal';
import { ValidationDetailModal } from './components/modals/ValidationDetailModal';
import { ResetConfirmModal } from './components/modals/ResetConfirmModal';
import { ReportExportModal } from './components/modals/ReportExportModal';
import { StudentDetailsGateModal } from './components/modals/StudentDetailsGateModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { InstallBanner } from './components/pwa/InstallBanner';

// Auth Components
import { useAuthStore } from './store/authStore';
import { RoleSelector } from './components/auth/RoleSelector';
import { GoogleSignIn } from './components/auth/GoogleSignIn';
import { TeacherLogin } from './components/auth/TeacherLogin';
import { TeacherDashboard } from './components/auth/TeacherDashboard';
import { StudentGate } from './components/auth/StudentGate';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const {
    user,
    role,
    activeRoleTab,
    setRoleTab,
    initAuth,
    authLoading
  } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900 font-sans selection:bg-violet-500/20 selection:text-violet-900">
      
      {/* Light Mesh Background */}
      <FluidBackground />

      {/* Navigation Header */}
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />

      {/* Main Content View Switcher wrapped in ErrorBoundary */}
      <main className="flex-1 relative z-10">
        <ErrorBoundary>

          {/* Loading Indicator */}
          {authLoading ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Authenticating Session...
              </span>
            </div>
          ) : !user ? (
            /* NOT LOGGED IN: Show Role Selector & Auth Card */
            <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
              <RoleSelector
                selectedRole={activeRoleTab}
                onSelectRole={(tab) => setRoleTab(tab)}
              />

              {activeRoleTab === 'student' ? (
                <GoogleSignIn />
              ) : (
                <TeacherLogin />
              )}
            </div>
          ) : role === 'teacher' ? (
            /* LOGGED IN AS TEACHER */
            currentPage === 'teacher-dashboard' ? (
              <TeacherDashboard onEnterLab={() => navigateTo('landing')} />
            ) : (
              <>
                {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
                {currentPage === 'subject' && <SubjectSelectPage onNavigate={navigateTo} />}
                {currentPage === 'experiment' && <ExperimentSelectPage onNavigate={navigateTo} />}
                {currentPage === 'workspace' && <WorkspacePage onNavigate={navigateTo} />}
              </>
            )
          ) : (
            /* LOGGED IN AS STUDENT (Gated by 6-Digit Access Code) */
            <StudentGate>
              {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
              {currentPage === 'subject' && <SubjectSelectPage onNavigate={navigateTo} />}
              {currentPage === 'experiment' && <ExperimentSelectPage onNavigate={navigateTo} />}
              {currentPage === 'workspace' && <WorkspacePage onNavigate={navigateTo} />}
            </StudentGate>
          )}

        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Watermark in Bottom-Right Corner */}
      <Watermark />

      {/* Persistent Floating AI Assistant Widget */}
      <AIChatWidget />

      {/* PWA Install Banner */}
      <InstallBanner />

      {/* Modals & Dialogs */}
      <StudentDetailsGateModal />
      <OnboardingModal />
      <DerivationModal />
      <ValidationDetailModal />
      <ResetConfirmModal />
      <ReportExportModal />

    </div>
  );
}
