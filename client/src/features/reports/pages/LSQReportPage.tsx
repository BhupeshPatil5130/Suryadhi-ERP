import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { downloadCSV } from '@/lib/downloadUtils';
import { showToast } from '@/lib/toast';

interface LSQReportRow {
  id: string;
  franchiseeCode: string;
  source: string;
  status: 'Converted' | 'Not Converted';
  playGroup: number;
  nursery: number;
  sunoiaJunior: number;
  sunoiaSenior: number;
  total: number;
}

const dummyLSQData: LSQReportRow[] = [
  { id: '1', franchiseeCode: 'SK-Dhule-Deopur', source: 'LeadSquared', status: 'Converted', playGroup: 12, nursery: 9, sunoiaJunior: 18, sunoiaSenior: 8, total: 47 },
  { id: '2', franchiseeCode: 'SK-Dhule-Deopur', source: 'LeadSquared', status: 'Not Converted', playGroup: 3, nursery: 2, sunoiaJunior: 7, sunoiaSenior: 2, total: 14 },
];

export default function LSQReportPage() {
  const [data] = useState<LSQReportRow[]>(dummyLSQData);
  const [pageSize, setPageSize] = useState('10');

  const handleDownloadExcel = () => {
    downloadCSV(
      data.map(d => ({
        'Franchisee Code': d.franchiseeCode,
        'Source': d.source,
        'Status': d.status,
        'Play Group': d.playGroup,
        'Nursery': d.nursery,
        'Sunoia Junior': d.sunoiaJunior,
        'Sunoia Senior': d.sunoiaSenior,
        'Total': d.total,
      })),
      'leadsquared_enquiry_report'
    );
    showToast('Downloaded LeadSquared Enquiry Report to Excel!', 'success');
  };

  const columns: ColumnDef<LSQReportRow, any>[] = [
    {
      accessorKey: 'franchiseeCode',
      header: 'Franchisee Code',
      cell: ({ getValue }) => <span className="font-mono font-bold text-xs text-blue-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ getValue }) => <span className="text-xs font-semibold text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${val === 'Converted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: 'playGroup',
      header: () => <div className="text-center font-bold">Play Group</div>,
      cell: ({ getValue }) => <div className="text-center font-mono text-xs">{getValue() as number}</div>,
    },
    {
      accessorKey: 'nursery',
      header: () => <div className="text-center font-bold">Nursery</div>,
      cell: ({ getValue }) => <div className="text-center font-mono text-xs">{getValue() as number}</div>,
    },
    {
      accessorKey: 'sunoiaJunior',
      header: () => <div className="text-center font-bold">Sunoia Junior</div>,
      cell: ({ getValue }) => <div className="text-center font-mono text-xs">{getValue() as number}</div>,
    },
    {
      accessorKey: 'sunoiaSenior',
      header: () => <div className="text-center font-bold">Sunoia Senior</div>,
      cell: ({ getValue }) => <div className="text-center font-mono text-xs">{getValue() as number}</div>,
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
          <h1 className="text-2xl font-normal text-slate-800">LeadSquared Enquiry Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">Program-wise conversion breakdown from LeadSquared CRM</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Download To Excel Button */}
          <Button
            onClick={handleDownloadExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download To Excel
          </Button>

          {/* Right Side Corner: Show Entries */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Show:</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-[65px] h-8 text-xs bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>Entries</span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search LeadSquared reports..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
