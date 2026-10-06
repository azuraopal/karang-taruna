import React, { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { ToastContainer } from './components/common/Toast';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AdminLoadingSkeleton, PublicLoadingSkeleton } from './components/common/LoadingSkeleton';
import { getAdminRoute, getAllowedAdminTab, getDashboardPath, navigateTo } from './utils/appRoute';

const AdminLoginModal = lazy(() => import('./components/admin/AdminLoginModal').then((module) => ({ default: module.AdminLoginModal })));
const Hero = lazy(() => import('./components/public/Hero').then((module) => ({ default: module.Hero })));
const Tentang = lazy(() => import('./components/public/Tentang').then((module) => ({ default: module.Tentang })));
const Tim = lazy(() => import('./components/public/Tim').then((module) => ({ default: module.Tim })));
const Galeri = lazy(() => import('./components/public/Galeri').then((module) => ({ default: module.Galeri })));
const BeritaSection = lazy(() => import('./components/public/Berita').then((module) => ({ default: module.BeritaSection })));
const AspirasiSection = lazy(() => import('./components/public/Aspirasi').then((module) => ({ default: module.AspirasiSection })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, currentUser, isAdminLoggedIn } = useData();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const requestedRoute = getAdminRoute(currentPath);

    if (requestedRoute) {
      if (!isAdminLoggedIn || !currentUser) {
        if (currentView !== 'public') setCurrentView('public');
        navigateTo('/', { replace: true });
        return;
      }

      const expectedPath = getDashboardPath(
        currentUser.role,
        getAllowedAdminTab(currentUser.role, requestedRoute.tab),
      );

      if (currentPath !== expectedPath) {
        navigateTo(expectedPath, { replace: true });
      }
      if (currentView !== 'admin') setCurrentView('admin');
      return;
    }

  }, [currentPath, currentUser, currentView, isAdminLoggedIn, setCurrentView]);

  // If in admin mode and authenticated, display the Admin Panel
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-100 text-slate-900 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
        <ToastContainer />
        <Suspense fallback={<AdminLoadingSkeleton />}>
          <AdminLayout />
        </Suspense>
      </div>
    );
  }

  // Otherwise, display the Public Website Portal
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 font-sans antialiased selection:bg-amber-400 selection:text-slate-950 flex flex-col">
      <ToastContainer />

      {/* Public Header */}
      <Navbar onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Main Public Content */}
      <Suspense fallback={<PublicLoadingSkeleton />}>
        <main className="flex-1">
          <Hero />
          <Tentang />
          <Tim />
          <Galeri />
          <BeritaSection />
          <AspirasiSection />
        </main>
      </Suspense>

      {/* Public Footer */}
      <Footer onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Admin Login Dialog */}
      {isLoginModalOpen && (
        <Suspense fallback={null}>
          <AdminLoginModal
            isOpen
            onClose={() => setIsLoginModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
