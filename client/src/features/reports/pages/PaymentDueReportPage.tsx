import { useState, useEffect, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, DollarSign, Users, Eye, RotateCcw } from 'lucide-react';
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

const PROGRAMS = ['Play Group', 'Nursery', 'Sunoia Junior', 'Sunoia Senior'];

export default function PaymentDueReportPage() {
  const [data, setData] = useState<PaymentDueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(PROGRAMS);
  const [viewMode, setViewMode] = useState<'detail' | 'summary'>('detail');

  // Modal for detail view
  const [selectedItem, setSelectedItem] = useState<PaymentDueItem | null>(null);

  const fetchPaymentDue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/payment-due');
      if (res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
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

  const toggleProgram = (program: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(program) ? prev.filter((p) => p !== program) : [...prev, program]
    );
  };

  const handleSelectAllPrograms = () => {
    if (selectedPrograms.length === PROGRAMS.length) {
      setSelectedPrograms([]);
    } else {
      setSelectedPrograms(PROGRAMS);
    }
  };

  const handleReset = () => {
    setSelectedPrograms(PROGRAMS);
    setViewMode('detail');
  };

  // Filter items based on program checkboxes
  const filteredData = data.filter((item) => {
    const prog = (item.program?.name || '').toLowerCase();
    if (selectedPrograms.length === 0) return true;
    return selectedPrograms.some((sp) => prog.includes(sp.toLowerCase()));
  });

  // Calculate summary grouped by program
  const summaryData: ProgramSummaryItem[] = PROGRAMS.map((pName) => {
    const items = data.filter((d) => (d.program?.name || '').toLowerCase().includes(pName.toLowerCase()));
    return {
      programName: pName,
      studentCount: items.length,
      totalInvoiced: items.reduce((sum, i) => sum + i.totalAmount, 0),
      totalPaid: items.reduce((sum, i) => sum + i.totalPaid, 0),
      totalBalance: items.reduce((sum, i) => sum + i.balance, 0),
    };
  }).filter((s) => selectedPrograms.length === 0 || selectedPrograms.includes(s.programName));

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
      cell: ({ row }) => <span className="font-medium">{row.original.program?.name || '-'}</span>,
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
    <div className="space-y-6">
      <PageHeader
        title="Payment Due Report"
        description="Monitor outstanding fee balances and defaulter records across programs"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Outstanding Due</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">{formatCurrency(totalDueAmount)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Defaulter Students</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1">{totalStudentsDue}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Report Mode</p>
              <h3 className="text-lg font-bold text-blue-700 mt-1 uppercase">{viewMode} Mode</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 py-4">
          <div className="space-y-4">
            {/* Program Checkboxes */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Program Filter:</span>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={selectedPrograms.length === PROGRAMS.length}
                  onChange={handleSelectAllPrograms}
                  className="rounded border-slate-300"
                />
                All Programs
              </label>
              {PROGRAMS.map((prog) => (
                <label key={prog} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPrograms.includes(prog)}
                    onChange={() => toggleProgram(prog)}
                    className="rounded border-slate-300"
                  />
                  {prog}
                </label>
              ))}
            </div>

            {/* Status (Detail & Summary) + Action Buttons (View Detail & Cancel) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Status View:</span>
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('detail')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                      viewMode === 'detail'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Detail View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-b border-r ${
                      viewMode === 'summary'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Summary View
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancel / Reset
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
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
        </CardContent>
      </Card>

      {/* Student Due Detail Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Student Payment Due Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Student:</span>
                  <span className="font-semibold">{selectedItem.student.firstName} {selectedItem.student.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">UIN:</span>
                  <span className="font-mono text-xs">{selectedItem.student.uin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Program:</span>
                  <span>{selectedItem.program.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Invoice Number:</span>
                  <span className="font-mono text-xs">{selectedItem.invoiceNumber}</span>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Total Invoiced Amount:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedItem.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700">Total Paid / Received:</span>
                  <span className="font-mono text-emerald-700 font-medium">{formatCurrency(selectedItem.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t text-red-600">
                  <span>Remaining Balance Due:</span>
                  <span className="font-mono">{formatCurrency(selectedItem.balance)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
