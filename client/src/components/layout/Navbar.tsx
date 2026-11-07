import { useAuthStore, useUIStore } from '@/store';
import { getInitials } from '@/lib/utils';
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, theme, setTheme, academicYear } = useUIStore();

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students, enquiries..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Academic Year */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
          <span>{academicYear || 'Apr 26 - Mar 27'}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title={`Current theme: ${theme}`}
        >
          <ThemeIcon className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN'
                ? 'Admin'
                : (user?.role?.replace('_', ' ') || 'Admin')}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
