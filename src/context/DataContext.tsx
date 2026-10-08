import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityAction, ActivityEntity, ActivityLog, AnggotaTim, Berita, ItemGaleri, Aspirasi, ToastMessage, UserAccount } from '../types';
import { navigateTo } from '../utils/appRoute';
import { createReadQueue, DATA_CATEGORIES, startDataSync, type DataCategory } from '../utils/dataSync';

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
  loginAdmin: (user: string, pass: string) => Promise<{ success: boolean; error?: string; user?: UserAccount }>;
  logoutAdmin: () => Promise<void>;

  // User Management (Admin Only)
  userList: UserAccount[];
  addUser: (item: Omit<UserAccount, 'id'>) => Promise<void>;
  updateUser: (id: string, item: Partial<UserAccount>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  activityLogs: ActivityLog[];

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
  ACTIVITY_LOGS: 'kt_activity_logs_v1',
};

const DEFAULT_USERS: UserAccount[] = [
  { id: 'user-0', username: 'superadmin', namaLengkap: 'Super Administrator', role: 'superadmin', createdAt: 'September 2026' },
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [beritaList, setBeritaList] = useState<Berita[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BERITA);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [galeriList, setGaleriList] = useState<ItemGaleri[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALERI);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [aspirasiList, setAspirasiList] = useState<Aspirasi[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASPIRASI);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addActivityLog = useCallback((action: ActivityAction, entity: ActivityEntity, description: string, actor = currentUser) => {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      entity,
      description,
      actorName: actor?.namaLengkap || 'Warga / Publik',
      actorRole: actor?.role || 'public',
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => [log, ...prev].slice(0, 300));
    void fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(() => {
      // Keep the local cache when the server is unavailable.
    });
  }, [currentUser]);

  const readQueue = useRef(createReadQueue<DataCategory>());
  // Central reads are shared across initial load, manual refresh and realtime events.
  const fetchCategory = useCallback(async function fetchCategory(category: DataCategory | 'all', invalidate = false): Promise<void> {
    if (category === 'all') {
      await Promise.all(DATA_CATEGORIES.map(item => fetchCategory(item, invalidate)));
      return;
    }
    if (category === 'users' && !isAdminLoggedIn) return;
    return readQueue.current(category, async () => {
    try {
      if (category === 'berita') {
        const res = await fetch('/api/berita');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setBeritaList(data);
            hasLoadedServerDataRef.current = true;
          }
        }
      }
      if (category === 'tim') {
        const res = await fetch('/api/tim');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTimList(data);
        }
      }
      if (category === 'galeri') {
        const res = await fetch('/api/galeri');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setGaleriList(data);
        }
      }
      if (category === 'aspirasi') {
        const res = await fetch('/api/aspirasi');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setAspirasiList(data);
        }
      }
      if (category === 'users') {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const loggedInAccount = currentUser ? data.find((user: UserAccount) => user.id === currentUser.id) : null;
            if (isAdminLoggedIn && currentUser && loggedInAccount?.isActive === false) {
              setIsAdminLoggedIn(false);
              setCurrentUser(null);
              setCurrentView('public');
              localStorage.removeItem(STORAGE_KEYS.AUTH);
              localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
              showToast('Akun Anda telah dinonaktifkan. Anda telah keluar dari panel.', 'error');
            }
            setUserList(data);
          }
        }
      }
      if (category === 'logs') {
        const res = await fetch('/api/logs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setActivityLogs(data);
        }
      }
    } catch {
      if (!hasLoadedServerDataRef.current) {
        showToast('Data server belum tersambung. Menampilkan cache lokal sementara.', 'error');
      }
    }
    }, invalidate);
  }, [currentUser, isAdminLoggedIn, showToast]);

  const refreshAllData = useCallback(async () => {
    await fetchCategory('all');
  }, [fetchCategory]);

  // ---------------------- Realtime SSE Integration ----------------------
  useEffect(() => {
    const abort = new AbortController();
    const stop = startDataSync({
      refresh: fetchCategory,
      connection: setIsRealtimeConnected,
      health: () => {
        void fetch('/api/health', { signal: abort.signal })
          .then(r => r.json())
          .then(h => { if (!abort.signal.aborted) setIsDatabaseConnected(h.database === 'connected'); })
          .catch(() => {});
      },
    });
    return () => {
      abort.abort();
      stop();
    };
  }, [fetchCategory]);

  // Serialize cookie-changing auth operations, even when callers do not await logout.
  const authRequests = useRef<Promise<void>>(Promise.resolve());
  // Auth Handlers
  const loginAdmin = (user: string, pass: string): Promise<{ success: boolean; error?: string; user?: UserAccount }> => {
    const operation = authRequests.current.then(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.trim(), password: pass.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          const account = data?.user;
          const validIdentity = account && typeof account === 'object'
            && typeof account.id === 'string' && !!account.id.trim()
            && typeof account.username === 'string' && !!account.username.trim()
            && typeof account.namaLengkap === 'string' && !!account.namaLengkap.trim()
            && ['superadmin', 'admin', 'pengurus'].includes(account.role)
            && (account.isActive === undefined || account.isActive === true);
          if (data?.success === true && validIdentity) {
            setCurrentUser(data.user);
            setIsAdminLoggedIn(true);
            addActivityLog('login', 'Sistem', `Masuk ke panel sebagai ${data.user.role === 'admin' ? 'Administrator' : 'Pengurus'}`, data.user);
            const roleLabel = data.user.role === 'superadmin'
              ? 'Super Admin'
              : data.user.role === 'admin'
                ? 'Administrator'
                : 'Pengurus';
            showToast(`Berhasil masuk sebagai ${roleLabel} (${data.user.namaLengkap})`, 'success');
            // Fetch users list if admin
            return { success: true, user: data.user };
          }
        }
        const data = await res.json().catch(() => ({}));
        const error = typeof data.error === 'string' ? data.error
          : res.status === 401 ? 'Username atau password salah!'
          : res.status === 403 ? 'Akun Anda telah dinonaktifkan.'
          : 'Tidak dapat masuk. Respons server tidak valid atau server sedang tidak tersedia.';
        showToast(error, 'error');
        return { success: false, error };
      } catch {
        const error = 'Tidak dapat terhubung ke server. Silakan coba lagi.';
        showToast(error, 'error');
        return { success: false, error };
      }
    });
    authRequests.current = operation.then(() => undefined, () => undefined);
    return operation;
  };

  const logoutAdmin = (): Promise<void> => {
    const operation = authRequests.current.then(async () => {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      setIsAdminLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('public');
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      navigateTo('/');
      showToast('Anda telah keluar dari Panel Pengurus', 'info');
    });
    authRequests.current = operation.then(() => undefined, () => undefined);
    return operation;
  };

  // User Handlers (Admin Only)
  const addUser = async (item: Omit<UserAccount, 'id'>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, dibuatOleh: currentUser?.namaLengkap || 'Sistem', actorRole: currentUser?.role }),
      });
      if (res.status === 403) {
        showToast('Hanya Super Admin yang dapat mengelola akun pengguna.', 'error');
        return;
      }
      if (res.ok) {
        const created = await res.json();
        const createdWithActor: UserAccount = { ...created, dibuatOleh: currentUser?.namaLengkap || 'Sistem' };
        setUserList((prev) => [...prev, createdWithActor]);
        addActivityLog('tambah', 'Pengguna', `Menambahkan akun pengguna "${created.namaLengkap}"`);
        showToast(`Pengguna "${createdWithActor.namaLengkap}" berhasil ditambahkan`, 'success');
        return;
      }
    } catch {
      // fallback
    }
    const temp: UserAccount = { ...item, id: 'user-' + Date.now(), createdAt: 'September 2026', dibuatOleh: currentUser?.namaLengkap || 'Sistem' };
    setUserList((prev) => [...prev, temp]);
    addActivityLog('tambah', 'Pengguna', `Menambahkan akun pengguna "${temp.namaLengkap}"`);
    showToast(`Pengguna "${temp.namaLengkap}" berhasil ditambahkan (Lokal)`, 'success');
  };

  const updateUser = async (id: string, item: Partial<UserAccount>) => {
    if (currentUser?.role !== 'superadmin') {
      showToast('Hanya Super Admin yang dapat mengubah akun pengguna.', 'error');
      return;
    }
    const existingUser = userList.find((user) => user.id === id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, dibuatOleh: currentUser?.namaLengkap || 'Sistem', actorRole: currentUser?.role }),
      });
      if (res.status === 403) {
        showToast('Hanya Super Admin yang dapat mengelola akun pengguna.', 'error');
        return;
      }
      if (res.ok) {
        const updated = await res.json();
        setUserList((prev) => prev.map((u) => (u.id === id ? updated : u)));
        if (currentUser?.id === id) {
          setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        addActivityLog('ubah', 'Pengguna', `Mengubah akun pengguna "${updated.namaLengkap || existingUser?.namaLengkap || 'Tanpa nama'}"`);
        showToast('Data pengguna berhasil diperbarui', 'success');
        return;
      }
    } catch {
      // fallback
    }
    setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, ...item } : u)));
    addActivityLog('ubah', 'Pengguna', `Mengubah akun pengguna "${item.namaLengkap || existingUser?.namaLengkap || 'Tanpa nama'}"`);
    showToast('Data pengguna berhasil diperbarui (Lokal)', 'success');
  };

  const deleteUser = async (id: string) => {
    const existingUser = userList.find((user) => user.id === id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: currentUser?.role }),
      });
      if (res.status === 403) {
        showToast('Hanya Super Admin yang dapat mengelola akun pengguna.', 'error');
        return;
      }
      if (res.ok) {
        setUserList((prev) => prev.filter((u) => u.id !== id));
        addActivityLog('hapus', 'Pengguna', `Menghapus akun pengguna "${existingUser?.namaLengkap || 'Tanpa nama'}"`);
        showToast('Pengguna telah dihapus', 'info');
        return;
      }
    } catch {
      // fallback
    }
    setUserList((prev) => prev.filter((u) => u.id !== id));
    addActivityLog('hapus', 'Pengguna', `Menghapus akun pengguna "${existingUser?.namaLengkap || 'Tanpa nama'}"`);
    showToast('Pengguna telah dihapus (Lokal)', 'info');
  };

  // Berita Handlers
  const addBerita = async (item: Omit<Berita, 'id'>) => {
    const tempId = 'berita-' + Date.now();
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const beritaOtomatis = {
      ...item,
      tanggal: tanggalSekarang,
      penulis: currentUser?.namaLengkap || 'Sistem',
    };
    const newBerita: Berita = { ...beritaOtomatis, id: tempId, dibuatOleh: currentUser?.namaLengkap || 'Sistem' };
    setBeritaList((prev) => [newBerita, ...prev]);

    try {
      const res = await fetch('/api/berita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...beritaOtomatis, dibuatOleh: currentUser?.namaLengkap || 'Sistem' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setBeritaList((prev) => prev.map((b) => (b.id === tempId ? { ...saved, dibuatOleh: newBerita.dibuatOleh } : b)));
      }
    } catch {
      // local fallback
    }
    showToast(`Berita "${newBerita.judul.substring(0, 30)}..." berhasil dipublikasikan`, 'success');
    addActivityLog('tambah', 'Berita', `Menambahkan berita "${newBerita.judul}"`);
  };

  const updateBerita = async (id: string, updated: Partial<Berita>) => {
    const existingBerita = beritaList.find((item) => item.id === id);
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
    addActivityLog('ubah', 'Berita', `Mengubah berita "${updated.judul || existingBerita?.judul || 'Tanpa judul'}"`);
  };

  const deleteBerita = async (id: string) => {
    const existingBerita = beritaList.find((item) => item.id === id);
    try {
      const res = await fetch(`/api/berita/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Gagal menghapus berita dari server', 'error');
        return;
      }

      setBeritaList((prev) => prev.filter((b) => b.id !== id));
      showToast('Berita telah dihapus', 'info');
      addActivityLog('hapus', 'Berita', `Menghapus berita "${existingBerita?.judul || 'Tanpa judul'}"`);
      return;
    } catch {
      showToast('Server tidak dapat dihubungi, berita belum dihapus', 'error');
      return;
    }
  };

  // Tim Handlers
  const addAnggotaTim = async (item: Omit<AnggotaTim, 'id'>) => {
    const tempId = 'tim-' + Date.now();
    const newAnggota: AnggotaTim = { ...item, id: tempId, dibuatOleh: currentUser?.namaLengkap || 'Sistem' };
    setTimList((prev) => [...prev, newAnggota]);

    try {
      const res = await fetch('/api/tim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, dibuatOleh: currentUser?.namaLengkap || 'Sistem' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setTimList((prev) => prev.map((t) => (t.id === tempId ? { ...saved, dibuatOleh: newAnggota.dibuatOleh } : t)));
      }
    } catch {}
    showToast(`Anggota tim ${newAnggota.nama} berhasil ditambahkan`, 'success');
    addActivityLog('tambah', 'Tim Pengurus', `Menambahkan anggota tim "${newAnggota.nama}"`);
  };

  const updateAnggotaTim = async (id: string, updated: Partial<AnggotaTim>) => {
    const existingAnggota = timList.find((item) => item.id === id);
    setTimList((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    try {
      await fetch(`/api/tim/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    showToast('Data pengurus tim berhasil diperbarui', 'success');
    addActivityLog('ubah', 'Tim Pengurus', `Mengubah kegiatan/pengurus "${updated.nama || existingAnggota?.nama || 'Tanpa nama'}"`);
  };

  const deleteAnggotaTim = async (id: string) => {
    const existingAnggota = timList.find((item) => item.id === id);
    setTimList((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tim/${id}`, { method: 'DELETE' });
    } catch {}
    showToast('Data pengurus berhasil dihapus', 'info');
    addActivityLog('hapus', 'Tim Pengurus', `Menghapus kegiatan/pengurus "${existingAnggota?.nama || 'Tanpa nama'}"`);
  };

  // Galeri Handlers
  const addGaleri = async (item: Omit<ItemGaleri, 'id'>) => {
    const tempId = 'galeri-' + Date.now();
    const newGaleri: ItemGaleri = { ...item, id: tempId, dibuatOleh: currentUser?.namaLengkap || 'Sistem' };
    setGaleriList((prev) => [newGaleri, ...prev]);

    try {
      const res = await fetch('/api/galeri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, dibuatOleh: currentUser?.namaLengkap || 'Sistem' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setGaleriList((prev) => prev.map((g) => (g.id === tempId ? { ...saved, dibuatOleh: newGaleri.dibuatOleh } : g)));
      }
    } catch {}
    showToast(`Foto kegiatan "${newGaleri.judul}" ditambahkan ke galeri`, 'success');
    addActivityLog('tambah', 'Galeri', `Menambahkan foto galeri "${newGaleri.judul}"`);
  };

  const updateGaleri = async (id: string, updated: Partial<ItemGaleri>) => {
    const existingGaleri = galeriList.find((item) => item.id === id);
    setGaleriList((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    try {
      await fetch(`/api/galeri/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    showToast('Data dokumentasi galeri berhasil diperbarui', 'success');
    addActivityLog('ubah', 'Galeri', `Mengubah kegiatan "${updated.judul || existingGaleri?.judul || 'Tanpa judul'}"`);
  };

  const deleteGaleri = async (id: string) => {
    const existingGaleri = galeriList.find((item) => item.id === id);
    setGaleriList((prev) => prev.filter((g) => g.id !== id));
    try {
      await fetch(`/api/galeri/${id}`, { method: 'DELETE' });
    } catch {}
    showToast('Foto dokumentasi telah dihapus dari galeri', 'info');
    addActivityLog('hapus', 'Galeri', `Menghapus kegiatan "${existingGaleri?.judul || 'Tanpa judul'}"`);
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
    const newAspirasi: Aspirasi = { ...item, id: tempId, tanggal: tanggalSekarang, status: 'baru', dibuatOleh: currentUser?.namaLengkap || 'Warga / Publik' };
    setAspirasiList((prev) => [newAspirasi, ...prev]);

    try {
      const res = await fetch('/api/aspirasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, dibuatOleh: currentUser?.namaLengkap || 'Warga / Publik' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setAspirasiList((prev) => prev.map((a) => (a.id === tempId ? { ...saved, dibuatOleh: newAspirasi.dibuatOleh } : a)));
      }
    } catch {}
    showToast('Terima kasih, aspirasi Anda telah kami terima untuk ditindaklanjuti!', 'success');
    addActivityLog('tambah', 'Aspirasi', `Menerima aspirasi dari "${newAspirasi.nama}"`, currentUser);
  };

  const updateStatusAspirasi = async (id: string, status: Aspirasi['status']) => {
    const existingAspirasi = aspirasiList.find((item) => item.id === id);
    setAspirasiList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await fetch(`/api/aspirasi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {}
    showToast(`Status aspirasi diubah menjadi "${status}"`, 'info');
    addActivityLog('status', 'Aspirasi', `Mengubah status aspirasi dari "${existingAspirasi?.nama || 'Warga'}" menjadi "${status}"`);
  };

  const deleteAspirasi = async (id: string) => {
    const existingAspirasi = aspirasiList.find((item) => item.id === id);
    setAspirasiList((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/aspirasi/${id}`, { method: 'DELETE' });
    } catch {}
    showToast('Aspirasi telah dihapus dari arsip', 'info');
    addActivityLog('hapus', 'Aspirasi', `Menghapus aspirasi dari "${existingAspirasi?.nama || 'Warga'}"`);
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
        activityLogs,
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
