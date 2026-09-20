import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, CreditCard } from 'lucide-react';
import { downloadCSV } from '@/lib/downloadUtils';
import { showToast } from '@/lib/toast';

interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  date: string;
  category: string; // InvoiceFor
  totalAmount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  paidDate: string;
  paymentMode: string;
  paymentReference: string;
}

const dummyInvoices: InvoiceDetail[] = [
  {
    id: '1',
    invoiceNo: 'INV-HQ-26-4421',
    date: '2026-06-01',
    category: 'Royalty Fee (SLPL Share)',
    totalAmount: 85000,
    status: 'PAID',
    paidDate: '2026-06-03',
    paymentMode: 'Online / NEFT',
    paymentReference: 'UTR-SBIN00291048',
  },
  {
    id: '2',
    invoiceNo: 'INV-HQ-26-4890',
    date: '2026-06-05',
    category: 'Welcome Kit & Uniform Purchase',
    totalAmount: 125000,
    status: 'UNPAID',
    paidDate: '—',
    paymentMode: '—',
    paymentReference: '—',
  },
  {
    id: '3',
    invoiceNo: 'INV-HQ-26-4911',
    date: '2026-05-15',
    category: 'Marketing & Digital Support',
    totalAmount: 25000,
    status: 'OVERDUE',
    paidDate: '—',
    paymentMode: '—',
    paymentReference: '—',
  },
  {
    id: '4',
    invoiceNo: 'INV-HQ-26-5012',
    date: '2026-06-12',
    category: 'Annual Renewal Fee',
    totalAmount: 50000,
    status: 'PAID',
    paidDate: '2026-06-14',
    paymentMode: 'Cheque',
    paymentReference: 'CHQ-882194 / HDFC',
  },
];

export default function ViewInvoicePage() {
  const [data, setData] = useState<InvoiceDetail[]>(dummyInvoices);

  const handlePay = (invoice: InvoiceDetail) => {
    showToast(`Redirecting to secure gateway for invoice ${invoice.invoiceNo}...`, 'info');
    setTimeout(() => {
      setData(prev => prev.map(inv => inv.id === invoice.id ? {
        ...inv,
        status: 'PAID',
        paidDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Online Transfer',
        paymentReference: `PAY-${Date.now().toString().slice(-8)}`
      } : inv));
      showToast(`Payment successful for invoice ${invoice.invoiceNo}!`, 'success');
    }, 1200);
  };

  const handleExportExcel = () => {
    downloadCSV(
      data.map(d => ({
        'Invoice No': d.invoiceNo,
        'Date': formatDate(d.date),
        'Category (InvoiceFor)': d.category,
        'Total Amount': d.totalAmount,
        'Status': d.status,
        'Paid Date': d.paidDate,
        'Payment Mode': d.paymentMode,
        'Payment Reference': d.paymentReference,
      })),
      'franchisee_invoice_details'
    );
    showToast('Invoices exported to Excel!', 'success');
  };

  const columns: ColumnDef<InvoiceDetail, any>[] = [
    {
      accessorKey: 'invoiceNo',
      header: '1. Invoice No',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'date',
      header: '2. Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'category',
      header: '3. Category (InvoiceFor)',
      cell: ({ getValue }) => <span className="font-medium text-xs text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: () => <div className="text-right">4. Total Amount</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-xs text-slate-900">{formatCurrency(getValue() as number)}</div>,
    },
    {
      accessorKey: 'status',
      header: '5. Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <Badge 
            className={
              status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]' :
              status === 'OVERDUE' ? 'bg-red-100 text-red-800 border-red-200 text-[10px]' : 
              'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paidDate',
      header: '6. PaidDate',
      cell: ({ getValue }) => <span className="text-xs">{getValue() as string}</span>,
    },
    {
      accessorKey: 'paymentMode',
      header: '7. PaymentMode',
      cell: ({ getValue }) => <span className="text-xs font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'paymentReference',
      header: '8. PaymentReference',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex items-center gap-1.5">
            {inv.status !== 'PAID' ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2 font-semibold shadow-none gap-1"
                onClick={() => handlePay(inv)}
              >
                <CreditCard className="h-3 w-3" /> Click here For Payment
              </Button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                ✓ Paid
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Franchisee Invoice Details</h1>
          <p className="text-xs text-slate-500 mt-0.5">Billing statements generated by Suryadhi Learning Pvt. Ltd. (SLPL) HQ</p>
        </div>
        <Button
          onClick={handleExportExcel}
          className="bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-xs font-semibold gap-1.5 shadow-sm"
        >
          <Download className="h-3.5 w-3.5" /> Download to Excel
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search invoices by number, category, or UTR..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
