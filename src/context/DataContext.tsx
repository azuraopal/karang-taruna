import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AnggotaTim, Berita, ItemGaleri, Aspirasi, ToastMessage, UserAccount } from '../types';
import { INITIAL_TIM, INITIAL_BERITA, INITIAL_GALERI, INITIAL_ASPIRASI } from '../data/initialData';

interface DataContextType {
  // Public vs Admin Navigation
  currentView: 'public' | 'admin';
  setCurrentView: (view: 'public' | 'admin') => void;
  activePublicSection: string;
  setActivePublicSection: (section: string) => void;

  // Realtime & Connection Status
  isRealtimeConnected: boolean;
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
  refreshAllData: () => Promise<void>;
  resetAllData: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (pesan: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEYS = {
  TIM: 'kt_data_tim_v3_margabakti',
  BERITA: 'kt_data_berita_v3_margabakti',
  GALERI: 'kt_data_galeri_v3_margabakti',
  ASPIRASI: 'kt_data_aspirasi_v3_margabakti',
  AUTH: 'kt_admin_auth_v2',
  CURRENT_USER: 'kt_current_user_v2',
  USERS_LIST: 'kt_users_list_v2',
};

const DEFAULT_USERS: UserAccount[] = [
  { id: 'user-1', username: 'admin', namaLengkap: 'Administrator Utama', role: 'admin', createdAt: 'September 2026' },
  { id: 'user-2', username: 'pengurus', namaLengkap: 'Staff Pengurus Harian', role: 'pengurus', createdAt: 'September 2026' },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [activePublicSection, setActivePublicSection] = useState<string>('beranda');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(false);

  // States
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
  const hasLoadedServerDataRef = useRef(false);

  // Toast Helper
  const showToast = useCallback((pesan: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, pesan }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(userList));
  }, [userList]);

