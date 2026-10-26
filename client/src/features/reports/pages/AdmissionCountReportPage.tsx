import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, RotateCcw, AlertCircle, Users, Download } from 'lucide-react';
import api from '@/api/client';
import { downloadAsCSV } from '@/lib/export';

interface ProgramAdmissionCount {
  programName: string;
  admissionCount: number;
}

const DEFAULT_PROGRAM_COUNTS: ProgramAdmissionCount[] = [
  { programName: 'Play Group', admissionCount: 0 },
  { programName: 'Nursery', admissionCount: 0 },
  { programName: 'Sunoia Junior', admissionCount: 0 },
  { programName: 'Sunoia Senior', admissionCount: 0 },
];

const MONTHS = [
  'April 2026', 'May 2026', 'June 2026', 'July 2026',
  'August 2026', 'September 2026', 'October 2026', 'November 2026',
  'December 2026', 'January 2027', 'February 2027', 'March 2027'
];

export default function AdmissionCountReportPage() {
  const [data, setData] = useState<ProgramAdmissionCount[]>(DEFAULT_PROGRAM_COUNTS);
  const [selectedMonth, setSelectedMonth] = useState<string>('April 2026');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdmissionCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/admission-count', {
        params: { month: selectedMonth }
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // Map data or fallback to defaults
        const mapped: ProgramAdmissionCount[] = DEFAULT_PROGRAM_COUNTS.map((dp) => {
          const found = res.data.data.find((item: any) =>
            (item.program?.name || '').toLowerCase().includes(dp.programName.toLowerCase())
          );
          return {
            programName: dp.programName,
            admissionCount: found ? (found.total || found.active || 0) : 0,
          };
        });
        setData(mapped);
      } else {
        setData(DEFAULT_PROGRAM_COUNTS);
      }
    } catch {
      setData(DEFAULT_PROGRAM_COUNTS);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAdmissionCount();
  }, [fetchAdmissionCount]);

  const totalAdmissions = data.reduce((sum, r) => sum + r.admissionCount, 0);

  const handleDownloadExcel = () => {
    const exportRows = data.map((r) => ({
      'Program Name': r.programName,
      'Admission Count': r.admissionCount,
      'Month': selectedMonth,
      'Center': 'SK-Dhule-Deopur'
    }));
    downloadAsCSV(exportRows, `Admission_Count_${selectedMonth.replace(' ', '_')}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Admission Count as per Sunoiakids"
        description="Official enrolled student counts verified against Sunoiakids Head Office portal"
      />

      {/* Main Container Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                1. Admission Count as per Sunoiakids
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Center: <span className="font-semibold text-blue-700">SK-Dhule-Deopur</span>
              </p>
            </div>

            {/* 2. Select Month */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Select Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white h-8 font-medium focus:border-blue-600 outline-none min-w-[130px]"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                onClick={fetchAdmissionCount}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadExcel}
                className="h-8 text-xs gap-1 border-slate-300"
              >
                <Download className="w-3.5 h-3.5" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f0f4f8] text-slate-700 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Program Name</th>
                  <th className="px-6 py-3.5 text-center w-48">Admission Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-800 text-sm">
                      {row.programName}
                    </td>
                    <td className="px-6 py-3 text-center font-mono font-bold text-base text-blue-700">
                      {row.admissionCount}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td className="px-6 py-3 uppercase tracking-wider text-slate-800">
                    Total Enrolled Count
                  </td>
                  <td className="px-6 py-3 text-center font-mono font-black text-lg text-blue-800">
                    {totalAdmissions}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Exact Disclaimer Box from Requirements */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">
            Disclaimer: Any mismatch in the counts should be reported to Sunoiakids before 20th of this month.
          </p>
          <p className="text-amber-800 mt-1">
            Official counts are reconciled on the 20th of each calendar month. For discrepancies, please submit an enquiry ticket or contact your regional business manager.
          </p>
        </div>
      </div>
    </div>
  );
}
