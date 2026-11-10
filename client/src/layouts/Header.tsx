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
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 gap-4 transition-all">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { toggleSidebar(); setSidebarMobileOpen(true); }}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* ERP Brand Logo in Header for quick identification */}
        <div className="flex items-center gap-2.5 pl-0.5">
          <div className="w-9 h-9 rounded-xl bg-white p-1 border border-slate-200/90 shadow-xs flex items-center justify-center shrink-0">
            <img
              src={BRAND.iconSrc}
              alt={BRAND.systemName}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline-block">
            {BRAND.systemAbbr}
          </span>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 w-60 border border-transparent focus-within:border-primary/30 transition-colors ml-1">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search students, enquiries..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50"
          />
          <kbd className="hidden lg:flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Franchise Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800/40">
          <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Franchisee: <span className="font-bold">{BRAND.franchiseCode}</span></span>
        </div>

        {/* Logged in School / Brand (Static Display - No dropdown, No switch after login) */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50/90 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/40 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src={currentBrand.logoSrc}
              alt={loggedInName}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-xs tracking-tight">{loggedInName}</span>
        </div>

        {/* Academic Year Display (Locked - Selected at Login, No Change inside ERP) */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/70 dark:border-emerald-800/40 shadow-xs"
          title="Academic Year locked from login session"
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>AY: <strong className="font-bold">{academicYear || 'Apr 26 - May 27'}</strong></span>
        </div>

        {/* Theme */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-accent transition-colors relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 ml-1 pl-3 border-l border-border hover:bg-accent rounded-lg py-1 pr-2 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {displayRole}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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
}
