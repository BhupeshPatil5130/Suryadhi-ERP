import { useState } from 'react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadAsPDF } from '@/lib/downloadUtils';

const tableData = [
  { program: 'Play Group', currentYear: 6, lastYear: 2, growthPercent: '200%', isNegative: false },
  { program: 'Nursery', currentYear: 32, lastYear: 31, growthPercent: '3%', isNegative: false },
  { program: 'SUNOIA Junior', currentYear: 10, lastYear: 6, growthPercent: '67%', isNegative: false },
  { program: 'SUNOIA Senior', currentYear: 1, lastYear: 2, growthPercent: '-50%', isNegative: true },
  { program: 'Total', isTotal: true, currentYear: 49, lastYear: 41, growthPercent: '20%', isNegative: false },
];

export default function NewAdmissionsGrowthPage() {
  const [academicYear, setAcademicYear] = useState('ay1');

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Business Growth"
        description="Analyze new admissions growth trends"
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
            title: 'New Business Growth Report',
            subtitle: `Academic Year: ${academicYear === 'ay1' ? 'Apr 26 - Mar 27' : 'Apr 25 - Mar 26'}`,
            columns: ['Program', 'Current Year', 'Last Year', 'Growth %'],
            rows: tableData.map((r) => [r.program, r.currentYear, r.lastYear, r.growthPercent]),
            filename: 'new-admissions-growth',
          })}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </PageHeader>

      <Card className="overflow-hidden border-0 shadow-sm max-w-5xl mx-auto">
        <div className="bg-[#243c84] text-white text-center py-4 font-semibold text-lg rounded-t-xl">
          New Admissions Growth
        </div>
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 px-6 text-left font-bold text-slate-700 w-1/3">Program</th>
                <th className="py-4 px-6 font-bold text-slate-700 w-1/4">Current Year</th>
                <th className="py-4 px-6 font-bold text-slate-700 w-1/4">Last Year</th>
                <th className="py-4 px-6 font-bold text-slate-700 w-1/4">Growth %</th>
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
                    {row.currentYear}
                  </td>
                  <td className={cn("py-4 px-6", row.isTotal ? "font-bold text-[#243c84]" : "text-slate-700")}>
                    {row.lastYear}
                  </td>
                  <td className="py-4 px-6">
                    <span 
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-semibold",
                        row.isNegative 
                          ? "bg-red-100 text-red-600 border border-red-200" 
                          : "bg-green-100 text-green-700 border border-green-200"
                      )}
                    >
                      {row.growthPercent}
                    </span>
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
