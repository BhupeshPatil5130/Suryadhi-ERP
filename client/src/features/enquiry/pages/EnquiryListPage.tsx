import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import api from '@/api/client';

import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Share, Banknote, Edit3, Download, Plus } from 'lucide-react';
import { EnquiryActionButtons } from '@/features/enquiry';
import { apiDownload } from '@/lib/downloadUtils';

interface EnquiryData {
  id: string;
  studentName: string;
  enquirerName: string;
  enquirerContact: string;
  stage: string;
  subStage: string;
  nextFollowUp: string;
  lastContacted: string;
  programName: string;
}

interface ProgramCount {
  title: string;
  count: number;
}

const columns: ColumnDef<EnquiryData>[] = [
  {
    accessorKey: 'studentName',
    header: 'Student Name',
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.studentName}</span>,
  },
  {
    accessorKey: 'enquirerName',
    header: 'Enquirer Name',
    cell: ({ row }) => <span className="text-sm">{row.original.enquirerName}</span>,
  },
  {
    accessorKey: 'enquirerContact',
    header: 'Enquirer Contact',
    cell: ({ row }) => <span className="text-sm font-mono">{row.original.enquirerContact}</span>,
  },
  {
    accessorKey: 'programName',
    header: 'Program',
    cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.programName}</span>,
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => {
      const stage = row.original.stage;
      const color = stage === 'CONVERTED' ? 'bg-green-100 text-green-800'
        : stage === 'LOST' ? 'bg-red-100 text-red-700'
        : stage === 'FOLLOW_UP' ? 'bg-yellow-100 text-yellow-800'
        : stage === 'TRIAL_CLASS' ? 'bg-purple-100 text-purple-800'
        : stage === 'CONTACTED' ? 'bg-blue-100 text-blue-800'
        : 'bg-slate-100 text-slate-700';
      return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${color}`}>{stage}</span>;
    },
  },
  {
    accessorKey: 'subStage',
    header: 'Sub Stage',
    cell: ({ row }) => (
      <div className="flex flex-col text-sm text-slate-600">
        <span>{row.original.subStage.split('(')[0]?.trim() || row.original.subStage}</span>
        {row.original.subStage.includes('(') && (
          <span className="text-xs text-muted-foreground">({row.original.subStage.split('(')[1]}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'nextFollowUp',
    header: 'Next Follow Up',
    cell: ({ row }) => <span className="text-sm">{row.original.nextFollowUp}</span>,
  },
  {
    accessorKey: 'lastContacted',
    header: 'Last Contacted',
    cell: ({ row }) => <span className="text-sm">{row.original.lastContacted}</span>,
  },
  {
    id: 'actions',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => <EnquiryActionButtons id={row.original.id} />,
  },
];

const dummySummaryCards: ProgramCount[] = [
  { title: 'Play Group', count: 15 },
  { title: 'Nursery', count: 11 },
  { title: 'Sunoia Junior', count: 25 },
  { title: 'Sunoia Senior', count: 10 },
];

export default function EnquiryListPage() {
  const [data, setData] = useState<EnquiryData[]>([]);
  const [summaryCards, setSummaryCards] = useState<ProgramCount[]>(dummySummaryCards);
  const [isLoading, setIsLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [showEntries, setShowEntries] = useState('25');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [enquiriesRes, countsRes] = await Promise.all([
          api.get(`/enquiries?limit=${showEntries}`),
          api.get('/reports/enquiry-count'),
        ]);

        if (enquiriesRes.data.success && enquiriesRes.data.data && enquiriesRes.data.data.length > 0) {
          const apiData = enquiriesRes.data.data.map((item: any) => ({
            id: item.id,
            studentName: `${item.student?.firstName || ''} ${item.student?.middleName || ''} ${item.student?.lastName || ''}`.trim(),
            enquirerName: item.enquirerName || 'N/A',
            enquirerContact: item.enquirerMobile || 'N/A',
            stage: item.stage || 'NEW',
            subStage: item.subStage || 'Admission Enquiry (New Opportunity)',
            programName: item.program?.name || 'N/A',
            nextFollowUp: item.nextFollowUp ? new Date(item.nextFollowUp).toLocaleDateString('en-GB') : '',
            lastContacted: item.lastContacted
              ? new Date(item.lastContacted).toLocaleDateString('en-GB')
              : new Date(item.createdAt).toLocaleDateString('en-GB'),
          }));
          setData(apiData);
        }

        if (countsRes.data.success && countsRes.data.data && countsRes.data.data.length > 0) {
          const countsData = countsRes.data.data.map((c: any) => ({
            title: c.program.name,
            count: c.count
          }));
          setSummaryCards(countsData);
        }
      } catch (error) {
        console.warn('Failed to fetch enquiries data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [showEntries]);

  const totalEnquiry = summaryCards.reduce((acc, curr) => acc + curr.count, 0);

  const displayData = stageFilter === 'ALL'
    ? data
    : stageFilter === 'CONVERTED'
    ? data.filter((d) => d.stage === 'CONVERTED')
    : stageFilter === 'NOT_CONVERTED'
    ? data.filter((d) => d.stage !== 'CONVERTED')
    : data.filter((d) => d.stage === stageFilter);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pt-2 pb-12">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-normal text-slate-800">Manage Enquiry</h1>
      </div>

      {/* Program Summary Cards — 4 Programs + 1 Total */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map((card, idx) => (
          <Card key={idx} className="border-0 shadow-sm overflow-hidden rounded-md">
            <div className="bg-[#f39c12] text-white text-center py-2 font-medium text-sm">
              {card.title}
            </div>
            <CardContent className="bg-white p-3 text-center border border-t-0 border-slate-200 rounded-b-md">
              <span className="text-xl font-normal text-slate-800">{isLoading ? '...' : card.count}</span>
            </CardContent>
          </Card>
        ))}
        <Card className="border-0 shadow-sm overflow-hidden rounded-md">
          <div className="bg-[#f39c12] text-white text-center py-2 font-medium text-sm">
            Total Enquiries
          </div>
          <CardContent className="bg-white p-3 text-center border border-t-0 border-slate-200 rounded-b-md">
            <span className="text-xl font-normal text-slate-800">{isLoading ? '...' : totalEnquiry}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Show Entries */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Show</span>
            <Select value={showEntries} onValueChange={setShowEntries}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500">entries</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stage Filter — Convert / Non-Convert / All */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="NOT_CONVERTED">Non-Converted</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="TRIAL_CLASS">Trial Class</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/enquiry/create">
              <Button className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white h-9 shadow-none">
                Create Enquiry
              </Button>
            </Link>
            <Button
              className="bg-[#333] hover:bg-[#222] text-white h-9 shadow-none"
              onClick={() => apiDownload(
                'enquiries',
                {},
                data.map((d) => ({
                  'Student Name': d.studentName,
                  'Enquirer Name': d.enquirerName,
                  'Contact': d.enquirerContact,
                  'Program': d.programName,
                  'Stage': d.stage,
                  'Sub Stage': d.subStage,
                  'Last Contacted': d.lastContacted,
                })),
                'enquiries-report'
              )}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Report
            </Button>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={columns}
            data={displayData}
            searchPlaceholder="Search..."
          />
        </div>
      </Card>
    </div>
  );
}
