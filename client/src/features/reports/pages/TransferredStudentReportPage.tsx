import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, FileSpreadsheet, Presentation, Search } from 'lucide-react';
import { downloadAsExcel, downloadAsWord, downloadAsPowerPoint, downloadAsPDF } from '@/lib/export';
import { showToast } from '@/lib/toast';

interface TransferredStudentRow {
  id: string;
  regionName: string;
  franchiseeCode: string;
  description: string;
  programName: string;
  fullName: string;
  sex: string;
}

const dummyTransferredStudents: TransferredStudentRow[] = [
  { id: '1', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', description: 'Transfer Out to SunoiaKids Pune', programName: 'Sunoia Senior', fullName: 'Kabir Dev Sharma', sex: 'Male' },
  { id: '2', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', description: 'Transfer In from SunoiaKids Nagpur', programName: 'Sunoia Junior', fullName: 'Maya Roy', sex: 'Female' },
  { id: '3', regionName: 'West', franchiseeCode: 'SK-Dhule-Deopur', description: 'Transfer Out to SunoiaKids Mumbai', programName: 'Nursery', fullName: 'Arjun Verma', sex: 'Male' },
];

export default function TransferredStudentReportPage() {
  const [data] = useState<TransferredStudentRow[]>(dummyTransferredStudents);
  const [findText, setFindText] = useState('');
  const franchisee = 'SK-Dhule-Deopur';

  const handleExport = (format: 'word' | 'excel' | 'powerpoint' | 'pdf') => {
    const exportData = data.map(d => ({
      'Region Name': d.regionName,
      'Franchisee Code': d.franchiseeCode,
      'Description': d.description,
      'Program Name': d.programName,
      'Full Name': d.fullName,
      'Sex': d.sex,
    }));

    if (format === 'excel') {
      downloadAsExcel(exportData, 'transfer_student_report');
    } else if (format === 'word') {
      downloadAsWord(exportData, 'transfer_student_report', `Transfer Student Report — ${franchisee}`);
    } else if (format === 'powerpoint') {
      downloadAsPowerPoint(exportData, 'transfer_student_report', `Transfer Student Report — ${franchisee}`);
    } else if (format === 'pdf') {
      downloadAsPDF(exportData, `Transfer Student Report — ${franchisee}`);
    }
    showToast(`Exported Transfer Student Report as ${format.toUpperCase()}`, 'success');
  };

  const filteredData = findText.trim()
    ? data.filter(d =>
        d.fullName.toLowerCase().includes(findText.toLowerCase()) ||
        d.description.toLowerCase().includes(findText.toLowerCase()) ||
        d.programName.toLowerCase().includes(findText.toLowerCase())
      )
    : data;

  const columns: ColumnDef<TransferredStudentRow, any>[] = [
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
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => <span className="text-xs text-slate-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'programName',
      header: 'Program Name',
      cell: ({ getValue }) => <span className="text-xs font-medium">{getValue() as string}</span>,
    },
    {
      accessorKey: 'fullName',
      header: 'Full Name',
      cell: ({ getValue }) => <span className="font-bold text-xs text-slate-900">{getValue() as string}</span>,
    },
    {
      accessorKey: 'sex',
      header: 'Sex',
      cell: ({ getValue }) => <span className="text-xs">{getValue() as string}</span>,
    },
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Transfer Student Report</h1>
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
              placeholder="Search transferred students..."
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

      {/* Transfer Student Report Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 font-bold text-slate-800 text-sm">Transfer Student Report</div>
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