  // Central Fetch Function
  const fetchCategory = useCallback(async (category: 'berita' | 'tim' | 'galeri' | 'aspirasi' | 'users' | 'all') => {
    try {
      if (category === 'all' || category === 'berita') {
        const res = await fetch('/api/berita');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setBeritaList(data);
            hasLoadedServerDataRef.current = true;
          }
        }
      }
      if (category === 'all' || category === 'tim') {
        const res = await fetch('/api/tim');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTimList(data);
        }
      }
      if (category === 'all' || category === 'galeri') {
        const res = await fetch('/api/galeri');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setGaleriList(data);
        }
      }
      if (category === 'all' || category === 'aspirasi') {
        const res = await fetch('/api/aspirasi');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setAspirasiList(data);
        }
      }
      if (category === 'all' || category === 'users') {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setUserList(data);
        }
      }
    } catch {
      if (!hasLoadedServerDataRef.current) {
        showToast('Data server belum tersambung. Menampilkan cache lokal sementara.', 'error');
      }
    }
  }, [showToast]);

  const refreshAllData = useCallback(async () => {
    await fetchCategory('all');
  }, [fetchCategory]);

  // ---------------------- Realtime SSE Integration ----------------------
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Initial fetch on mount
    fetchCategory('all');

    // Check health once
    fetch('/api/health')
      .then((r) => r.json())
      .then((h) => {
        setIsDatabaseConnected(h.database === 'connected');
      })
      .catch(() => {});

    // Setup Server-Sent Events (SSE)
    let sse: EventSource | null = null;
    let reconnectTimeout: number | null = null;

    const connectSSE = () => {
      try {
        sse = new EventSource('/api/events');
        eventSourceRef.current = sse;

        sse.onopen = () => {
          setIsRealtimeConnected(true);
        };

        // Listen for realtime update broadcasts
        sse.addEventListener('update', (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type) {
              fetchCategory(payload.type);
            }
          } catch (e) {
            console.error('Error handling SSE update:', e);
          }
        });

        sse.onerror = () => {
          setIsRealtimeConnected(false);
          sse?.close();
          reconnectTimeout = window.setTimeout(connectSSE, 3000);
        };
      } catch {
        setIsRealtimeConnected(false);
        reconnectTimeout = window.setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    // Heartbeat safety net polling every 5s (syncs even if SSE sleep/wake on mobile)
    const intervalId = setInterval(() => {
      fetch('/api/health')
        .then((r) => r.json())
        .then((h) => {
          setIsDatabaseConnected(h.database === 'connected');
          fetchCategory('all');
        })
        .catch(() => {});
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(reconnectTimeout as number);
      sse?.close();
    };
  }, [fetchCategory]);

  // Auth Handlers
  const loginAdmin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.trim(), password: pass.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setIsAdminLoggedIn(true);
          const roleLabel = data.user.role === 'admin' ? 'Administrator' : 'Pengurus';
          showToast(`Berhasil masuk sebagai ${roleLabel} (${data.user.namaLengkap})`, 'success');
          // Fetch users list if admin
          if (data.user.role === 'admin') fetchCategory('users');
          return true;
        }
      }
    } catch {
      // offline fallback
    }

    // Offline Demo Fallbacks
    if (user.trim() === 'admin' && pass.trim() === 'katar2026') {
      const demoAdmin = DEFAULT_USERS[0];
      setCurrentUser(demoAdmin);
      setIsAdminLoggedIn(true);
      showToast('Berhasil masuk sebagai Administrator (Demo)', 'success');
      return true;
    }
    if (user.trim() === 'pengurus' && pass.trim() === 'pengurus2026') {
      const demoPengurus = DEFAULT_USERS[1];
      setCurrentUser(demoPengurus);
      setIsAdminLoggedIn(true);
      showToast('Berhasil masuk sebagai Pengurus (Demo)', 'success');
      return true;
    }

    showToast('Username atau password salah!', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('public');
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    showToast('Anda telah keluar dari Panel Pengurus', 'info');
  };

  // User Handlers (Admin Only)
  const addUser = async (item: Omit<UserAccount, 'id'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const created = await res.json();
        setUserList((prev) => [...prev, created]);
        showToast(`Pengguna "${created.namaLengkap}" berhasil ditambahkan`, 'success');
        return;
      }
    } catch {
      // fallback
    }
    const temp: UserAccount = { ...item, id: 'user-' + Date.now(), createdAt: 'September 2026' };
    setUserList((prev) => [...prev, temp]);
    showToast(`Pengguna "${temp.namaLengkap}" berhasil ditambahkan (Lokal)`, 'success');
  };

  const updateUser = async (id: string, item: Partial<UserAccount>) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const updated = await res.json();
        setUserList((prev) => prev.map((u) => (u.id === id ? updated : u)));
        if (currentUser?.id === id) {
          setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        showToast('Data pengguna berhasil diperbarui', 'success');
        return;
      }
    } catch {
      // fallback
    }
    setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, ...item } : u)));
    showToast('Data pengguna berhasil diperbarui (Lokal)', 'success');
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUserList((prev) => prev.filter((u) => u.id !== id));
        showToast('Pengguna telah dihapus', 'info');
        return;
      }
    } catch {
      // fallback
    }
    setUserList((prev) => prev.filter((u) => u.id !== id));
    showToast('Pengguna telah dihapus (Lokal)', 'info');
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
      // local fallback
    }
    showToast(`Berita "${newBerita.judul.substring(0, 30)}..." berhasil dipublikasikan`, 'success');
  };

  const updateBerita = async (id: string, updated: Partial<Berita>) => {
    setBeritaList((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
    try {
      const res = await fetch(`/api/berita/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        showToast('Gagal menyimpan perubahan berita ke server', 'error');
        return;
      }

      const saved = await res.json();
      setBeritaList((prev) => prev.map((b) => (b.id === id ? saved : b)));
    } catch {
      showToast('Server tidak dapat menyimpan perubahan berita', 'error');
      return;
    }
    showToast('Perubahan berita berhasil disimpan', 'success');
  };

  const deleteBerita = async (id: string) => {
    try {
      const res = await fetch(`/api/berita/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Gagal menghapus berita dari server', 'error');
        return;
      }

      setBeritaList((prev) => prev.filter((b) => b.id !== id));
      showToast('Berita telah dihapus', 'info');
      return;
    } catch {
      showToast('Server tidak dapat dihubungi, berita belum dihapus', 'error');
      return;
    }
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
    } catch {}
    showToast(`Anggota tim ${newAnggota.nama} berhasil ditambahkan`, 'success');
  };

  const updateAnggotaTim = async (id: string, updated: Partial<AnggotaTim>) => {
    setTimList((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    try {
      await fetch(`/api/tim/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    showToast('Data pengurus tim berhasil diperbarui', 'success');
  };

  const deleteAnggotaTim = async (id: string) => {
    setTimList((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tim/${id}`, { method: 'DELETE' });
    } catch {}
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
    } catch {}
    showToast(`Foto kegiatan "${newGaleri.judul}" ditambahkan ke galeri`, 'success');
  };

  const updateGaleri = async (id: string, updated: Partial<ItemGaleri>) => {
    setGaleriList((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    try {
      await fetch(`/api/galeri/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    showToast('Data dokumentasi galeri berhasil diperbarui', 'success');
  };

  const deleteGaleri = async (id: string) => {
    setGaleriList((prev) => prev.filter((g) => g.id !== id));
    try {
      await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
    } catch {}
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
    const newAspirasi: Aspirasi = { ...item, id: tempId, tanggal: tanggalSekarang, status: 'baru' };
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
    } catch {}
    showToast('Terima kasih, aspirasi Anda telah kami terima untuk ditindaklanjuti!', 'success');
  };

  const updateStatusAspirasi = async (id: string, status: Aspirasi['status']) => {
    setAspirasiList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await fetch(`/api/aspirasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}
    showToast(`Status aspirasi diubah menjadi "${status}"`, 'info');
  };

  const deleteAspirasi = async (id: string) => {
    setAspirasiList((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/aspirasi/${id}`, { method: 'DELETE' });
    } catch {}
    showToast('Aspirasi telah dihapus dari arsip', 'info');
  };

  // Reset to seed data
  const resetAllData = async () => {
    setTimList(INITIAL_TIM);
    setBeritaList(INITIAL_BERITA);
    setGaleriList(INITIAL_GALERI);
    setAspirasiList(INITIAL_ASPIRASI);
    setUserList(DEFAULT_USERS);
    localStorage.removeItem(STORAGE_KEYS.TIM);
    localStorage.removeItem(STORAGE_KEYS.BERITA);
    localStorage.removeItem(STORAGE_KEYS.GALERI);
    localStorage.removeItem(STORAGE_KEYS.ASPIRASI);
    localStorage.removeItem(STORAGE_KEYS.USERS_LIST);

    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch {}
    showToast('Seluruh data berhasil di-reset kembali ke data awal', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        currentView,
        setCurrentView,
        activePublicSection,
        setActivePublicSection,
        isRealtimeConnected,
        isDatabaseConnected,
        currentUser,
        isAdminLoggedIn,
        loginAdmin,
        logoutAdmin,
        userList,
        addUser,
        updateUser,
        deleteUser,
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
        refreshAllData,
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
