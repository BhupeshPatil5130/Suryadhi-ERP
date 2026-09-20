import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, FileSpreadsheet, Presentation, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsExcel, downloadAsWord, downloadAsPowerPoint, downloadAsPDF } from '@/lib/export';
import { showToast } from '@/lib/toast';

interface CancelledReceiptRow {
  id: string;
  regionName: string;
  franchiseeCode: string;
  studentName: string;
  receiptNumber: string;
  amountInRs: number;
  instrumentNumber: string;
  cancellationDate: string;
}

const dummyCancelledReceipts: CancelledReceiptRow[] = [
  {
    id: '1',
    regionName: 'West',
    franchiseeCode: 'SK-Dhule-Deopur',
    studentName: 'Aarav Rahul Sharma',
    receiptNumber: 'REC-2026-000042',
    amountInRs: 18500,
    instrumentNumber: 'CHQ-882194',
    cancellationDate: '2026-06-04',
  },
  {
    id: '2',
    regionName: 'West',
    franchiseeCode: 'SK-Dhule-Deopur',
    studentName: 'Mahi Sachin Rathod',
    receiptNumber: 'REC-2026-000089',
    amountInRs: 25000,
    instrumentNumber: 'NEFT-SBIN00291048',
    cancellationDate: '2026-06-11',
  },
];

export default function CancelledReceiptsReportPage() {
  const [data] = useState<CancelledReceiptRow[]>(dummyCancelledReceipts);
  const [findText, setFindText] = useState('');
  const franchisee = 'SK-Dhule-Deopur';

  const handleExport = (format: 'word' | 'excel' | 'powerpoint' | 'pdf') => {
    const exportData = data.map(d => ({
      'Region Name': d.regionName,
      'Franchisee Code': d.franchiseeCode,
      'Student Name': d.studentName,
      'Receipt Number': d.receiptNumber,
      'Amount in Rs.': d.amountInRs,
      'Instrument Number': d.instrumentNumber,
      'Cancellation Date': formatDate(d.cancellationDate),
    }));

    if (format === 'excel') {
      downloadAsExcel(exportData, 'receipt_cancellation');
    } else if (format === 'word') {
      downloadAsWord(exportData, 'receipt_cancellation', `Receipt Cancellation — ${franchisee}`);
    } else if (format === 'powerpoint') {
      downloadAsPowerPoint(exportData, 'receipt_cancellation', `Receipt Cancellation — ${franchisee}`);
    } else if (format === 'pdf') {
      downloadAsPDF(exportData, `Receipt Cancellation — ${franchisee}`);
    }
    showToast(`Exported Cancelled Receipts as ${format.toUpperCase()}`, 'success');
  };

  const filteredData = findText.trim()
    ? data.filter(d =>
        d.studentName.toLowerCase().includes(findText.toLowerCase()) ||
        d.receiptNumber.toLowerCase().includes(findText.toLowerCase()) ||
        d.instrumentNumber.toLowerCase().includes(findText.toLowerCase())
      )
    : data;

  const columns: ColumnDef<CancelledReceiptRow, any>[] = [
    {
      accessorKey: 'regionName',
      header: 'Region Name',
      cell: ({ getValue }) => <span className="font-semibold text-xs text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'franchiseeCode',
      header: 'Franchisee Code',
      cell: ({ getValue }) => <span className="font-mono text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ getValue }) => <span className="font-medium text-xs text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-rose-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'amountInRs',
      header: () => <div className="text-right">Amount in Rs.</div>,
      cell: ({ getValue }) => <div className="text-right font-mono font-bold text-xs text-slate-800">{formatCurrency(getValue() as number)}</div>,
    },
    {
      accessorKey: 'instrumentNumber',
      header: 'Instrument Number',
      cell: ({ getValue }) => <span className="font-mono text-xs text-slate-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'cancellationDate',
      header: 'Cancellation Date',
      cell: ({ getValue }) => <span className="text-xs">{formatDate(getValue() as string)}</span>,
    },
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Receipt Cancellation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Franchisee: <strong>{franchisee}</strong></p>
        </div>

        {/* Export Box: Word, Excel, PowerPoint, PDF */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded p-1 shadow-sm">
          <span className="text-xs font-bold text-slate-600 px-2">Export Box:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('word')}
            className="h-7 text-xs px-2 gap-1 text-blue-700 hover:bg-blue-50 border-slate-200"
          >
            <FileText className="h-3 w-3" /> Word
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            className="h-7 text-xs px-2 gap-1 text-emerald-700 hover:bg-emerald-50 border-slate-200"
          >
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('powerpoint')}
            className="h-7 text-xs px-2 gap-1 text-amber-700 hover:bg-amber-50 border-slate-200"
          >
            <Presentation className="h-3 w-3" /> PowerPoint
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="h-7 text-xs px-2 gap-1 text-rose-700 hover:bg-rose-50 border-slate-200"
          >
            <Download className="h-3 w-3" /> PDF
          </Button>
        </div>
      </div>

      {/* Find / Next Search Bar */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-md">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Find / Next:</span>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Search cancelled receipts..."
              className="pl-8 h-8 text-xs bg-white border-slate-300"
            />
          </div>
          <Button
            size="sm"
            onClick={() => showToast(`Found ${filteredData.length} records`, 'info')}
            className="h-8 text-xs bg-[#0056b3] hover:bg-[#004494] text-white px-3 font-semibold"
          >
            Find
          </Button>
        </div>
      </div>

      {/* Cancelled Receipt's Details Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 font-bold text-slate-800 text-sm">Cancelled Receipt's Details</div>
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Filter table..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
