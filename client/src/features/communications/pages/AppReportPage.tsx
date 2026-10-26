import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Calendar, Building2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

interface AOPVisitItem {
  id: string;
  customerId: string;
  franchiseeName: string;
  academicYear: string;
  aopDiscussedDate: string;
  status: string;
  keyHighlights: string;
  targetsAgreed: string;
}

const mockAOPVisits: AOPVisitItem[] = [
  {
    id: 'AOP-1',
    customerId: 'CUST-SK-DHULE-01',
    franchiseeName: 'SK-Dhule-Deopur',
    academicYear: 'Apr 26 - Mar 27',
    aopDiscussedDate: '2026-04-18',
    status: 'Finalized',
    keyHighlights: 'Enrolment target of 120 admissions reviewed. Marketing campaigns for Sunoia Junior and Welcome kit stock allocation approved.',
    targetsAgreed: 'Target: 120 Admissions, 95% Kit Delivery before Term 1 commencement.'
  },
  {
    id: 'AOP-2',
    customerId: 'CUST-SK-DHULE-01',
    franchiseeName: 'SK-Dhule-Deopur',
    academicYear: 'Apr 25 - Mar 26',
    aopDiscussedDate: '2025-04-20',
    status: 'Completed',
    keyHighlights: 'Annual Operating Plan compliance check, teacher-student ratio review and infrastructure assessment.',
    targetsAgreed: 'Achieved: 104 Admissions, Royalty realization rate of 98.4%.'
  },
  {
    id: 'AOP-3',
    customerId: 'CUST-SK-DHULE-01',
    franchiseeName: 'SK-Dhule-Deopur',
    academicYear: 'Apr 24 - Mar 25',
    aopDiscussedDate: '2024-04-25',
    status: 'Archived',
    keyHighlights: 'Initial center launch AOP plan, classroom layout guidelines and academic mentor scheduling.',
    targetsAgreed: 'Launch target achieved with 75 initial student enrollments.'
  }
];

export default function AppReportPage() {
  const [data] = useState<AOPVisitItem[]>(mockAOPVisits);
  const [selectedAOP, setSelectedAOP] = useState<AOPVisitItem | null>(null);

  const columns: ColumnDef<AOPVisitItem>[] = [
    {
      accessorKey: 'customerId',
      header: 'Customer ID',
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-blue-700">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'academicYear',
      header: 'Academic Year',
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-800">{getValue() as string}</span>
      ),
    },
    {
      id: 'viewAop',
      header: () => <div className="text-center">View AOP</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedAOP(row.original)}
            className="h-7 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Eye className="w-3.5 h-3.5" />
            View AOP Plan
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'aopDiscussedDate',
      header: 'AOP Discussed Date',
      cell: ({ getValue }) => (
        <span className="text-slate-700 font-medium">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold">
          {getValue() as string}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="APP Report (AOP Visits)"
        description="Annual Operating Plan (AOP) discussion history, visit summaries, and agreed center targets"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Franchisee Center</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">SK-Dhule-Deopur</h3>
              <p className="text-[11px] text-muted-foreground font-mono">CUST-SK-DHULE-01</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current AOP Plan</p>
              <h3 className="text-lg font-bold text-emerald-700 mt-1">Apr 26 - Mar 27</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3 inline" /> Discussed & Finalized
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total AOP Reviews</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">{data.length}</h3>
              <p className="text-[11px] text-muted-foreground">Historical records</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-bold text-slate-800">
            AOP Discussion Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search customer ID or year..."
            showExportBox={true}
            exportTitle="aop_visits_report"
          />
        </CardContent>
      </Card>

      {/* View AOP Dialog */}
      <Dialog open={!!selectedAOP} onOpenChange={() => setSelectedAOP(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Annual Operating Plan (AOP) — {selectedAOP?.academicYear}
            </DialogTitle>
            <DialogDescription>
              AOP review and agreed operational benchmarks for {selectedAOP?.franchiseeName} ({selectedAOP?.customerId})
            </DialogDescription>
          </DialogHeader>

          {selectedAOP && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Customer ID</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAOP.customerId}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Discussion Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(selectedAOP.aopDiscussedDate)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Academic Year</span>
                  <span className="font-semibold text-slate-800">{selectedAOP.academicYear}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Plan Status</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none">{selectedAOP.status}</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Key Discussion Highlights</h4>
                <p className="text-xs text-slate-600 bg-white p-3 border rounded leading-relaxed">
                  {selectedAOP.keyHighlights}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Agreed Benchmarks & Targets</h4>
                <p className="text-xs text-slate-600 bg-white p-3 border rounded leading-relaxed">
                  {selectedAOP.targetsAgreed}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAOP(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
