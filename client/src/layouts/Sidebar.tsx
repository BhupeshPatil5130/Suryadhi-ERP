import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import { BRAND } from '@/lib/brand';
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Headphones,
  Video,
  Users,
  RefreshCw,
  Package,
  FileText,
  Wallet,
  Building2,
  ClipboardList,
  Wrench,
  AlertTriangle,
  ChevronDown,
  X,
  Settings,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: string;
  children?: { label: string; href: string }[];
}

const navigation: SidebarItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'Enrollment Dashboard',
    icon: BarChart3,
    children: [
      { label: 'Overall Enrollment Summary', href: '/enrollment/summary' },
      { label: 'Source Wise Enquiries', href: '/enrollment/source-wise' },
      { label: 'Retention Base vs Conversion', href: '/enrollment/retention-base' },
      { label: 'Retention Growth', href: '/enrollment/retention-growth' },
      { label: 'New Business Growth', href: '/enrollment/new-business' },
    ],
  },
  {
    label: 'Communications',
    icon: MessageSquare,
    children: [
      { label: 'Business Team Visits', href: '/communications/business-visits' },
      { label: 'Academics Team Visits', href: '/communications/academics-visits' },
      { label: 'App Report', href: '/communications/app-report' },
    ],
  },
  { label: 'Support', icon: Headphones, href: '/support' },
  { label: 'Video Library', icon: Video, href: '/video-library', badge: 'New' },
  {
    label: 'Enrollments',
    icon: Users,
    children: [
      { label: 'Enquiry', href: '/enquiry' },
      { label: 'Admission', href: '/admission' },
      { label: 'Graduation via SEMS App', href: '/graduation/homebuddy' },
      { label: 'School Transfer Requests', href: '/transfers/requests' },
      { label: 'Manage Transfer Stage', href: '/transfers/manage-stage' },
      { label: 'Manage Quit Admission', href: '/quit-admission-manage' },
      { label: 'Name change confirmation', href: '/name-change-confirm' },
      { label: 'Inventory Details', href: '/inventory-details' },
    ],
  },
  { label: 'Program Change', icon: RefreshCw, href: '/program-change' },
  {
    label: 'Operations',
    icon: Package,
    children: [
      { label: 'Exchange Order', href: '/operations/exchange' },
      { label: 'Purchase Order', href: '/operations/purchase' },
    ],
  },
  {
    label: 'Statement Of Account',
    icon: FileText,
    children: [
      { label: 'SOA Summary', href: '/soa/summary' },
      { label: 'SOA Details', href: '/soa/details' },
    ],
  },
  {
    label: 'Fee Collection',
    icon: Wallet,
    children: [
      { label: 'Deposit Slip - Automated', href: '/fees/deposit' },
      { label: 'Convert Cash to Cheque', href: '/fees/cash-to-cheque' },
      { label: 'Convert Cash to Online', href: '/fees/cash-to-online' },
      { label: 'Print & View Deposit Slip', href: '/fees/deposit-history' },
      { label: 'Funds Transfer Summary', href: '/fees/funds-transfer' },
      { label: 'Fee Collection via HomeSunny App', href: '/fees/homebuddy' },
      { label: 'Online Payment Detail', href: '/fees/online-payments' },
    ],
  },
  {
    label: 'Franchisee',
    icon: Building2,
    children: [
      { label: 'Invoice Details', href: '/franchisee/invoices' },
      { label: 'Invoice Download', href: '/franchisee/invoice-download' },
      { label: 'Receipt Download', href: '/franchisee/receipt-download' },
      { label: 'Coach List', href: '/franchisee/coach-list' },
    ],
  },
  {
    label: 'Reports',
    icon: ClipboardList,
    children: [
      { label: 'Admission Details', href: '/reports/admissions' },
      { label: 'Fee Card Details', href: '/reports/fee-card' },
      { label: 'Enquiry Details', href: '/reports/enquiries' },
      { label: 'LeadSuryadhi Enquiry Details', href: '/reports/lsq-enquiries' },
      { label: 'Payment Due Report', href: '/reports/payment-due' },
      { label: 'Cancelled Receipt Details', href: '/reports/cancelled-receipts' },
      { label: 'Transferred Student Report', href: '/reports/transfers' },
      { label: 'FCR', href: '/reports/fcr' },
      { label: 'Admission Count', href: '/reports/admission-count' },
      { label: 'Online Payment Report', href: '/reports/online-payments' },
      { label: 'Student Forecasted Royalty Report', href: '/reports/royalty-forecast' },
    ],
  },
  {
    label: 'Tools',
    icon: Wrench,
    children: [
      { label: 'Fee Calculator', href: '/tools/fee-calculator' },
    ],
  },
  {
    label: 'Shortage/Damage',
    icon: AlertTriangle,
    children: [
      { label: 'Report Shortage/Damage', href: '/shortage/report' },
      { label: 'Download Report', href: '/shortage/download' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'System Settings', href: '/settings/system' },
      { label: 'Manage Academic Years', href: '/settings/academic-years' },
    ],
  },
];

function SidebarGroup({ item }: { item: SidebarItem }) {
  const location = useLocation();
  const { sidebarCollapsed } = useUIStore();
  const isChildActive = item.children?.some(c => location.pathname.startsWith(c.href));
  const [isOpen, setIsOpen] = useState(isChildActive || false);

  // Direct link item
  if (item.href) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
            'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
            isActive && 'bg-primary/15 text-primary font-semibold',
            sidebarCollapsed && 'justify-center px-2'
          )
        }
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-md">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  }

  // Collapsible group
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full transition-all duration-200',
          'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
          isChildActive && 'text-primary',
          sidebarCollapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="truncate text-left flex-1">{item.label}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {isOpen && !sidebarCollapsed && (
        <div
          className="overflow-hidden"
        >
          <div className="ml-5 pl-3 border-l border-sidebar-border/60 mt-1 space-y-0.5 pb-1">
            {item.children?.map((child) => (
              <NavLink
                key={child.href}
                to={child.href}
                className={({ isActive }) =>
                  cn(
                    'block px-3 py-1.5 rounded-md text-[12.5px] transition-all duration-150',
                    'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40',
                    isActive && 'text-primary bg-primary/10 font-medium'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    if (sidebarMobileOpen) {
      setSidebarMobileOpen(false);
    }
  }, [location.pathname, sidebarMobileOpen, setSidebarMobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-sidebar-border/40 px-4 shrink-0',
        sidebarCollapsed ? 'justify-center' : 'gap-3'
      )}>
        {/* Suryadhi circular icon — shown always */}
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center">
          <img
            src={BRAND.iconSrc}
            alt="Suryadhi icon"
            className="w-8 h-8 object-cover rounded-full"
          />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            {/* SURYADHI LEARNING wordmark */}
            <img
              src={BRAND.logoSrc}
              alt="Suryadhi Learning"
              className="h-6 object-contain object-left"
            />
            <p className="text-[10px] text-sidebar-foreground/50 font-medium mt-0.5">{BRAND.version}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navigation.map((item) => (
          <SidebarGroup key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-sidebar-border/40 px-4 py-3 shrink-0">
          <p className="text-[9px] text-sidebar-foreground/30">
            {BRAND.poweredBy}
          </p>
          <p className="text-[9px] text-sidebar-foreground/25 mt-0.5">
            {BRAND.copyright}
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-sidebar flex-col hidden lg:flex',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 z-50 h-screen w-[260px] bg-sidebar flex flex-col lg:hidden"
          >
            <button
              onClick={() => setSidebarMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
