import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  academicYear: string;
  academicYearId: string;
  activePortal: string;
  activeBrandId: string;
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAcademicYear: (year: string) => void;
  setAcademicYearId: (id: string) => void;
  setActivePortal: (portal: string) => void;
  setActiveBrandId: (brandId: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light',
  academicYear: localStorage.getItem('academicYear') || '',
  academicYearId: localStorage.getItem('academicYearId') || '',
  activePortal: localStorage.getItem('activePortal') || '',
  activeBrandId: localStorage.getItem('activeBrandId') || 'UNIX',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', sys);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },

  setAcademicYear: (year) => {
    localStorage.setItem('academicYear', year);
    set({ academicYear: year });
  },
  setAcademicYearId: (id) => {
    localStorage.setItem('academicYearId', id);
    set({ academicYearId: id });
  },
  setActivePortal: (portal) => {
    localStorage.setItem('activePortal', portal);
    set({ activePortal: portal });
  },
  setActiveBrandId: (brandId) => {
    localStorage.setItem('activeBrandId', brandId);
    set({ activeBrandId: brandId });
  },
}));
