import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';

import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate, cn, getStatusColor } from '@/lib/utils';
import {
  Users, UserPlus, UserMinus, ArrowRightLeft, TrendingUp,
  IndianRupee, ChevronDown, ChevronRight, ExternalLink,
  FileText, Package, AlertTriangle, Wallet, CreditCard,
  Receipt, BarChart3,
} from 'lucide-react';

// ─── Dummy Data for things not provided by backend summary
const feeRateCards = [
  {
    program: 'Play Group',
    status: 'HO Approved',
    fees: [
      { type: 'Registration Fee', term1: 5000, term2: 0, total: 5000 },
      { type: 'Tuition Fee', term1: 15000, term2: 15000, total: 30000 },
      { type: 'Activity Fee', term1: 3000, term2: 3000, total: 6000 },
      { type: 'Material Fee', term1: 2500, term2: 0, total: 2500 },
    ],
  },
  {
    program: 'Nursery',
    status: 'HO Approved',
    fees: [
      { type: 'Registration Fee', term1: 5000, term2: 0, total: 5000 },
      { type: 'Tuition Fee', term1: 18000, term2: 18000, total: 36000 },
      { type: 'Activity Fee', term1: 3500, term2: 3500, total: 7000 },
      { type: 'Material Fee', term1: 3000, term2: 0, total: 3000 },
    ],
  },
];

const purchaseOrders = [
  { poNo: '225135', poDate: '2026-06-09', value: 92000, quantity: 46, status: 'Dispatched', remarks: 'Dispatch details will be provided soon', asOn: '2026-06-09' },
  { poNo: '221876', poDate: '2026-05-30', value: 50904, quantity: 6, status: 'Dispatch Details', remarks: 'Dispatched on 01-06-2026 through Blue Dart with LR No 51931506200', asOn: '2026-06-01' },
];

// ─── Fee Rate Card Accordion ───────────────────────────────
function FeeRateAccordion({ card }: { card: typeof feeRateCards[0] }) {
  const [open, setOpen] = useState(false);
  const total = card.fees.reduce((s, f) => s + f.total, 0);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-success/10 hover:bg-success/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-success" /> : <ChevronRight className="h-4 w-4 text-success" />}
          <span className="font-semibold text-sm text-success">{card.program}</span>
          <Badge variant="success" className="text-[10px]">{card.status}</Badge>
        </div>
        <span className="text-sm font-bold text-success">{formatCurrency(total)}</span>
      </button>
        {open && (
          <div
            className="overflow-x-auto"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Fee Type</TableHead>
                  <TableHead className="text-right">Term 1</TableHead>
                  <TableHead className="text-right">Term 2</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {card.fees.map((fee) => (
                  <TableRow key={fee.type}>
                    <TableCell className="font-medium text-sm">{fee.type}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(fee.term1)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(fee.term2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(fee.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(card.fees.reduce((s, f) => s + f.term1, 0))}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(card.fees.reduce((s, f) => s + f.term2, 0))}</TableCell>
                  <TableCell className="text-right font-mono text-primary">{formatCurrency(total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.warn('Dashboard API failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  const enrollmentKPIs = [
    { title: 'Enquiries', value: data?.kpis?.enquiries || 0, icon: Users, color: 'green' as const, link: '/enquiry' },
    { title: 'LeadSuryadhi Enquiries', value: 0, icon: BarChart3, color: 'cyan' as const, link: '/reports/lsq-enquiries' },
    { title: 'Gross Admission', value: data?.kpis?.grossAdmission || 0, icon: UserPlus, color: 'blue' as const, link: '/admission' },
    { title: 'Transfer In', value: data?.kpis?.transferIn || 0, icon: ArrowRightLeft, color: 'indigo' as const, link: '/transfers/manage' },
    { title: 'Transfer Out', value: data?.kpis?.transferOut || 0, icon: ArrowRightLeft, color: 'amber' as const, link: '/transfer-out' },
    { title: 'Quit', value: data?.kpis?.quit || 0, icon: UserMinus, color: 'red' as const, link: '/quit-admission' },
  ];

  const financialKPIs = [
    { title: 'Receivable', value: data?.financials?.receivable || 0, icon: IndianRupee, color: 'blue' as const, link: '/soa/summary' },
    { title: 'Collection', value: data?.financials?.collection || 0, icon: Wallet, color: 'green' as const, link: '/fees/deposit-history' },
    { title: 'Payment Due', value: data?.financials?.paymentDue || 0, icon: CreditCard, color: 'amber' as const, link: '/reports/payment-due' },
    { title: 'FCR Deposited', value: data?.financials?.fcrDeposited || 0, icon: Receipt, color: 'orange' as const, link: '/reports/fcr' },
    { title: 'FCR Pending', value: data?.financials?.fcrPending || 0, icon: FileText, color: 'cyan' as const, link: '/reports/fcr' },
    { title: 'Credit Note', value: 0, icon: FileText, color: 'pink' as const, link: '/reports/cancelled-receipts' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome Partners to EPMS V2.0"
        description="Your Own ERP Tool — Monitor enrollments, finances, and operations at a glance."
      />

      {/* Enrollment KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Enrollment Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {enrollmentKPIs.map((kpi, i) => (
            <Link key={kpi.title} to={kpi.link} className="block transition-transform hover:-translate-y-1">
              <StatCard
                title={kpi.title}
                value={typeof kpi.value === 'number' && kpi.value > 1000 ? formatCurrency(kpi.value) : kpi.value.toString()}
                icon={kpi.icon}
                color={kpi.color}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Financial KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {financialKPIs.map((kpi, i) => (
            <Link key={kpi.title} to={kpi.link} className="block transition-transform hover:-translate-y-1">
              <StatCard
                title={kpi.title}
                value={typeof kpi.value === 'number' ? formatCurrency(kpi.value) : kpi.value.toString()}
                icon={kpi.icon}
                color={kpi.color}
              />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary" /> Fee Rate Cards</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/reports/fee-card">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {feeRateCards.map((card, i) => (
                <FeeRateAccordion key={i} card={card} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-destructive/5 pb-4 border-b border-destructive/10">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Outstanding Payments (Top 5)</span>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">Remind All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data?.recentAdmissions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10">
                        <TableHead>Student</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentAdmissions.map((adm: any) => (
                        <TableRow key={adm.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{adm.student.firstName} {adm.student.lastName}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{adm.program?.name}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admissions/view-receipt`} state={{ student: adm, receipt: { receiptNumber: 'View Dues', amount: 0, paymentMode: 'N/A' } }}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                 <div className="p-8 text-center text-muted-foreground text-sm">No recent admissions to show</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-amber-500/10 pb-4 border-b border-amber-500/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-700"><Package className="h-4 w-4" /> Kit & Material Status (PO)</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/operations/purchase">Manage Orders</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-500/5">
                      <TableHead>PO No</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{po.poNo}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCurrency(po.value)}</TableCell>
                        <TableCell><Badge variant="outline" className={cn("text-[10px]", po.status.includes('Dispatch') ? "text-blue-600 border-blue-200" : "text-emerald-600 border-emerald-200")}>{po.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Recent Enquiries</span>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                  <Link to="/enquiry">View All <ExternalLink className="h-3 w-3 ml-1" /></Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {data?.recentEnquiries?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10">
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Program</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentEnquiries.map((enq: any) => (
                        <TableRow key={enq.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(enq.createdAt)}</TableCell>
                          <TableCell className="font-medium text-sm">{enq.student?.firstName} {enq.student?.lastName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{enq.program?.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
               ) : (
                 <div className="p-8 text-center text-muted-foreground text-sm">No recent enquiries</div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
