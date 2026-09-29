import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { ToastContainer } from './components/common/Toast';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { Hero } from './components/public/Hero';
import { Tentang } from './components/public/Tentang';
import { Tim } from './components/public/Tim';
import { Galeri } from './components/public/Galeri';
import { BeritaSection } from './components/public/Berita';
import { AspirasiSection } from './components/public/Aspirasi';
import { AdminLayout } from './components/admin/AdminLayout';

const AppContent: React.FC = () => {
  const { currentView, isAdminLoggedIn } = useData();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // If in admin mode and authenticated, display the Admin Panel
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-100 text-slate-900 font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
        <ToastContainer />
        <AdminLayout />
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
      <main className="flex-1">
        <Hero />
        <Tentang />
        <Tim />
        <Galeri />
        <BeritaSection />
        <AspirasiSection />
      </main>

      {/* Public Footer */}
      <Footer onOpenLoginModal={() => setIsLoginModalOpen(true)} />

      {/* Admin Login Dialog */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
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
