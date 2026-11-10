import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, DollarSign, Users, Eye, RotateCcw, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/api/client';

interface PaymentDueItem {
  student: {
    id?: string;
    firstName: string;
    lastName: string;
    uin: string;
  };
  program: {
    id?: string;
    name: string;
  };
  invoiceNumber: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
}

interface ProgramSummaryItem {
  programName: string;
  studentCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalBalance: number;
}

export const STANDARD_PROGRAMS = ['Play Group', 'Nursery', 'SUNOIA Junior', 'SUNOIA Senior'] as const;

export function normalizeProgramName(name?: string | null): string {
  if (!name) return '';
  const clean = name.trim().toLowerCase();
  if (clean.includes('play')) return 'Play Group';
  if (clean.includes('nurse')) return 'Nursery';
  if (clean.includes('junior') || clean.includes('jr')) return 'SUNOIA Junior';
  if (clean.includes('senior') || clean.includes('sr')) return 'SUNOIA Senior';
  return name.trim();
}

export default function PaymentDueReportPage() {
  const [data, setData] = useState<PaymentDueItem[]>([]);
  const programsList = STANDARD_PROGRAMS;
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'detail' | 'summary'>('detail');

  // Modal for detail view
  const [selectedItem, setSelectedItem] = useState<PaymentDueItem | null>(null);

  const fetchPaymentDue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/payment-due');
      if (res.data.success && Array.isArray(res.data.data)) {
        // Normalize all program names so casing is 100% consistent
        const normalized: PaymentDueItem[] = res.data.data.map((item: any) => ({
          ...item,
          program: {
            ...item.program,
            name: normalizeProgramName(item.program?.name),
          },
        }));
        setData(normalized);
      }
    } catch (err) {
      console.error('Failed to fetch payment due report', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentDue();
  }, [fetchPaymentDue]);

  const handleReset = () => {
    setSelectedProgram('ALL');
    setViewMode('detail');
  };

  // Filter items based on selected program dropdown
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (selectedProgram === 'ALL') return true;
      const prog = normalizeProgramName(item.program?.name).toLowerCase();
      const sel = selectedProgram.toLowerCase();
      return prog === sel;
    });
  }, [data, selectedProgram]);

  // Calculate summary grouped by program - exactly 4 programs
  const summaryData: ProgramSummaryItem[] = useMemo(() => {
    const listToSummarize = selectedProgram === 'ALL'
      ? [...STANDARD_PROGRAMS]
      : STANDARD_PROGRAMS.filter((p) => p.toLowerCase() === selectedProgram.toLowerCase());

    return listToSummarize.map((pName) => {
      const items = data.filter((d) => normalizeProgramName(d.program?.name).toLowerCase() === pName.toLowerCase());
      return {
        programName: pName,
        studentCount: items.length,
        totalInvoiced: items.reduce((sum, i) => sum + i.totalAmount, 0),
        totalPaid: items.reduce((sum, i) => sum + i.totalPaid, 0),
        totalBalance: items.reduce((sum, i) => sum + i.balance, 0),
      };
    });
  }, [data, selectedProgram]);

  const totalDueAmount = filteredData.reduce((sum, d) => sum + d.balance, 0);
  const totalStudentsDue = filteredData.length;

  // Columns for Detail view
  const detailColumns: ColumnDef<PaymentDueItem>[] = [
    {
      id: 'student',
      header: 'Student Name / UIN',
      cell: ({ row }) => {
        const s = row.original.student;
        return (
          <div>
            <span className="font-semibold text-slate-900 block">
              {s ? `${s.firstName} ${s.lastName}` : '-'}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono block">
              {s?.uin || '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'program',
      header: 'Program',
      cell: ({ row }) => <span className="font-medium">{normalizeProgramName(row.original.program?.name) || '-'}</span>,
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice No',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue() as string || '-'}</span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">Total Fees</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-slate-700">{formatCurrency(Number(getValue()))}</div>
      ),
    },
    {
      accessorKey: 'totalPaid',
      header: () => <div className="text-right">Paid Amount</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-emerald-600 font-medium">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-right">Outstanding Due</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono font-bold text-red-600">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      id: 'action',
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs text-blue-700 hover:bg-blue-50"
            onClick={() => setSelectedItem(row.original)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Detail
          </Button>
        </div>
      ),
    },
  ];

  // Columns for Summary view
  const summaryColumns: ColumnDef<ProgramSummaryItem>[] = [
    {
      accessorKey: 'programName',
      header: 'Program Name',
      cell: ({ getValue }) => <span className="font-bold text-slate-900">{getValue() as string}</span>,
    },
    {
      accessorKey: 'studentCount',
      header: () => <div className="text-center">Defaulter Students</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge variant="outline" className="font-bold font-mono">
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'totalInvoiced',
      header: () => <div className="text-right">Total Invoiced</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-slate-700">{formatCurrency(Number(getValue()))}</div>
      ),
    },
    {
      accessorKey: 'totalPaid',
      header: () => <div className="text-right">Total Collected</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono text-emerald-600 font-medium">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: 'totalBalance',
      header: () => <div className="text-right">Total Due Balance</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono font-bold text-red-600">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <PageHeader
        title="Payment Due Report"
        description="Monitor outstanding fee balances and defaulter records across programs"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate">Total Outstanding Due</p>
              <h3 className="text-2xl font-black text-red-600 mt-1 truncate">{formatCurrency(totalDueAmount)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate">Defaulter Students</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1 truncate">{totalStudentsDue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider truncate">Report Mode</p>
              <h3 className="text-lg font-bold text-blue-700 mt-1 uppercase truncate">{viewMode} Mode</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls Card with Program Dropdown */}
      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-border/50 py-3.5 px-5 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              {/* 1. Program Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Program:</span>
                <div className="relative">
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="appearance-none h-8 pl-3 pr-8 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[180px] shadow-none"
                  >
                    <option value="ALL">All Programs</option>
                    {programsList.map((prog) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>

              {/* 2. Status View Mode Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Status View:</span>
                <div className="relative">
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'detail' | 'summary')}
                    className="appearance-none h-8 pl-3 pr-8 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px] shadow-none"
                  >
                    <option value="detail">Detail View</option>
                    <option value="summary">Summary View</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-slate-300 text-slate-700 hover:bg-slate-100 shadow-none font-medium"
                onClick={handleReset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="overflow-x-auto w-full">
            {viewMode === 'detail' ? (
              <DataTable
                columns={detailColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder="Search student, UIN, or invoice no..."
                showExportBox={true}
                exportTitle="payment_due_detail_report"
              />
            ) : (
              <DataTable
                columns={summaryColumns}
                data={summaryData}
                isLoading={isLoading}
                searchPlaceholder="Search program..."
                showExportBox={true}
                exportTitle="payment_due_summary_report"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Due Detail Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800">
                Payment Due Details — {selectedItem.student?.firstName} {selectedItem.student?.lastName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UIN:</span>
                  <span className="font-mono font-medium">{selectedItem.student?.uin || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-medium">{normalizeProgramName(selectedItem.program?.name) || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No:</span>
                  <span className="font-mono font-medium">{selectedItem.invoiceNumber || '-'}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Billed Fees:</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedItem.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Total Amount Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatCurrency(selectedItem.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2 text-red-600">
                  <span>Balance Outstanding Due:</span>
                  <span className="font-mono">{formatCurrency(selectedItem.balance)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
