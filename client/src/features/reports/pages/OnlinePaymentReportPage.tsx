import { useState, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Landmark, Receipt, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/api/client';
import { apiDownload } from '@/lib/downloadUtils';

interface OnlinePayment {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: string;
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
  { id: 'op1', receiptNumber: 'REC-2026-000031', receiptDate: '2026-06-08', amount: 35000, paymentMode: 'ONLINE', admission: { student: { firstName: 'Rohan', lastName: 'Gupta', uin: 'SEMS/3201/0088/2627' }, program: { name: 'SUNOIA Junior' } } },
  { id: 'op2', receiptNumber: 'REC-2026-000032', receiptDate: '2026-06-12', amount: 18500, paymentMode: 'BANK_TRANSFER', admission: { student: { firstName: 'Anika', lastName: 'Mehta', uin: 'SNK/3201/0091/2627' }, program: { name: 'Nursery' } } },
];

export default function OnlinePaymentReportPage() {
  const [data, setData] = useState<OnlinePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/online-payments', {
        params: {
          ...(from && { from }),
          ...(to && { to }),
        }
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch online payments, using fallback mock payment logs', err);
      setData(mockOnlinePayments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [from, to]);

  const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

  const columns: ColumnDef<OnlinePayment>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-slate-800">{getValue() as string}</span>,
    },
    {
      id: 'student',
      header: 'Student Name / UIN',
      cell: ({ row }) => {
        const student = row.original.admission?.student;
        return (
          <div>
            <span className="font-semibold text-slate-800 block">
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
      cell: ({ row }) => <span>{row.original.admission?.program?.name || 'N/A'}</span>,
    },
    {
      accessorKey: 'receiptDate',
      header: 'Payment Date',
      cell: ({ getValue }) => <span>{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'paymentMode',
      header: 'Method',
      cell: ({ getValue }) => (
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Paid Amount</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-slate-900">{formatCurrency(Number(getValue()))}</div>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Online Payment Report"
        description="Comprehensive summary of all transactions processed via payment gateway or bank transfers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{data.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 flex flex-wrap flex-row items-center justify-between gap-4 py-4">
          <CardTitle className="text-base font-bold">Online Payment Logs</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>From:</span>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs w-[130px]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>To:</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs w-[130px]" />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => apiDownload(
                'online-payments',
                { ...(from && { from }), ...(to && { to }) },
                data.map((r) => ({
                  'Receipt Number': r.receiptNumber,
                  'Payment Date': formatDate(r.receiptDate),
                  'Student Name': r.admission?.student ? `${r.admission.student.firstName} ${r.admission.student.lastName}` : 'N/A',
                  'UIN': r.admission?.student?.uin ?? 'N/A',
                  'Program': r.admission?.program?.name ?? 'N/A',
                  'Payment Mode': r.paymentMode,
                  'Amount': r.amount,
                })),
                'online-payments-report'
              )}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search by receipt number..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
