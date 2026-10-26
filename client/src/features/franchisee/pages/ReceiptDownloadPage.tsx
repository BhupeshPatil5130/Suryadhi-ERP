import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Receipt, Eye, Search, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsPDF } from '@/lib/downloadUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';

interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  receiptId: string;
  collectionType: string;
  receiptDate: string;
  bankAccountNumber: string;
  receiptAmount: number;
}

const dummyReceiptRecords: ReceiptRecord[] = [
  { id: '1', receiptNumber: 'REC-2026-0001', receiptId: 'RCP-3201-001', collectionType: 'Term 1 Tuition Fee', receiptDate: '2026-06-02', bankAccountNumber: 'XXXXXX4819', receiptAmount: 24000 },
  { id: '2', receiptNumber: 'REC-2026-0002', receiptId: 'RCP-3201-002', collectionType: 'Welcome Kit Fee', receiptDate: '2026-06-04', bankAccountNumber: 'XXXXXX4819', receiptAmount: 4500 },
  { id: '3', receiptNumber: 'REC-2026-0003', receiptId: 'RCP-3201-003', collectionType: 'Admission Registration', receiptDate: '2026-06-06', bankAccountNumber: 'XXXXXX9012', receiptAmount: 5000 },
  { id: '4', receiptNumber: 'REC-2026-0004', receiptId: 'RCP-3201-004', collectionType: 'Term 1 Tuition Fee', receiptDate: '2026-06-09', bankAccountNumber: 'XXXXXX4819', receiptAmount: 21000 },
  { id: '5', receiptNumber: 'REC-2026-0005', receiptId: 'RCP-3201-005', collectionType: 'Winter Uniform Fee', receiptDate: '2026-06-11', bankAccountNumber: 'XXXXXX3341', receiptAmount: 2500 },
  { id: '6', receiptNumber: 'REC-2026-0006', receiptId: 'RCP-3201-006', collectionType: 'Transport Fee', receiptDate: '2026-06-14', bankAccountNumber: 'XXXXXX4819', receiptAmount: 6000 },
];

export default function ReceiptDownloadPage() {
  const [data] = useState<ReceiptRecord[]>(dummyReceiptRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      r =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.receiptId.toLowerCase().includes(q) ||
        r.collectionType.toLowerCase().includes(q) ||
        r.bankAccountNumber.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const handleClear = () => {
    setSearchQuery('');
    showToast('Search cleared', 'info');
  };

  const handleDownloadPDF = (rcp: ReceiptRecord) => {
    downloadAsPDF({
      title: `Fee Receipt — ${rcp.receiptNumber}`,
      subtitle: `Receipt ID: ${rcp.receiptId} | Date: ${formatDate(rcp.receiptDate)}`,
      filename: `receipt-${rcp.receiptNumber}`,
      columns: ['Receipt No', 'Receipt ID', 'Collection Type', 'Date', 'Bank A/c', 'Amount (₹)'],
      rows: [[
        rcp.receiptNumber,
        rcp.receiptId,
        rcp.collectionType,
        formatDate(rcp.receiptDate),
        rcp.bankAccountNumber,
        formatCurrency(rcp.receiptAmount),
      ]],
    });
    showToast(`Receipt PDF downloaded successfully!`, 'success');
  };

  const columns: ColumnDef<ReceiptRecord, any>[] = [
    {
      accessorKey: 'receiptNumber',
      header: '1. Receipt Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'receiptId',
      header: '2. Receipt ID',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'collectionType',
      header: '3. Collection Type',
      cell: ({ getValue }) => <span className="text-xs font-medium text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'receiptDate',
      header: '4. Receipt Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'bankAccountNumber',
      header: '5. Bank Account Number',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'receiptAmount',
      header: () => <div className="text-right">6. Receipt Amount</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-xs text-emerald-700">{formatCurrency(getValue() as number)}</div>,
    },
    {
      id: 'actions',
      header: () => <div className="text-center">7. Action</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const rcp = row.original;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5 bg-white text-blue-700 hover:bg-blue-50 gap-1 font-semibold"
              onClick={() => setSelectedReceipt(rcp)}
              title="View Receipt"
            >
              <Eye className="h-3 w-3" /> View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
              title="Download PDF"
              onClick={() => handleDownloadPDF(rcp)}
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
          <h1 className="text-2xl font-normal text-slate-800">Receipt Download</h1>
          <p className="text-xs text-slate-500 mt-0.5">Search, view, and export student and franchisee receipts</p>
        </div>
      </div>

      {/* Search & Clear Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
        <div className="flex items-center flex-wrap gap-2.5 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt number, ID, or collection type..."
              className="pl-8 h-8 text-xs bg-white border-slate-300"
            />
          </div>

          <Button
            size="sm"
            onClick={() => showToast(`Filtered ${filteredData.length} receipts`, 'info')}
            className="h-8 text-xs bg-[#0056b3] hover:bg-[#004494] text-white px-4 font-semibold"
          >
            Search
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="h-8 text-xs text-slate-600 hover:bg-slate-100 gap-1 px-3"
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
            searchPlaceholder="Filter results..."
          />
        </CardContent>
      </Card>

      {/* View Receipt Dialog */}
      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                Receipt — {selectedReceipt.receiptNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-blue-700">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Receipt ID:</span>
                <span className="font-mono">{selectedReceipt.receiptId}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Collection Type:</span>
                <span className="font-medium">{selectedReceipt.collectionType}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Receipt Date:</span>
                <span>{formatDate(selectedReceipt.receiptDate)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Bank Account Number:</span>
                <span className="font-mono">{selectedReceipt.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Receipt Amount:</span>
                <span className="font-mono font-bold text-sm text-emerald-700">{formatCurrency(selectedReceipt.receiptAmount)}</span>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)} className="h-8 text-xs">
                  Close
                </Button>
                <Button size="sm" onClick={() => handleDownloadPDF(selectedReceipt)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
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
