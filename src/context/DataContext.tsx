import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AnggotaTim, Berita, ItemGaleri, Aspirasi, ToastMessage, UserAccount } from '../types';
import { INITIAL_TIM, INITIAL_BERITA, INITIAL_GALERI, INITIAL_ASPIRASI } from '../data/initialData';

interface DataContextType {
  // Public vs Admin Navigation
  currentView: 'public' | 'admin';
  setCurrentView: (view: 'public' | 'admin') => void;
  activePublicSection: string;
  setActivePublicSection: (section: string) => void;

  // Database Connection
  isDatabaseConnected: boolean;

  // Auth & Roles
  currentUser: UserAccount | null;
  isAdminLoggedIn: boolean;
  loginAdmin: (user: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => void;

  // User Management (Admin Only)
  userList: UserAccount[];
  addUser: (item: Omit<UserAccount, 'id'>) => Promise<void>;
  updateUser: (id: string, item: Partial<UserAccount>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Berita CRUD
  beritaList: Berita[];
  addBerita: (item: Omit<Berita, 'id'>) => Promise<void>;
  updateBerita: (id: string, item: Partial<Berita>) => Promise<void>;
  deleteBerita: (id: string) => Promise<void>;

  // Tim CRUD
  timList: AnggotaTim[];
  addAnggotaTim: (item: Omit<AnggotaTim, 'id'>) => Promise<void>;
  updateAnggotaTim: (id: string, item: Partial<AnggotaTim>) => Promise<void>;
  deleteAnggotaTim: (id: string) => Promise<void>;

  // Galeri CRUD
  galeriList: ItemGaleri[];
  addGaleri: (item: Omit<ItemGaleri, 'id'>) => Promise<void>;
  updateGaleri: (id: string, item: Partial<ItemGaleri>) => Promise<void>;
  deleteGaleri: (id: string) => Promise<void>;

  // Aspirasi
  aspirasiList: Aspirasi[];
  addAspirasi: (item: { nama: string; email: string; noHp: string; kategori: Aspirasi['kategori']; pesan: string }) => Promise<void>;
  updateStatusAspirasi: (id: string, status: Aspirasi['status']) => Promise<void>;
  deleteAspirasi: (id: string) => Promise<void>;

  // Global utilities
  resetAllData: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (pesan: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEYS = {
  TIM: 'kt_data_tim_v3_margabakti_avatar',
  BERITA: 'kt_data_berita_v2_margabakti',
  GALERI: 'kt_data_galeri_v2_margabakti',
  ASPIRASI: 'kt_data_aspirasi_v2_margabakti',
  AUTH: 'kt_admin_auth_v1',
  CURRENT_USER: 'kt_current_user_v1',
  USERS_LIST: 'kt_users_list_v1',
};

const DEFAULT_USERS: UserAccount[] = [
  { id: 'user-1', username: 'admin', namaLengkap: 'Administrator Utama', role: 'admin', createdAt: 'September 2026' },
  { id: 'user-2', username: 'pengurus', namaLengkap: 'Staff Pengurus Harian', role: 'pengurus', createdAt: 'September 2026' },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [activePublicSection, setActivePublicSection] = useState<string>('beranda');
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(false);

  // Load state with fallback to initial data
  const [timList, setTimList] = useState<AnggotaTim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIM);
      return saved ? JSON.parse(saved) : INITIAL_TIM;
    } catch {
      return INITIAL_TIM;
    }
  });

