import React, { useState } from 'react';
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

import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  const navigateTo = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#05070d] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Animated Flow Lines Background */}
      <FluidBackground />

      {/* Navigation Header */}
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />

      {/* Main Content View Switcher */}
      <main className="flex-1 relative z-10">
        {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
        {currentPage === 'subject' && <SubjectSelectPage onNavigate={navigateTo} />}
        {currentPage === 'experiment' && <ExperimentSelectPage onNavigate={navigateTo} />}
        {currentPage === 'workspace' && (
          <ErrorBoundary>
            <WorkspacePage onNavigate={navigateTo} />
          </ErrorBoundary>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Watermark in Bottom-Right Corner */}
      <Watermark />

      {/* Persistent Floating AI Assistant Widget */}
      <AIChatWidget />

      {/* Modals & Dialogs */}
      <OnboardingModal />
      <DerivationModal />
      <ValidationDetailModal />
      <ResetConfirmModal />
      <ReportExportModal />

    </div>
  );
}
