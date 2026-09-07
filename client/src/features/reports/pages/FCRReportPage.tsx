import { useState, useEffect, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, RotateCcw, Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';
import api from '@/api/client';

interface FCRReceiptItem {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: string;
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

export default function FCRReportPage() {
  const [data, setData] = useState<FCRReceiptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Realised' | 'Unrealised'>('All');

  const fetchFCR = useCallback(async (customFrom?: string, customTo?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      const f = customFrom !== undefined ? customFrom : fromDate;
      const t = customTo !== undefined ? customTo : toDate;
      if (f) params.from = f;
      if (t) params.to = t;

      const res = await api.get('/reports/fcr', { params });
      if (res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch FCR report', err);
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

  // Helper to determine if receipt is realised
  const isRealised = (item: FCRReceiptItem) => {
    if (['ONLINE', 'BANK_TRANSFER', 'PAYTM_POS'].includes(item.paymentMode)) return true;
    if (item.deposit && ['VERIFIED', 'DEPOSITED'].includes(item.deposit.status || '')) return true;
    return false;
  };

  // Filter based on Realised / Unrealised status
  const filteredData = data.filter((item) => {
    if (statusFilter === 'All') return true;
    const realised = isRealised(item);
    return statusFilter === 'Realised' ? realised : !realised;
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
      'Deposit Slip': item.deposit?.depositSlipNumber || '-',
      'Status': isRealised(item) ? 'Realised' : 'Unrealised',
    }));
    downloadAsCSV(exportRows, `fcr_fee_collection_report_${statusFilter.toLowerCase()}.csv`);
  };

  const totalCollected = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalRealised = filteredData.filter(isRealised).reduce((sum, item) => sum + Number(item.amount), 0);
  const totalUnrealised = filteredData.filter((i) => !isRealised(i)).reduce((sum, item) => sum + Number(item.amount), 0);

  const columns: ColumnDef<FCRReceiptItem>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-slate-800 text-xs">{getValue() as string}</span>
      ),
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
      cell: ({ row }) => <span className="text-xs">{row.original.admission?.program?.name || '-'}</span>,
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
      id: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const realised = isRealised(row.original);
        return (
          <div className="text-center">
            <Badge
              className={`text-xs font-semibold ${
                realised
                  ? 'bg-emerald-100 text-emerald-800 border-none'
                  : 'bg-amber-100 text-amber-800 border-none'
              }`}
            >
              {realised ? 'Realised' : 'Unrealised'}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FCR (Fee Collection Report)"
        description="Comprehensive audit of all fee collections, deposits, and realization status"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Collection</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCollected)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Realised Funds</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalRealised)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Unrealised / In Transit</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(totalUnrealised)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base font-bold">FCR Collection Logs</CardTitle>

            {/* From Date, To Date, Status Filter & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>From:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs w-[130px]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>To:</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs w-[130px]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border rounded px-2.5 py-1 text-xs bg-background h-8 font-medium"
                >
                  <option value="All">All</option>
                  <option value="Realised">Realised</option>
                  <option value="Unrealised">Unrealised</option>
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
                Clear Search
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={handleDownloadExcel}
                disabled={filteredData.length === 0}
              >
                <Download className="w-3.5 h-3.5" />
                Download to Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            searchPlaceholder="Search by receipt no, student, or mode..."
            showExportBox={true}
            exportTitle="fcr_report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