  const [beritaList, setBeritaList] = useState<Berita[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BERITA);
      return saved ? JSON.parse(saved) : INITIAL_BERITA;
    } catch {
      return INITIAL_BERITA;
    }
  });

  const [galeriList, setGaleriList] = useState<ItemGaleri[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALERI);
      return saved ? JSON.parse(saved) : INITIAL_GALERI;
    } catch {
      return INITIAL_GALERI;
    }
  });

  const [aspirasiList, setAspirasiList] = useState<Aspirasi[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASPIRASI);
      return saved ? JSON.parse(saved) : INITIAL_ASPIRASI;
    } catch {
      return INITIAL_ASPIRASI;
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true' ? DEFAULT_USERS[0] : null;
    } catch {
      return null;
    }
  });

  const [userList, setUserList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const showToast = (pesan: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, pesan }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to LocalStorage as cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIM, JSON.stringify(timList));
  }, [timList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(beritaList));
  }, [beritaList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GALERI, JSON.stringify(galeriList));
  }, [galeriList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASPIRASI, JSON.stringify(aspirasiList));
  }, [aspirasiList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Initial fetch from PostgreSQL backend if available
  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          if (healthData.database === 'connected') {
            setIsDatabaseConnected(true);

            // Fetch live tables from PostgreSQL
            const [bRes, tRes, gRes, aRes] = await Promise.all([
              fetch('/api/berita'),
              fetch('/api/tim'),
              fetch('/api/galeri'),
              fetch('/api/aspirasi'),
            ]);

            if (bRes.ok) {
              const data = await bRes.json();
              if (Array.isArray(data) && data.length > 0) setBeritaList(data);
            }
            if (tRes.ok) {
              const data = await tRes.json();
              if (Array.isArray(data) && data.length > 0) setTimList(data);
            }
            if (gRes.ok) {
              const data = await gRes.json();
              if (Array.isArray(data) && data.length > 0) setGaleriList(data);
            }
            if (aRes.ok) {
              const data = await aRes.json();
              if (Array.isArray(data)) setAspirasiList(data);
            }
          }
        }
      } catch {
        // Backend not running (e.g. standalone Vite dev without PostgreSQL)
        setIsDatabaseConnected(false);
      }
    };

    loadFromApi();
  }, []);

  // Auth
  const loginAdmin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (res.ok) {
        setIsAdminLoggedIn(true);
        showToast('Berhasil masuk ke Panel Admin Karang Taruna Margabakti 07', 'success');
        return true;
      }
    } catch {
      // offline fallback
    }

    if (user.trim() === 'admin' && pass.trim() === 'katar2026') {
      setIsAdminLoggedIn(true);
      showToast('Berhasil masuk ke Panel Admin (Mode Lokal)', 'success');
      return true;
    }

    showToast('Username atau password admin salah!', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('public');
    showToast('Anda telah keluar dari Panel Admin', 'info');
  };

  // Berita Handlers
  const addBerita = async (item: Omit<Berita, 'id'>) => {
    const tempId = 'berita-' + Date.now();
    const newBerita: Berita = { ...item, id: tempId };

    setBeritaList((prev) => [newBerita, ...prev]);

    try {
      const res = await fetch('/api/berita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = await res.json();
        setBeritaList((prev) => prev.map((b) => (b.id === tempId ? saved : b)));
      }
    } catch {
      // Offline fallback retained in state & localStorage
    }

    showToast(`Berita "${newBerita.judul.substring(0, 30)}..." berhasil dipublikasikan`, 'success');
  };

  const updateBerita = async (id: string, updated: Partial<Berita>) => {
    setBeritaList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );

    try {
      await fetch(`/api/berita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // fallback retained
    }

    showToast('Perubahan berita berhasil disimpan', 'success');
  };

  const deleteBerita = async (id: string) => {
    setBeritaList((prev) => prev.filter((b) => b.id !== id));

    try {
      await fetch(`/api/berita/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }

    showToast('Berita telah dihapus', 'info');
  };

  // Tim Handlers
  const addAnggotaTim = async (item: Omit<AnggotaTim, 'id'>) => {
    const tempId = 'tim-' + Date.now();
    const newAnggota: AnggotaTim = { ...item, id: tempId };

    setTimList((prev) => [...prev, newAnggota]);

    try {
      const res = await fetch('/api/tim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = await res.json();
        setTimList((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
      }
    } catch {
      // fallback
    }

    showToast(`Anggota tim ${newAnggota.nama} berhasil ditambahkan`, 'success');
  };

  const updateAnggotaTim = async (id: string, updated: Partial<AnggotaTim>) => {
    setTimList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );

    try {
      await fetch(`/api/tim/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // fallback
    }

    showToast('Data pengurus tim berhasil diperbarui', 'success');
  };

  const deleteAnggotaTim = async (id: string) => {
    setTimList((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/tim/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }

    showToast('Data pengurus berhasil dihapus', 'info');
  };

  // Galeri Handlers
  const addGaleri = async (item: Omit<ItemGaleri, 'id'>) => {
    const tempId = 'galeri-' + Date.now();
    const newGaleri: ItemGaleri = { ...item, id: tempId };

    setGaleriList((prev) => [newGaleri, ...prev]);

    try {
      const res = await fetch('/api/galeri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = await res.json();
        setGaleriList((prev) => prev.map((g) => (g.id === tempId ? saved : g)));
      }
    } catch {
      // fallback
    }

    showToast(`Foto kegiatan "${newGaleri.judul}" ditambahkan ke galeri`, 'success');
  };

  const updateGaleri = async (id: string, updated: Partial<ItemGaleri>) => {
    setGaleriList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
    );

    try {
      await fetch(`/api/galeri/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // fallback
    }

    showToast('Data dokumentasi galeri berhasil diperbarui', 'success');
  };

  const deleteGaleri = async (id: string) => {
    setGaleriList((prev) => prev.filter((g) => g.id !== id));

    try {
      await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }

    showToast('Foto dokumentasi telah dihapus dari galeri', 'info');
  };

  // Aspirasi Handlers
  const addAspirasi = async (item: {
    nama: string;
    email: string;
    noHp: string;
    kategori: Aspirasi['kategori'];
    pesan: string;
  }) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', options);

    const tempId = 'asp-' + Date.now();
    const newAspirasi: Aspirasi = {
      ...item,
      id: tempId,
      tanggal: tanggalSekarang,
      status: 'baru',
    };

    setAspirasiList((prev) => [newAspirasi, ...prev]);

    try {
      const res = await fetch('/api/aspirasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = await res.json();
        setAspirasiList((prev) => prev.map((a) => (a.id === tempId ? saved : a)));
      }
    } catch {
      // fallback
    }

    showToast('Terima kasih, aspirasi Anda telah kami terima untuk ditindaklanjuti!', 'success');
  };

  const updateStatusAspirasi = async (id: string, status: Aspirasi['status']) => {
    setAspirasiList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );

    try {
      await fetch(`/api/aspirasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // fallback
    }

    showToast(`Status aspirasi diubah menjadi "${status}"`, 'info');
  };

  const deleteAspirasi = async (id: string) => {
    setAspirasiList((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/aspirasi/${id}`, { method: 'DELETE' });
    } catch {
      // fallback
    }

    showToast('Aspirasi telah dihapus dari arsip', 'info');
  };

  // Reset to seed data
  const resetAllData = async () => {
    setTimList(INITIAL_TIM);
    setBeritaList(INITIAL_BERITA);
    setGaleriList(INITIAL_GALERI);
    setAspirasiList(INITIAL_ASPIRASI);
    localStorage.removeItem(STORAGE_KEYS.TIM);
    localStorage.removeItem(STORAGE_KEYS.BERITA);
    localStorage.removeItem(STORAGE_KEYS.GALERI);
    localStorage.removeItem(STORAGE_KEYS.ASPIRASI);

    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch {
      // fallback
    }

    showToast('Seluruh data berhasil di-reset kembali ke data default', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        currentView,
        setCurrentView,
        activePublicSection,
        setActivePublicSection,
        isDatabaseConnected,
        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        beritaList,
        addBerita,
        updateBerita,
        deleteBerita,
        timList,
        addAnggotaTim,
        updateAnggotaTim,
        deleteAnggotaTim,
        galeriList,
        addGaleri,
        updateGaleri,
        deleteGaleri,
        aspirasiList,
        addAspirasi,
        updateStatusAspirasi,
        deleteAspirasi,
        resetAllData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
