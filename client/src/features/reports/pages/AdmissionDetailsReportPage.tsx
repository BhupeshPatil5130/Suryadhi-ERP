import { useState, useEffect, useCallback } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Users, CheckCircle2, GraduationCap, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';
import api from '@/api/client';
import { useUIStore } from '@/store';

interface AdmissionReportItem {
  id: string;
  admissionNumber: string;
  admissionDate: string;
  status: string;
  student: {
    firstName: string;
    lastName: string;
    uin: string;
    parent?: {
      fatherName?: string;
      motherName?: string;
      primaryMobile?: string;
    };
  };
  program: {
    id: string;
    name: string;
  };
  academicYear?: {
    label: string;
  };
}

export default function AdmissionDetailsReportPage() {
  const { academicYearId } = useUIStore();
  const [data, setData] = useState<AdmissionReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('All');

  const fetchAdmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (academicYearId) params.academicYearId = academicYearId;
      const res = await api.get('/reports/admissions', { params });
      if (res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admissions report', err);
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  // Program filter (matches names or partials like Play Group, Nursery, Sunoia Junior, Sunoia Senior)
  const filteredData = selectedProgram === 'All'
    ? data
    : data.filter((item) => {
        const progName = (item.program?.name || '').toLowerCase();
        return progName.includes(selectedProgram.toLowerCase());
      });

  const handleDownloadExcel = () => {
    const exportRows = filteredData.map((item) => ({
      'Admission Number': item.admissionNumber || '-',
      'Admission Date': item.admissionDate ? formatDate(item.admissionDate) : '-',
      'Student Name': `${item.student?.firstName || ''} ${item.student?.lastName || ''}`.trim(),
      'UIN': item.student?.uin || '-',
      'Program': item.program?.name || '-',
      'Parent Name': item.student?.parent?.fatherName || item.student?.parent?.motherName || '-',
      'Contact No': item.student?.parent?.primaryMobile || '-',
      'Status': item.status || '-',
    }));
    downloadAsCSV(exportRows, `admission_details_report_${selectedProgram.toLowerCase().replace(/\s+/g, '_')}.csv`);
  };

  const columns: ColumnDef<AdmissionReportItem>[] = [
    {
      accessorKey: 'admissionNumber',
      header: 'Admission No',
      cell: ({ getValue }) => (
        <span className="font-mono font-semibold text-slate-800">{getValue() as string || '-'}</span>
      ),
    },
    {
      id: 'student',
      header: 'Student Name / UIN',
      cell: ({ row }) => {
        const s = row.original.student;
        return (
          <div>
            <span className="font-medium text-slate-900 block">
              {s ? `${s.firstName} ${s.lastName}` : '-'}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono block">
              {s?.uin || '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'program',
      header: 'Program',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.program?.name || '-'}</span>
      ),
    },
    {
      id: 'parent',
      header: 'Parent / Mobile',
      cell: ({ row }) => {
        const p = row.original.student?.parent;
        return (
          <div className="text-xs">
            <span className="block text-slate-700 font-medium">
              {p?.fatherName || p?.motherName || '-'}
            </span>
            <span className="block text-muted-foreground font-mono">
              {p?.primaryMobile || '-'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'admissionDate',
      header: 'Admission Date',
      cell: ({ getValue }) => (
        <span className="text-xs">{getValue() ? formatDate(getValue() as string) : '-'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string;
        const color = s === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700';
        return <Badge className={`${color} border-none font-semibold text-xs`}>{s || 'ACTIVE'}</Badge>;
      },
    },
  ];

  const activeCount = filteredData.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Details Report"
        description="Comprehensive listing and export of admissions across programs"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Admissions</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{filteredData.length}</h3>
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
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Selected Program</p>
              <h3 className="text-lg font-bold text-purple-700 mt-1">{selectedProgram}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Data Table */}
      <Card className="shadow-lg">
        <CardHeader className="border-b border-border/50 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base font-bold">Admission Records</CardTitle>
            </div>

            {/* Program Drop Down & Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Program:
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="border rounded px-3 py-1.5 text-xs bg-background h-8 font-medium"
                >
                  <option value="All">All</option>
                  <option value="Play Group">Play Group</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Sunoia Junior">Sunoia Junior</option>
                  <option value="Sunoia Senior">Sunoia Senior KG</option>
                </select>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                onClick={handleDownloadExcel}
              >
                <Download className="w-3.5 h-3.5" /> Admission Report Download
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            searchPlaceholder="Search by student name, UIN, or admission no..."
            showExportBox={true}
            exportTitle="admission_details_report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
