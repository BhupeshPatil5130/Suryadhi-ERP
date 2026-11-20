import { useAuthStore, useUIStore } from '@/store';
import { BRAND } from '@/lib/brand';
import { getInitials } from '@/lib/utils';
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Bell,
  Search,
  User,
  Settings,
  Calendar,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { showToast } from '@/lib/toast';

export default function Header() {
  const { user, logout } = useAuthStore();
  const {
    toggleSidebar,
    setSidebarMobileOpen,
    theme,
    setTheme,
    academicYear,
    setAcademicYear,
    setAcademicYearId,
    activeBrandId,
    activePortal,
  } = useUIStore();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [academicYearsList, setAcademicYearsList] = useState<string[]>([]);
  const [academicYearsRaw, setAcademicYearsRaw] = useState<any[]>([]);

  // Find logged-in brand
  const currentBrand =
    BRAND.subBrands.find(
      (b) =>
        b.id === activeBrandId ||
        b.name === activePortal ||
        b.fullName === activePortal
    ) || BRAND.subBrands[0];

  const loggedInName =
    user?.school?.name ||
    activePortal ||
    currentBrand.name;

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await apiClient.get('/lookups/academic-years');
        if (res.data.success && res.data.data?.length > 0) {
          const labels = res.data.data.map((y: any) => y.label);
          setAcademicYearsList(labels);
          setAcademicYearsRaw(res.data.data);
          
          if (!academicYear) {
            const current = res.data.data.find((y: any) => y.isCurrent);
            if (current) {
              setAcademicYear(current.label);
              setAcademicYearId(current.id);
            } else if (labels.length > 0) {
              setAcademicYear(labels[0]);
              setAcademicYearId(res.data.data[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load academic years in Header');
      }
    };
    fetchYears();
  }, [academicYear]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  // Role display helper: format super_admin / school_admin as Admin
  const displayRole = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN'
    ? 'Admin'
    : (user?.role?.replace(/_/g, ' ') || 'Admin');

  return (
    <header className="h-14 border-b border-[#2d3139] bg-[#1c1f26] text-white sticky top-0 z-50 flex items-center justify-between px-3 md:px-4 gap-3 select-none shadow-md">
      {/* Left: Mobile Toggle + SUNOIAKIDS Logo Badge + System Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => { toggleSidebar(); setSidebarMobileOpen(true); }}
          className="lg:hidden p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* SUNOIAKIDS Logo Badge (styled to match EuroKids reference box) */}
        <Link to="/dashboard" className="flex items-center shrink-0">
          <div className="bg-white px-2.5 py-1 rounded-[3px] shadow-sm flex items-center justify-center border border-white/20 select-none">
            <div className="flex flex-col items-center leading-none">
              <span className="font-black text-[15px] sm:text-[16px] tracking-tight leading-none text-[#1d4ed8]">
                SŪNOIA<span className="text-[#ea580c]">KIDS</span>
              </span>
              <div className="w-full flex justify-start pl-0.5 mt-0.5">
                <div className="h-[2px] w-5 bg-[#ea580c] rounded-full" />
              </div>
            </div>
          </div>
        </Link>

        {/* Brand System Title: SUNOIAKIDS PRE-SCHOOL MANAGEMENT SYSTEM */}
        <div className="flex items-center min-w-0">
          <span className="text-[#eab308] font-bold text-xs sm:text-[13px] md:text-sm tracking-wide sm:tracking-wider uppercase truncate select-none drop-shadow-xs">
            SUNOIAKIDS PRE-SCHOOL MANAGEMENT SYSTEM
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="hidden xl:flex items-center gap-2 bg-[#2a2e37] rounded-md px-3 py-1.5 w-52 border border-white/10 text-slate-200 focus-within:border-amber-400/50 transition-colors">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search students, enquiries..."
            className="bg-transparent text-xs text-white outline-none w-full placeholder:text-slate-400"
          />
          <kbd className="hidden 2xl:flex h-4 items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1 text-[9px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Franchise Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2a2e37] text-amber-300 text-xs font-semibold border border-amber-500/30 shadow-xs">
          <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Franchisee: <strong className="text-white font-bold">{BRAND.franchiseCode}</strong></span>
        </div>

        {/* Academic Year Display (Locked - Selected at Login) */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2a2e37] text-emerald-300 text-xs font-semibold border border-emerald-500/30 shadow-xs"
          title="Academic Year locked from login session"
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>AY: <strong className="text-white font-bold">{academicYear || 'Apr 26 - May 27'}</strong></span>
        </div>

        {/* Theme */}
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1c1f26]" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-2 border-l border-white/10 hover:bg-white/10 rounded-md py-1 pr-1.5 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <span className="text-[11px] font-bold text-amber-300">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-none text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {displayRole}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 hidden md:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900 dark:text-slate-100">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                    {displayRole}
                  </span>
                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/50">
                    {BRAND.franchiseCode}
                  </span>
                </div>
                {user?.customerId && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Customer ID: {user.customerId}
                  </p>
                )}
              </div>
              <Link
                to="/profile"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                View Profile
              </Link>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
                <Link
                  to="/manage-users"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage Users
                </Link>
              )}
              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => { setShowProfile(false); logout(); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm w-full text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
  );
}
