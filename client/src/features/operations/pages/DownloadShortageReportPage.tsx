import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, AlertTriangle, Calendar, FileDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';

interface ShortageReportItem {
  id: string;
  reportNo: string;
  reportDate: string;
  poNo: string;
  lrNo: string;
  itemsAffected: string;
  quantity: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REPLACED';
}

const initialShortageReports: ShortageReportItem[] = [
  {
    id: 'SR-001',
    reportNo: 'SR-2026-0041',
    reportDate: '2026-08-01',
    poNo: 'PO-2026-0891',
    lrNo: 'VRL-992014',
    itemsAffected: 'Play Group Welcome Kit (Defective Soft Toy)',
    quantity: 2,
    status: 'REJECTED',
  },
  {
    id: 'SR-002',
    reportNo: 'SR-2026-0042',
    reportDate: '2026-08-01',
    poNo: 'PO-2026-0892',
    lrNo: 'TCI-441209',
    itemsAffected: 'Nursery Activity Workbook (Water Damaged)',
    quantity: 4,
    status: 'REJECTED',
  },
  {
    id: 'SR-003',
    reportNo: 'SR-2026-0045',
    reportDate: '2026-08-15',
    poNo: 'PO-2026-0914',
    lrNo: 'DTDC-881293',
    itemsAffected: 'Sunoia Junior Uniform Set (Shortage - Size 26)',
    quantity: 3,
    status: 'APPROVED',
  },
  {
    id: 'SR-004',
    reportNo: 'SR-2026-0050',
    reportDate: '2026-09-02',
    poNo: 'PO-2026-0955',
    lrNo: 'BLUEDART-55012',
    itemsAffected: 'Sunoia Senior Story Books Pack (Torn Covers)',
    quantity: 1,
    status: 'REPLACED',
  },
];

export default function DownloadShortageReportPage() {
  const [data] = useState<ShortageReportItem[]>(initialShortageReports);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredData = data.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (fromDate && item.reportDate < fromDate) return false;
    if (toDate && item.reportDate > toDate) return false;
    return true;
  });

  const handleDownloadShortageReport = () => {
    const rows = filteredData.map((item) => ({
      'Shortage/Damaged No.': item.reportNo,
      'Report Date': formatDate(item.reportDate),
      'PO No.': item.poNo,
      'LR No.': item.lrNo,
      'Items Affected': item.itemsAffected,
      'Quantity': item.quantity,
      'Status': item.status,
    }));
    downloadAsCSV(rows, 'Shortage_Damage_Report');
  };

  const columns: ColumnDef<ShortageReportItem>[] = [
    {
      accessorKey: 'reportNo',
      header: 'Shortage/Damaged No.',
      cell: ({ getValue }) => <span className="font-mono font-bold text-slate-800">{getValue() as string}</span>,
    },
    {
      accessorKey: 'reportDate',
      header: 'Report Date',
      cell: ({ getValue }) => <span>{formatDate(getValue() as string)}</span>,
    },
    {
      accessorKey: 'poNo',
      header: 'PO No.',
      cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span>,
    },
    {
      accessorKey: 'lrNo',
      header: 'LR No.',
      cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span>,
    },
    {
      accessorKey: 'itemsAffected',
      header: 'Item Details',
      cell: ({ getValue }) => <span className="text-slate-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="text-center">Qty</div>,
      cell: ({ getValue }) => <div className="text-center font-bold">{getValue() as number}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        let badgeColor = 'bg-slate-100 text-slate-700';
        if (val === 'APPROVED' || val === 'REPLACED') badgeColor = 'bg-emerald-100 text-emerald-800';
        else if (val === 'REJECTED') badgeColor = 'bg-red-100 text-red-800';
        else if (val === 'UNDER_REVIEW') badgeColor = 'bg-amber-100 text-amber-800';
        return <Badge className={`${badgeColor} border-none`}>{val}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Storage Damage Report"
          description="Download Shortage & Damage audit report logs for all franchise purchase orders"
          className="mb-0"
        />

        {/* Prominent Download Button */}
        <Button
          onClick={handleDownloadShortageReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 px-5 py-2.5 shadow"
        >
          <FileDown className="w-4 h-4" />
          Download Shortage Report
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base font-bold text-slate-800">
              Shortage Damage Report Log
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>From:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs w-[130px]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>To:</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs w-[130px]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded px-2.5 py-1 text-xs bg-white h-8"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="REPLACED">Replaced</option>
                </select>
              </div>

              <Button
                size="sm"
                onClick={handleDownloadShortageReport}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download to Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search PO, LR or Shortage No..."
            showExportBox={true}
            exportTitle="shortage_damage_report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
