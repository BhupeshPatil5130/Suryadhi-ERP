import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  Receipt,
  FileText,
  BarChart3,
  Calculator,
  Package,
  MessageSquare,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  {
    label: 'Enrollment Dashboard',
    icon: BarChart3,
    children: [
      { label: 'Overall Summary', href: '/enrollment/summary' },
      { label: 'Source Wise Enquiries', href: '/enrollment/source-wise' },
      { label: 'Retention Analysis', href: '/enrollment/retention' },
    ],
  },
  {
    label: 'Enrollments',
    icon: UserPlus,
    children: [
      { label: 'Enquiry', href: '/enquiries' },
      { label: 'Admission', href: '/admissions' },
      { label: 'Graduation via HomeSunny', href: '/graduation/homebuddy' },
      { label: 'Manage Student Transfer In', href: '/transfers/in' },
      { label: 'Quit Admission', href: '/quit' },
      { label: 'Transfer Out Students', href: '/transfer-out' },
      { label: 'Name Change', href: '/name-change' },
    ],
  },
  {
    label: 'Statement of Account',
    icon: FileText,
    children: [
      { label: 'SOA Summary', href: '/soa/summary' },
      { label: 'SOA Details', href: '/soa/details' },
    ],
  },
  {
    label: 'Fee Collection',
    icon: Receipt,
    children: [
      { label: 'Deposit Slip - Automated', href: '/fees/deposit' },
      { label: 'Convert Cash to Cheque', href: '/fees/cash-to-cheque' },
      { label: 'Convert Cash to Online', href: '/fees/cash-to-online' },
      { label: 'Print & View Deposit Slip', href: '/fees/deposit-history' },
      { label: 'Funds Transfer Summary', href: '/fees/funds-transfer' },
      { label: 'Fee Collection through HomeSunny', href: '/fees/homebuddy' },
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
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Admission Details', href: '/reports/admissions' },
      { label: 'Fee Card Details', href: '/reports/fee-card' },
      { label: 'Enquiry Details', href: '/reports/enquiries' },
      { label: 'Payment Due', href: '/reports/payment-due' },
      { label: 'Cancelled Receipts', href: '/reports/cancelled-receipts' },
      { label: 'Transfer Students', href: '/reports/transfers' },
      { label: 'Admission Count', href: '/reports/admission-count' },
      { label: 'Student Royalty', href: '/reports/royalty' },
    ],
  },
  { label: 'Fee Calculator', icon: Calculator, href: '/tools/calculator' },
  {
    label: 'Operations',
    icon: Package,
    children: [
      { label: 'Exchange Orders', href: '/operations/exchange' },
      { label: 'Purchase Orders', href: '/operations/purchase' },
    ],
  },
  { label: 'Communications', icon: MessageSquare, href: '/communications' },
  {
    label: 'Shortage/Damage',
    icon: AlertTriangle,
    children: [
      { label: 'Report Shortage', href: '/shortage/report' },
      { label: 'Download Report', href: '/shortage/download' },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const location = useLocation();
  const { sidebarCollapsed } = useUIStore();
  const [isOpen, setIsOpen] = useState(
    item.children?.some((child) => location.pathname === child.href) || false
  );

  if (item.href) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn('sidebar-item', isActive && 'active')
        }
      >
        <item.icon className="h-4.5 w-4.5 shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'sidebar-item w-full justify-between',
          item.children?.some((child) => location.pathname === child.href) && 'text-primary'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-4.5 w-4.5 shrink-0" />
          {!sidebarCollapsed && <span>{item.label}</span>}
        </div>
        {!sidebarCollapsed && (
          isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {isOpen && !sidebarCollapsed && (
        <div className="ml-4 pl-4 border-l border-border/50 mt-1 space-y-0.5">
          {item.children?.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              className={({ isActive }) =>
                cn(
                  'sidebar-item text-[13px] py-2',
                  isActive && 'active'
                )
              }
            >
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-border/50',
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-border/50 px-4 transition-all">
        {sidebarCollapsed ? (
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-extrabold gradient-text">EPMS</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Pre-School Management</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 h-[calc(100vh-4rem)]">
        {navigation.map((item) => (
          <NavGroup key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}
