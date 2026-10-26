import { useState } from 'react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadAsPDF } from '@/lib/downloadUtils';

const tableData = [
  { program: 'Play Group to Nursery', base: 2, retained: 1, drop: 1, retPercent: '50%', dropPercent: '50%' },
  { program: 'Nursery to SUNOIA Junior', base: 41, retained: 25, drop: 16, retPercent: '61%', dropPercent: '39%' },
  { program: 'SUNOIA Junior to SUNOIA Senior', base: 27, retained: 13, drop: 14, retPercent: '48%', dropPercent: '52%' },
  { program: 'Total', isTotal: true, base: 70, retained: 39, drop: 31, retPercent: '56%', dropPercent: '44%' },
];

export default function RetentionBasePage() {
  const [academicYear, setAcademicYear] = useState('ay1');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retention Base"
        description="View retention metrics for current academic year"
      >
        <div className="flex items-center gap-3">
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ay1">Apr 26 - Mar 27</SelectItem>
              <SelectItem value="ay0">Apr 25 - Mar 26</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => downloadAsPDF({
            title: 'Retention Base Report',
            subtitle: `Academic Year: ${academicYear === 'ay1' ? 'Apr 26 - Mar 27' : 'Apr 25 - Mar 26'}`,
            columns: ['Program', 'Base', 'Retained', 'Drop', 'Retention %', 'Drop %'],
            rows: tableData.map((r) => [r.program, r.base, r.retained, r.drop, r.retPercent, r.dropPercent]),
            filename: 'retention-base-report',
          })}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </PageHeader>

      <Card className="overflow-hidden border-0 shadow-sm max-w-5xl mx-auto">
        <div className="bg-[#243c84] text-white text-center py-4 font-semibold text-lg rounded-t-xl">
          Retention Base vs Conversion
        </div>
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 px-6 text-left font-bold text-slate-700">Program</th>
                <th className="py-4 px-6 font-bold text-slate-700">Base</th>
                <th className="py-4 px-6 font-bold text-slate-700">Retained</th>
                <th className="py-4 px-6 font-bold text-slate-700">Drop</th>
                <th className="py-4 px-6 font-bold text-slate-700">Ret %</th>
                <th className="py-4 px-6 font-bold text-slate-700">Drop %</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr 
                  key={row.program} 
                  className={cn(
                    "border-b border-slate-100 last:border-0",
                    row.isTotal && "bg-[#f0f4ff] font-bold border-t border-slate-200"
                  )}
                >
                  <td className="py-4 px-6 text-left font-semibold text-[#243c84]">
                    {row.program}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.base}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.retained}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.drop}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.retPercent}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.dropPercent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
