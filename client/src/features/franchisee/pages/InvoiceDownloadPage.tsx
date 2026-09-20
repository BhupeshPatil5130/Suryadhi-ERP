import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Eye, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsPDF, downloadCSV } from '@/lib/downloadUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: 'Invoice' | 'Credit Note' | 'Debit Note';
  collectionType: string;
  invoiceAmount: number;
}

const dummyRecords: InvoiceRecord[] = [
  { id: '1', invoiceNumber: 'INV-2026-00101', invoiceDate: '2026-06-01', invoiceType: 'Invoice', collectionType: 'Royalty SLPL Share', invoiceAmount: 45000 },
  { id: '2', invoiceNumber: 'CRN-2026-00042', invoiceDate: '2026-06-03', invoiceType: 'Credit Note', collectionType: 'Kit Return Adjustment', invoiceAmount: 6500 },
  { id: '3', invoiceNumber: 'DBN-2026-00015', invoiceDate: '2026-06-05', invoiceType: 'Debit Note', collectionType: 'Late Payment Penalty', invoiceAmount: 1200 },
  { id: '4', invoiceNumber: 'INV-2026-00145', invoiceDate: '2026-06-08', invoiceType: 'Invoice', collectionType: 'Summer Uniforms Batch', invoiceAmount: 38000 },
  { id: '5', invoiceNumber: 'CRN-2026-00055', invoiceDate: '2026-06-12', invoiceType: 'Credit Note', collectionType: 'Discount Reimbursement', invoiceAmount: 4000 },
  { id: '6', invoiceNumber: 'INV-2026-00189', invoiceDate: '2026-06-15', invoiceType: 'Invoice', collectionType: 'Welcome Kits Reorder', invoiceAmount: 52000 },
];

export default function InvoiceDownloadPage() {
  const [data] = useState<InvoiceRecord[]>(dummyRecords);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const filteredData = useMemo(() => {
    if (selectedType === 'ALL') return data;
    return data.filter(d => d.invoiceType === selectedType);
  }, [data, selectedType]);

  const handleClear = () => {
    setSelectedType('ALL');
    showToast('Filters cleared', 'info');
  };

  const handleDownloadPDF = (inv: InvoiceRecord) => {
    downloadAsPDF({
      title: `${inv.invoiceType} — ${inv.invoiceNumber}`,
      subtitle: `Collection Type: ${inv.collectionType} | Date: ${formatDate(inv.invoiceDate)}`,
      filename: `${inv.invoiceType.toLowerCase().replace(/\s+/g, '-')}-${inv.invoiceNumber}`,
      columns: ['Document No', 'Date', 'Type', 'Collection Category', 'Total Amount (₹)'],
      rows: [[
        inv.invoiceNumber,
        formatDate(inv.invoiceDate),
        inv.invoiceType,
        inv.collectionType,
        formatCurrency(inv.invoiceAmount),
      ]],
    });
    showToast(`${inv.invoiceType} PDF downloaded successfully!`, 'success');
  };

  const columns: ColumnDef<InvoiceRecord, any>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'invoiceDate',
      header: 'Invoice Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'invoiceType',
      header: 'Invoice Type',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        const color = val === 'Invoice' ? 'bg-blue-100 text-blue-800'
          : val === 'Credit Note' ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800';
        return <Badge className={`${color} text-[10px] font-semibold border-none`}>{val}</Badge>;
      },
    },
    {
      accessorKey: 'collectionType',
      header: 'Collection Type',
      cell: ({ getValue }) => <span className="text-xs font-medium text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'invoiceAmount',
      header: () => <div className="text-right">Invoice Amount</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-xs text-slate-800">{formatCurrency(getValue() as number)}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Action</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-white text-blue-700 hover:bg-blue-50 gap-1 font-semibold"
              onClick={() => setSelectedInvoice(inv)}
            >
              <Eye className="h-3 w-3" /> View Invoice
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
              title="Download PDF"
              onClick={() => handleDownloadPDF(inv)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Invoice & Notes Download</h1>
          <p className="text-xs text-slate-500 mt-0.5">Filter and download invoices, credit notes, and debit notes</p>
        </div>
      </div>

      {/* Filter Toolbar: Select Type + Clear Button */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">1. Select Type:</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-xs w-[180px] bg-white border-slate-300">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Invoice">Invoice</SelectItem>
                <SelectItem value="Credit Note">Credit Note</SelectItem>
                <SelectItem value="Debit Note">Debit Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-8 text-xs px-3 text-slate-600 hover:bg-slate-100 gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search by invoice number or collection type..."
          />
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                {selectedInvoice.invoiceType} — {selectedInvoice.invoiceNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-bold">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Invoice Date:</span>
                <span>{formatDate(selectedInvoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Invoice Type:</span>
                <Badge variant="outline">{selectedInvoice.invoiceType}</Badge>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Collection Type:</span>
                <span className="font-medium">{selectedInvoice.collectionType}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-mono font-bold text-sm text-blue-700">{formatCurrency(selectedInvoice.invoiceAmount)}</span>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)} className="h-8 text-xs">
                  Close
                </Button>
                <Button size="sm" onClick={() => handleDownloadPDF(selectedInvoice)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
