import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/layout/Navbar';
import { FluidBackground } from './components/layout/FluidBackground';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { SubjectSelectPage } from './pages/SubjectSelectPage';
import { ExperimentSelectPage } from './pages/ExperimentSelectPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { TeacherDashboard } from './components/auth/TeacherDashboard';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

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
          {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
          {currentPage === 'subject' && <SubjectSelectPage onNavigate={navigateTo} />}
          {currentPage === 'experiment' && <ExperimentSelectPage onNavigate={navigateTo} />}
          {currentPage === 'workspace' && <WorkspacePage onNavigate={navigateTo} />}
          {currentPage === 'teacher_dashboard' && <TeacherDashboard onEnterLab={() => navigateTo('subject')} />}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Watermark in Bottom-Right Corner */}
      <ErrorBoundary>
        <Watermark />
      </ErrorBoundary>

      {/* Persistent Floating AI Assistant Widget */}
      <ErrorBoundary>
        <AIChatWidget />
      </ErrorBoundary>

      {/* PWA Install Banner */}
      <ErrorBoundary>
        <InstallBanner />
      </ErrorBoundary>

      {/* Modals & Dialogs */}
      <ErrorBoundary>
        <StudentDetailsGateModal onProceedTeacher={() => navigateTo('teacher_dashboard')} />
        <OnboardingModal />
        <DerivationModal />
        <ValidationDetailModal />
        <ResetConfirmModal />
        <ReportExportModal />
      </ErrorBoundary>

    </div>
  );
}
