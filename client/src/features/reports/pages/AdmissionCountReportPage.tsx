import { useState, useEffect, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, RotateCcw, Calendar, Users, GraduationCap, UserX, ArrowRightLeft } from 'lucide-react';
import api from '@/api/client';
import { useUIStore } from '@/store';

interface AdmissionCountRow {
  program: {
    name: string;
    shortName?: string;
  };
  total: number;
  active: number;
  quit: number;
  transferOut: number;
  graduated: number;
}

const MONTHS = [
  'All Months',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdmissionCountReportPage() {
  const { academicYearId } = useUIStore();
  const [data, setData] = useState<AdmissionCountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('All Months');

  const fetchAdmissionCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (academicYearId) params.academicYearId = academicYearId;
      if (selectedMonth && selectedMonth !== 'All Months') params.month = selectedMonth;

      const res = await api.get('/reports/admission-count', { params });
      if (res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admission count report', err);
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, selectedMonth]);

  useEffect(() => {
    fetchAdmissionCount();
  }, [fetchAdmissionCount]);

  const handleSearch = () => {
    fetchAdmissionCount();
  };

  const handleClearSearch = () => {
    setSelectedMonth('All Months');
    fetchAdmissionCount();
  };

  const totalAll = data.reduce((sum, r) => sum + r.total, 0);
  const totalActive = data.reduce((sum, r) => sum + r.active, 0);
  const totalQuit = data.reduce((sum, r) => sum + r.quit, 0);
  const totalTransfers = data.reduce((sum, r) => sum + r.transferOut, 0);

  const columns: ColumnDef<AdmissionCountRow>[] = [
    {
      accessorFn: (row) => row.program?.name,
      id: 'program',
      header: 'Program Name',
      cell: ({ getValue }) => (
        <span className="font-bold text-slate-900">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-center">Total Enrolled</div>,
      cell: ({ getValue }) => (
        <div className="text-center font-mono font-bold text-base text-blue-700">
          {getValue() as number}
        </div>
      ),
    },
    {
      accessorKey: 'active',
      header: () => <div className="text-center">Currently Active</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold font-mono">
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'quit',
      header: () => <div className="text-center">Quit Admission</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge className="bg-red-100 text-red-700 border-none font-medium font-mono">
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'transferOut',
      header: () => <div className="text-center">Transfer Out</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge className="bg-purple-100 text-purple-700 border-none font-medium font-mono">
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'graduated',
      header: () => <div className="text-center">Graduated</div>,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge className="bg-blue-100 text-blue-700 border-none font-medium font-mono">
            {getValue() as number}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Count Report"
        description="Aggregate enrollment counts, retention, and student lifecycle statistics by program"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Admissions</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalAll}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Active Students</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalActive}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Quit Students</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">{totalQuit}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <UserX className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Transfers Out</p>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{totalTransfers}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base font-bold">Program-wise Admission Breakdown</CardTitle>

            {/* Month: Select Month & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border rounded px-3 py-1.5 text-xs bg-background h-8 font-medium min-w-[130px]"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                onClick={handleSearch}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={handleClearSearch}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Search
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            searchPlaceholder="Search program name..."
            showExportBox={true}
            exportTitle="admission_count_report"
          />
        </CardContent>
      </Card>

      {/* Disclaimer Notice */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
        <p><strong>Note:</strong> Counts are calculated based on official student admissions recorded in the database. If there is any discrepancy between local branch records and this count report, please ensure all pending admissions have been marked as confirmed.</p>
      </div>
    </div>
  );
}
