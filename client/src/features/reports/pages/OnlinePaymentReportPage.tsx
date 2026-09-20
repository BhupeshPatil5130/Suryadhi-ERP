import { useState, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Landmark, Calendar, CreditCard, Search, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/api/client';
import { downloadAsCSV } from '@/lib/export';

interface OnlinePayment {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: string;
  transactionId?: string;
  status: string;
  admission: {
    student: {
      firstName: string;
      lastName: string;
      uin: string;
    };
    program: {
      name: string;
    };
  };
}

const mockOnlinePayments: OnlinePayment[] = [
  {
    id: 'op1',
    receiptNumber: 'REC-2026-000031',
    receiptDate: '2026-06-08',
    amount: 14650,
    paymentMode: 'ONLINE',
    transactionId: 'TXN-PAYTM-998201',
    status: 'SUCCESS',
    admission: {
      student: { firstName: 'Rohan', lastName: 'Gupta', uin: 'SEMS/3201/0088/2627' },
      program: { name: 'Sunoia Junior' }
    }
  },
  {
    id: 'op2',
    receiptNumber: 'REC-2026-000032',
    receiptDate: '2026-06-12',
    amount: 7700,
    paymentMode: 'BANK_TRANSFER',
    transactionId: 'IMPS-HDFC-441029',
    status: 'SUCCESS',
    admission: {
      student: { firstName: 'Anika', lastName: 'Mehta', uin: 'SNK/3201/0091/2627' },
      program: { name: 'Nursery' }
    }
  },
  {
    id: 'op3',
    receiptNumber: 'REC-2026-000035',
    receiptDate: '2026-06-15',
    amount: 22350,
    paymentMode: 'ONLINE',
    transactionId: 'TXN-RAZOR-772109',
    status: 'SUCCESS',
    admission: {
      student: { firstName: 'Kabir', lastName: 'Patil', uin: 'SEMS/3201/0095/2627' },
      program: { name: 'Play Group' }
    }
  }
];

export default function OnlinePaymentReportPage() {
  const [data, setData] = useState<OnlinePayment[]>(mockOnlinePayments);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/online-payments', {
        params: {
          ...(fromDate && { from: fromDate }),
          ...(toDate && { to: toDate }),
        }
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setData(res.data.data);
      }
    } catch {
      // Keep sample mock payments
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDownloadOnlineReport = () => {
    const rows = filteredData.map((item) => ({
      'Receipt Number': item.receiptNumber,
      'Payment Date': formatDate(item.receiptDate),
      'Student Name': item.admission?.student ? `${item.admission.student.firstName} ${item.admission.student.lastName}` : 'N/A',
      'UIN': item.admission?.student?.uin ?? 'N/A',
      'Program': item.admission?.program?.name ?? 'N/A',
      'Payment Mode': item.paymentMode,
      'Transaction ID': item.transactionId || '-',
      'Amount (Rs.)': item.amount,
      'Status': item.status,
    }));
    downloadAsCSV(rows, 'Online_Payment_Report');
  };

  const filteredData = data.filter((item) => {
    if (fromDate && item.receiptDate < fromDate) return false;
    if (toDate && item.receiptDate > toDate) return false;
    return true;
  });

  const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);

  const columns: ColumnDef<OnlinePayment>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-blue-700">{getValue() as string}</span>,
    },
    {
      id: 'student',
      header: 'Student Name / UIN',
      cell: ({ row }) => {
        const student = row.original.admission?.student;
        return (
          <div>
            <span className="font-semibold text-slate-800 block text-xs">
              {student ? `${student.firstName} ${student.lastName}` : 'N/A'}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block">
              {student?.uin || 'N/A'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'program',
      header: 'Program',
      cell: ({ row }) => <span className="text-xs font-medium">{row.original.admission?.program?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'receiptDate',
      header: 'Payment Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'transactionId',
      header: 'Transaction ID',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{getValue() as string || '-'}</span>,
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
      header: () => <div className="text-right">Amount (₹)</div>,
      cell: ({ getValue }) => (
        <div className="text-right font-mono font-bold text-slate-900">
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-[11px]">
            {getValue() as string}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Payment Report"
        description="Summary of all transactions processed via online gateway, UPI, and bank transfers"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Online Volume</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(totalAmount)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Landmark className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Online Transactions</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{filteredData.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 py-3.5 px-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold text-slate-800">
              Online Payment Details
            </CardTitle>

            {/* Filter controls: 1. From Date, 2. To Date, Download Online Payment Report Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>1. From Date:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs w-[130px] bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>2. To Date:</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs w-[130px] bg-white"
                />
              </div>

              <Button
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                onClick={fetchPayments}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={() => { setFromDate(''); setToDate(''); }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </Button>

              {/* Exact requested button label */}
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                onClick={handleDownloadOnlineReport}
              >
                <Download className="w-3.5 h-3.5" />
                Download Online Payment Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            searchPlaceholder="Search receipt or student..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
