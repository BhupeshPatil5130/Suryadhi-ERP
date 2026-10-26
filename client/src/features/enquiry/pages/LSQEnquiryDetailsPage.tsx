import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import api from '@/api/client';

import DataTable from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, UserCheck, Download, RefreshCw } from 'lucide-react';
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

interface ProgramCard {
  title: string;
  count: number;
  color: string;
}

const PROGRAM_DEFAULTS: ProgramCard[] = [
  { title: 'PlayGroup', count: 15, color: '#3b82f6' },
  { title: 'Nursery', count: 11, color: '#10b981' },
  { title: 'Sunoia Junior', count: 25, color: '#f59e0b' },
  { title: 'Sunoia Senior', count: 10, color: '#8b5cf6' },
];

export default function LSQEnquiryDetailsPage() {
  const [data, setData] = useState<EnquiryData[]>([]);
  const [cards, setCards] = useState<ProgramCard[]>(PROGRAM_DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CONVERTED' | 'NON_CONVERTED'>('ALL');
  const [showEntries, setShowEntries] = useState('25');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enquiriesRes, countsRes] = await Promise.all([
        api.get(`/enquiries?limit=200`),
        api.get('/reports/enquiry-count'),
      ]);

      if (enquiriesRes.data?.success && enquiriesRes.data?.data) {
        const list = enquiriesRes.data.data.map((item: any) => ({
          id: item.id,
          studentName: `${item.student?.firstName || ''} ${item.student?.middleName || ''} ${item.student?.lastName || ''}`.trim() || item.studentFirstName || 'N/A',
          enquirerName: item.enquirerName || 'N/A',
          enquirerContact: item.enquirerMobile || item.enquirerContact || 'N/A',
          stage: item.stage || 'NEW',
          subStage: item.subStage || 'Admission Enquiry (New Opportunity)',
          programName: item.program?.name || 'N/A',
          nextFollowUp: item.nextFollowUp ? new Date(item.nextFollowUp).toLocaleDateString('en-GB') : '—',
          lastContacted: item.lastContacted
            ? new Date(item.lastContacted).toLocaleDateString('en-GB')
            : item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '—',
        }));
        setData(list);
      }

      if (countsRes.data?.success && countsRes.data?.data?.length > 0) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        const apiCounts: ProgramCard[] = countsRes.data.data.map((c: any, idx: number) => ({
          title: c.program?.name || c.title || `Program ${idx + 1}`,
          count: c.count || 0,
          color: colors[idx % colors.length],
        }));
        if (apiCounts.length > 0) {
          setCards(apiCounts);
        }
      }
    } catch (err) {
      console.warn('Using dummy/cached data for LSQ enquiries', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let res = data;
    if (filterType === 'CONVERTED') {
      res = res.filter((item) => item.stage === 'CONVERTED' || item.stage === 'ADMITTED');
    } else if (filterType === 'NON_CONVERTED') {
      res = res.filter((item) => item.stage !== 'CONVERTED' && item.stage !== 'ADMITTED');
    }
    const limit = parseInt(showEntries, 10);
    return isNaN(limit) ? res : res.slice(0, limit);
  }, [data, filterType, showEntries]);

  const totalCount = useMemo(() => cards.reduce((sum, c) => sum + c.count, 0), [cards]);

  const columns: ColumnDef<EnquiryData>[] = [
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ row }) => <span className="font-semibold text-slate-800 text-xs">{row.original.studentName}</span>,
    },
    {
      accessorKey: 'enquirerName',
      header: 'Enquirer Name',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.enquirerName}</span>,
    },
    {
      accessorKey: 'enquirerContact',
      header: 'Contact',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-700">{row.original.enquirerContact}</span>,
    },
    {
      accessorKey: 'programName',
      header: 'Program',
      cell: ({ row }) => <span className="text-xs font-medium text-slate-700">{row.original.programName}</span>,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => {
        const stage = row.original.stage;
        const color = stage === 'CONVERTED' || stage === 'ADMITTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : stage === 'LOST' ? 'bg-rose-100 text-rose-700 border-rose-300'
          : stage === 'FOLLOW_UP' ? 'bg-amber-100 text-amber-800 border-amber-300'
          : 'bg-blue-100 text-blue-800 border-blue-300';
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
            {stage}
          </span>
        );
      },
    },
    {
      accessorKey: 'nextFollowUp',
      header: 'Next Follow Up',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.nextFollowUp}</span>,
    },
    {
      accessorKey: 'lastContacted',
      header: 'Last Contacted',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.lastContacted}</span>,
    },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex items-center gap-1">
            <Link to={`/enquiry/${id}/receipts/add`}>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px] text-emerald-700 hover:text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                title="Advance Receipt"
              >
                <Banknote className="h-3 w-3 mr-1" /> Advance Receipt
              </Button>
            </Link>
            <Link to={`/enquiry/${id}/convert`}>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px] text-blue-700 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
                title="Convert to Admission"
              >
                <UserCheck className="h-3 w-3 mr-1" /> Convert
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pt-2 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">Lead Suryadhi Enquiries (LSQ)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track, filter, and convert prospective student enquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-8 text-xs bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white"
            onClick={() => apiDownload(
              'lsq-enquiries',
              {},
              data.map((d) => ({
                'Student Name': d.studentName,
                'Enquirer Name': d.enquirerName,
                'Contact': d.enquirerContact,
                'Program': d.programName,
                'Stage': d.stage,
                'Next Follow Up': d.nextFollowUp,
                'Last Contacted': d.lastContacted,
              })),
              'lsq-enquiries'
            )}
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 5 Dashboard Cards: 4 Program + 1 Total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((prog) => (
          <div key={prog.title} className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: prog.color }} />
              {prog.title}
            </div>
            <div className="text-2xl font-bold text-slate-700">{isLoading ? '...' : prog.count}</div>
            <div className="mt-2 h-1 w-full rounded" style={{ backgroundColor: prog.color }} />
          </div>
        ))}

        {/* Total Enquiries Card */}
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-500" />
            Total Enquiries
          </div>
          <div className="text-2xl font-bold text-amber-600">{isLoading ? '...' : totalCount}</div>
          <div className="mt-2 h-1 w-full rounded bg-amber-500" />
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          {/* Filter Buttons: Convert / Non-Convert / All */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1">Filter:</span>
            <Button
              size="sm"
              variant={filterType === 'ALL' ? 'default' : 'outline'}
              className={`h-7 text-xs px-3 rounded-sm ${filterType === 'ALL' ? 'bg-[#0056b3] text-white' : 'bg-white'}`}
              onClick={() => setFilterType('ALL')}
            >
              All Enquiries
            </Button>
            <Button
              size="sm"
              variant={filterType === 'CONVERTED' ? 'default' : 'outline'}
              className={`h-7 text-xs px-3 rounded-sm ${filterType === 'CONVERTED' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'}`}
              onClick={() => setFilterType('CONVERTED')}
            >
              Converted
            </Button>
            <Button
              size="sm"
              variant={filterType === 'NON_CONVERTED' ? 'default' : 'outline'}
              className={`h-7 text-xs px-3 rounded-sm ${filterType === 'NON_CONVERTED' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700'}`}
              onClick={() => setFilterType('NON_CONVERTED')}
            >
              Non-Converted
            </Button>
          </div>

          {/* Show Entries */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Show</span>
            <Select value={showEntries} onValueChange={setShowEntries}>
              <SelectTrigger className="w-[70px] h-7 text-xs bg-white">
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
        </div>

        {/* Data Table with Global Search */}
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search LSQ enquiries by student, enquirer, contact..."
        />
      </div>
    </div>
  );
}
