import type { UserRole } from '../types';

export const ADMIN_TABS = ['dashboard', 'berita', 'tim', 'galeri', 'aspirasi', 'users', 'logs'] as const;

export type AdminTab = typeof ADMIN_TABS[number];

export interface AdminRoute {
  role: UserRole | null;
  tab: AdminTab;
}

const USER_ROLES: UserRole[] = ['superadmin', 'admin', 'pengurus'];

const isUserRole = (value: string): value is UserRole => USER_ROLES.includes(value as UserRole);

const isAdminTab = (value: string): value is AdminTab => ADMIN_TABS.includes(value as AdminTab);

export const getAdminRoute = (pathname = window.location.pathname): AdminRoute | null => {
  const segments = pathname.split('/').filter(Boolean);
  const roleSegment = segments[0] || '';
  const tabSegment = segments[1] || '';

  if (roleSegment === 'dashboard') {
    return { role: null, tab: 'dashboard' };
  }

  if (!isUserRole(roleSegment)) return null;

  return {
    role: roleSegment,
    tab: isAdminTab(tabSegment) ? tabSegment : 'dashboard',
  };
};

export const getAllowedAdminTab = (role: UserRole, tab: AdminTab): AdminTab => {
  if (role === 'pengurus' && (tab === 'users' || tab === 'logs')) {
    return 'dashboard';
  }

  return tab;
};

export const getDashboardPath = (role: UserRole, tab: AdminTab = 'dashboard') => {
  const allowedTab = getAllowedAdminTab(role, tab);
  return `/${role}/${allowedTab}`;
};

export const navigateTo = (path: string, options: { replace?: boolean } = {}) => {
  if (window.location.pathname === path) return;

  window.history[options.replace ? 'replaceState' : 'pushState']({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
