import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { downloadAsExcel, downloadAsWord, downloadAsPowerPoint, downloadAsPDF } from '@/lib/export';
import { showToast } from '@/lib/toast';

interface EnquiryReportRow {
  id: string;
  regionName: string;
  franchiseeCode: string;
  programName: string;
  converted: number;
  notConverted: number;
  total: number;
}

const dummyEnquiryReportData: EnquiryReportRow[] = [
  { id: '1', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', programName: 'Sunoia Senior', converted: 8, notConverted: 2, total: 10 },
  { id: '2', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', programName: 'Sunoia Junior', converted: 18, notConverted: 7, total: 25 },
  { id: '3', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', programName: 'Nursery', converted: 9, notConverted: 2, total: 11 },
  { id: '4', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', programName: 'Play Group', converted: 12, notConverted: 3, total: 15 },
];

export default function EnquiryDetailsReportPage() {
  const [data] = useState<EnquiryReportRow[]>(dummyEnquiryReportData);
  const franchisee = 'SK-Dhule-Deopur';

  const handleExport = (format: 'word' | 'excel' | 'powerpoint' | 'pdf') => {
    const exportData = data.map(d => ({
      'Region Name': d.regionName,
      'Franchisee Code': d.franchiseeCode,
      'Program Name': d.programName,
      'Converted': d.converted,
      'Not Converted': d.notConverted,
      'Total': d.total,
    }));

    if (format === 'excel') {
      downloadAsExcel(exportData, 'enquiry_details_report');
    } else if (format === 'word') {
      downloadAsWord(exportData, 'enquiry_details_report', `Enquiry Details — ${franchisee}`);
    } else if (format === 'powerpoint') {
      downloadAsPowerPoint(exportData, 'enquiry_details_report', `Enquiry Details — ${franchisee}`);
    } else if (format === 'pdf') {
      downloadAsPDF(exportData, `Enquiry Details — ${franchisee}`);
    }
    showToast(`Exported report as ${format.toUpperCase()}`, 'success');
  };

  const columns: ColumnDef<EnquiryReportRow, any>[] = [
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
      accessorKey: 'programName',
      header: 'Program Name',
      cell: ({ getValue }) => <span className="text-xs font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'converted',
      header: () => <div className="text-center font-bold text-emerald-700">Converted</div>,
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-xs text-emerald-700">{getValue() as number}</div>,
    },
    {
      accessorKey: 'notConverted',
      header: () => <div className="text-center font-bold text-amber-700">Not Converted</div>,
      cell: ({ getValue }) => <div className="text-center font-mono font-bold text-xs text-amber-700">{getValue() as number}</div>,
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-center font-bold text-slate-900">Total</div>,
      cell: ({ getValue }) => <div className="text-center font-mono font-black text-xs text-slate-900">{getValue() as number}</div>,
    },
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Enquiry Details Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">Franchisee: <strong>{franchisee}</strong></p>
        </div>

        {/* Export Box check here: Word, Excel, PowerPoint, PDF */}
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

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search enquiry details..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
