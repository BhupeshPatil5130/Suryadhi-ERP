import { useState, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, FileText, Search, CreditCard, Receipt, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/api/client';
import { downloadAsPDF, downloadCSV, apiDownload } from '@/lib/downloadUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FranchiseeInvoice {
  id: string;
  entryDate: string;
  particulars: string;
  entryType: string;
  invoiceAmount: number;
  receiptAmount: number;
  balance: number;
}

const mockInvoices: FranchiseeInvoice[] = [
  { id: 'i1', entryDate: '2026-06-01', particulars: 'Franchisee Royalty Invoice - Jun 26', entryType: 'ROYALTY', invoiceAmount: 25000, receiptAmount: 25000, balance: 0 },
  { id: 'i2', entryDate: '2026-06-05', particulars: 'Admission Kit Invoice - Aarav Sharma', entryType: 'FRANCHISEE_FEES', invoiceAmount: 18500, receiptAmount: 18500, balance: 0 },
  { id: 'i3', entryDate: '2026-06-12', particulars: 'Term 1 Fees Invoice - Diya Patel', entryType: 'FRANCHISEE_FEES', invoiceAmount: 32000, receiptAmount: 0, balance: 32000 },
];

export default function InvoiceDownloadPage() {
  const [data, setData] = useState<FranchiseeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ totalInvoice: 0, totalReceipt: 0, balance: 0 });

  const [selectedInvoice, setSelectedInvoice] = useState<FranchiseeInvoice | null>(null);

  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');

  const handleClear = () => {
    setFrom('');
    setTo('');
    setType('');
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/franchisee/invoices', {
        params: {
          ...(from && { from }),
          ...(to && { to }),
          ...(type && { type }),
        }
      });
      if (res.data.success) {
        setData(res.data.data);
        if (res.data.summary) {
          setSummary({
            totalInvoice: Number(res.data.summary.totalInvoice),
            totalReceipt: Number(res.data.summary.totalReceipt),
            balance: Number(res.data.summary.balance),
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch franchisee invoices, using fallback mock invoice statements', err);
      setData(mockInvoices);
      setSummary({ totalInvoice: 75500, totalReceipt: 43500, balance: 32000 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [from, to, type]);

  const handleDownload = (invoice: FranchiseeInvoice) => {
    downloadAsPDF({
      title: 'Invoice Statement',
      subtitle: invoice.particulars,
      filename: `invoice-${invoice.id}`,
      columns: ['Date', 'Particulars', 'Type', 'Invoice Amount', 'Receipt Amount', 'Balance'],
      rows: [[
        formatDate(invoice.entryDate),
        invoice.particulars,
        invoice.entryType,
        formatCurrency(invoice.invoiceAmount),
        formatCurrency(invoice.receiptAmount),
        formatCurrency(invoice.balance),
      ]],
    });
  };

  const handleBulkDownload = () => {
    const fallback = data.map((inv) => ({
      Date: formatDate(inv.entryDate),
      Particulars: inv.particulars,
      Type: inv.entryType,
      'Invoice Amount': inv.invoiceAmount,
      'Receipt Amount': inv.receiptAmount,
      Balance: inv.balance,
    }));
    apiDownload(
      'invoices',
      { ...(from && { from }), ...(to && { to }), ...(type && { entryType: type }) },
      fallback,
      'franchisee-invoices'
    );
  };

  const columns: ColumnDef<FranchiseeInvoice>[] = [
    {
      accessorKey: 'entryDate',
      header: 'Date',
      cell: ({ getValue }) => <span className="text-sm">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'particulars',
      header: 'Particulars',
      cell: ({ getValue }) => <span className="text-sm font-medium text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'entryType',
      header: 'Entry Type',
      cell: ({ getValue }) => {
        const t = getValue() as string;
        return (
          <Badge className={t === 'ROYALTY' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
            {t.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'invoiceAmount',
      header: () => <div className="text-right">Invoice Amount</div>,
      cell: ({ getValue }) => <div className="text-right text-sm font-mono">{formatCurrency(Number(getValue()))}</div>,
    },
    {
      accessorKey: 'receiptAmount',
      header: () => <div className="text-right">Receipt Amount</div>,
      cell: ({ getValue }) => <div className="text-right text-sm font-mono text-emerald-600 font-semibold">{formatCurrency(Number(getValue()))}</div>,
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-right">Balance Due</div>,
      cell: ({ getValue }) => (
        <div className={`text-right text-sm font-mono font-bold ${Number(getValue()) > 0 ? 'text-red-600' : 'text-slate-700'}`}>
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      id: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const bal = row.original.balance;
        const inv = row.original.invoiceAmount;
        const status = bal === 0 ? 'PAID' : bal < inv ? 'PARTIAL' : 'PENDING';
        return (
          <div className="text-center">
            <Badge
              className={
                status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border-none'
                  : status === 'PARTIAL'
                  ? 'bg-blue-100 text-blue-800 border-none'
                  : 'bg-amber-100 text-amber-800 border-none'
              }
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-blue-700 hover:bg-blue-50"
            onClick={() => setSelectedInvoice(row.original)}
          >
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex gap-1 text-slate-700 hover:bg-slate-50"
            onClick={() => handleDownload(row.original)}
          >
            <Download className="w-3 h-3" />
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Download"
        description="View and download franchisee invoices, royalties statements, and transaction PDFs"
      />

      {/* Invoice Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Invoiced</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(summary.totalInvoice)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Receipts (Paid)</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(summary.totalReceipt)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Outstanding Balance</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">{formatCurrency(summary.balance)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 flex flex-wrap flex-row items-center justify-between gap-4 py-4">
          <CardTitle className="text-base font-bold">Invoices Registry</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>From:</span>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs w-[130px]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>To:</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs w-[130px]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Select Type:</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-[140px]"
              >
                <option value="">All Types</option>
                <option value="FRANCHISEE_FEES">Franchisee Fees</option>
                <option value="ROYALTY">Royalties</option>
                <option value="WELCOME_KIT">Welcome Kit</option>
                <option value="KIT_PURCHASE">Kit Purchase</option>
              </select>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={fetchInvoices}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDownload} className="h-8 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search invoice particulars..."
            showExportBox={true}
            exportTitle="franchisee_invoices"
          />
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Invoice Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Particulars:</span>
                  <span className="font-semibold text-slate-900">{selectedInvoice.particulars}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span>{formatDate(selectedInvoice.entryDate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Invoice Type:</span>
                  <Badge variant="outline">{selectedInvoice.entryType}</Badge>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Invoice Amount:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedInvoice.invoiceAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700">Receipt Amount (Paid):</span>
                  <span className="font-mono text-emerald-700 font-medium">{formatCurrency(selectedInvoice.receiptAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>Balance Due:</span>
                  <span className={`font-mono ${selectedInvoice.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {formatCurrency(selectedInvoice.balance)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => handleDownload(selectedInvoice)} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
