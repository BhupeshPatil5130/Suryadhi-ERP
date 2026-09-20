import { useState, useEffect, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, RotateCcw, Calendar, CheckCircle, Clock, DollarSign, FileSpreadsheet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';
import api from '@/api/client';

interface FCRReceiptItem {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: string;
  status: 'Deposited' | 'Not deposited' | 'Reconciled' | 'Bounced';
  admission?: {
    student?: {
      firstName: string;
      lastName: string;
      uin: string;
    };
    program?: {
      name: string;
    };
  };
  deposit?: {
    depositSlipNumber?: string;
    status?: string;
  } | null;
}

const mockFCRData: FCRReceiptItem[] = [
  {
    id: 'fcr-1',
    receiptNumber: 'REC-2026-000101',
    receiptDate: '2026-04-05',
    amount: 14650,
    paymentMode: 'CHEQUE',
    status: 'Deposited',
    admission: {
      student: { firstName: 'Aarav', lastName: 'Patil', uin: 'SEMS/3201/0001/2627' },
      program: { name: 'Play Group' },
    },
    deposit: { depositSlipNumber: 'DEP-2026-0012', status: 'DEPOSITED' }
  },
  {
    id: 'fcr-2',
    receiptNumber: 'REC-2026-000102',
    receiptDate: '2026-04-07',
    amount: 15600,
    paymentMode: 'CASH',
    status: 'Reconciled',
    admission: {
      student: { firstName: 'Isha', lastName: 'Sharma', uin: 'SEMS/3201/0002/2627' },
      program: { name: 'Nursery' },
    },
    deposit: { depositSlipNumber: 'DEP-2026-0015', status: 'RECONCILED' }
  },
  {
    id: 'fcr-3',
    receiptNumber: 'REC-2026-000103',
    receiptDate: '2026-04-12',
    amount: 16600,
    paymentMode: 'CHEQUE',
    status: 'Not deposited',
    admission: {
      student: { firstName: 'Vihaan', lastName: 'Deshmukh', uin: 'SEMS/3201/0003/2627' },
      program: { name: 'Sunoia Junior' },
    },
    deposit: null
  },
  {
    id: 'fcr-4',
    receiptNumber: 'REC-2026-000104',
    receiptDate: '2026-04-18',
    amount: 17600,
    paymentMode: 'CHEQUE',
    status: 'Bounced',
    admission: {
      student: { firstName: 'Ananya', lastName: 'Kulkarni', uin: 'SEMS/3201/0004/2627' },
      program: { name: 'Sunoia Senior' },
    },
    deposit: { depositSlipNumber: 'DEP-2026-0019', status: 'BOUNCED' }
  },
  {
    id: 'fcr-5',
    receiptNumber: 'REC-2026-000105',
    receiptDate: '2026-05-02',
    amount: 7700,
    paymentMode: 'ONLINE',
    status: 'Reconciled',
    admission: {
      student: { firstName: 'Kabir', lastName: 'Joshi', uin: 'SEMS/3201/0005/2627' },
      program: { name: 'Play Group' },
    },
    deposit: { depositSlipNumber: 'DEP-2026-0022', status: 'RECONCILED' }
  }
];

export default function FCRReportPage() {
  const [data, setData] = useState<FCRReceiptItem[]>(mockFCRData);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Deposited' | 'Not deposited' | 'Reconciled' | 'Bounced'>('All');

  const fetchFCR = useCallback(async (customFrom?: string, customTo?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      const f = customFrom !== undefined ? customFrom : fromDate;
      const t = customTo !== undefined ? customTo : toDate;
      if (f) params.from = f;
      if (t) params.to = t;

      const res = await api.get('/reports/fcr', { params });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setData(res.data.data);
      }
    } catch {
      // Keep sample mock data for offline preview
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchFCR();
  }, [fetchFCR]);

  const handleSearch = () => {
    fetchFCR();
  };

  const handleClearSearch = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('All');
    fetchFCR('', '');
  };

  // Filter based on Status (Deposited, Not deposited, Reconciled, Bounced, All)
  const filteredData = data.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;
    if (fromDate && item.receiptDate < fromDate) return false;
    if (toDate && item.receiptDate > toDate) return false;
    return true;
  });

  const handleDownloadExcel = () => {
    const exportRows = filteredData.map((item) => ({
      'Receipt No': item.receiptNumber,
      'Receipt Date': formatDate(item.receiptDate),
      'Student Name': item.admission?.student ? `${item.admission.student.firstName} ${item.admission.student.lastName}` : '-',
      'UIN': item.admission?.student?.uin || '-',
      'Program': item.admission?.program?.name || '-',
      'Payment Mode': item.paymentMode,
      'Amount': item.amount,
      'Status': item.status,
      'Deposit Slip': item.deposit?.depositSlipNumber || '-',
    }));
    downloadAsCSV(exportRows, 'Fee_Collection_Report_FCR');
  };

  const totalCollection = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
  const totalDeposited = filteredData.filter((i) => i.status === 'Deposited' || i.status === 'Reconciled').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = filteredData.filter((i) => i.status === 'Not deposited').reduce((acc, curr) => acc + curr.amount, 0);

  const columns: ColumnDef<FCRReceiptItem>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt No.',
      cell: ({ getValue }) => <span className="font-mono font-bold text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'receiptDate',
      header: 'Receipt Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      id: 'student',
      header: 'Student Name / UIN',
      cell: ({ row }) => {
        const s = row.original.admission?.student;
        return (
          <div>
            <span className="font-semibold text-slate-900 block text-xs">
              {s ? `${s.firstName} ${s.lastName}` : '-'}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block">
              {s?.uin || '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'program',
      header: 'Program',
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.admission?.program?.name || '-'}</span>,
    },
    {
      accessorKey: 'paymentMode',
      header: 'Payment Mode',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] font-mono font-medium">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Collection Amount</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        let badgeStyle = 'bg-slate-100 text-slate-800';
        if (val === 'Reconciled') badgeStyle = 'bg-emerald-100 text-emerald-800';
        else if (val === 'Deposited') badgeStyle = 'bg-blue-100 text-blue-800';
        else if (val === 'Not deposited') badgeStyle = 'bg-amber-100 text-amber-800';
        else if (val === 'Bounced') badgeStyle = 'bg-red-100 text-red-800';

        return (
          <div className="text-center">
            <Badge className={`text-xs font-semibold border-none ${badgeStyle}`}>
              {val}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Collection Report (FCR Details)"
        description="Daily fee collection audit, deposit reconciliations, and bounce tracking"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Collection</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCollection)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Deposited / Reconciled</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalDeposited)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Not Deposited / Pending</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalPending)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base font-bold text-slate-800">
              Fee Collection Report (Update) FCR Details
            </CardTitle>

            {/* From Date, To Date, Status (Check Box / Select), Download To Excel Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 1. From Date (calendar box) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>From Date:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs w-[130px] bg-white"
                />
              </div>

              {/* 2. To Date (calendar box) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>To Date:</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs w-[130px] bg-white"
                />
              </div>

              {/* 3. Status (Deposited, Not deposited, Reconciled, Bounced, All) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white h-8 font-medium"
                >
                  <option value="All">All</option>
                  <option value="Deposited">Deposited</option>
                  <option value="Not deposited">Not deposited</option>
                  <option value="Reconciled">Reconciled</option>
                  <option value="Bounced">Bounced</option>
                </select>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                onClick={handleSearch}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={handleClearSearch}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </Button>

              {/* 4. Download To Excel (button) */}
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm font-semibold"
                onClick={handleDownloadExcel}
                disabled={filteredData.length === 0}
              >
                <Download className="w-3.5 h-3.5" />
                Download To Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            searchPlaceholder="Search receipt number, student, UIN..."
            showExportBox={true}
            exportTitle="fcr_collection_report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
