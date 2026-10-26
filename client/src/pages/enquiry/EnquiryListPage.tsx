import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import api from '@/api/client';

import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Share, Banknote, Edit3, Download, Plus } from 'lucide-react';
import { EnquiryActionButtons } from '@/features/enquiry';

interface EnquiryData {
  id: string;
  studentName: string;
  enquirerName: string;
  enquirerContact: string;
  stage: string;
  subStage: string;
  nextFollowUp: string;
  lastContacted: string;
}

interface ProgramCount {
  title: string;
  count: number;
}

const dummyEnquiries: EnquiryData[] = [
  {
    id: '1', studentName: '', enquirerName: 'Sarth', enquirerContact: '9096460403',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '12-06-2026'
  },
  {
    id: '2', studentName: 'Nayan Pratish Kajale', enquirerName: 'Pratish Kajale', enquirerContact: '9637010300',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '23-05-2026'
  },
  {
    id: '3', studentName: 'Mohini Akash Sontakke', enquirerName: 'Akash Sontakke', enquirerContact: '9021062371',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '16-05-2026'
  },
  {
    id: '4', studentName: 'Swaransh Vaibhav Jagtap', enquirerName: 'Vaibhav Jagtap', enquirerContact: '7057671333',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '16-05-2026'
  },
  {
    id: '5', studentName: 'Ram Sumit Wankhade', enquirerName: 'Sumit Wankhade', enquirerContact: '7218242145',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '16-05-2026'
  },
  {
    id: '6', studentName: 'Pranay Gautam', enquirerName: 'Gautam Doytale', enquirerContact: '7448036364',
    stage: 'Interested', subStage: 'Admission Enquiry (New Opportunity)', nextFollowUp: '', lastContacted: '15-05-2026'
  },
];

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
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.stage}</span>,
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
  { title: 'Play Group', count: 14 },
  { title: 'Nursery', count: 46 },
  { title: 'SUNOIA Junior', count: 14 },
  { title: 'SUNOIA Senior', count: 4 },
];

export default function EnquiryListPage() {
  const [data, setData] = useState(dummyEnquiries);
  const [summaryCards, setSummaryCards] = useState<ProgramCount[]>(dummySummaryCards);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [enquiriesRes, countsRes] = await Promise.all([
          api.get('/enquiries'),
          api.get('/reports/enquiry-count'),
        ]);

        if (enquiriesRes.data.success && enquiriesRes.data.data && enquiriesRes.data.data.length > 0) {
          const apiData = enquiriesRes.data.data.map((item: any) => ({
            id: item.id,
            studentName: `${item.studentFirstName || ''} ${item.studentLastName || ''}`.trim(),
            enquirerName: item.enquirerName || 'N/A',
            enquirerContact: item.enquirerMobile || 'N/A',
            stage: item.stage || 'NEW',
            subStage: 'Admission Enquiry (New Opportunity)',
            nextFollowUp: '',
            lastContacted: new Date(item.createdAt).toLocaleDateString()
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
        console.warn('Failed to fetch enquiries data, falling back to dummy data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalEnquiry = summaryCards.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pt-2 pb-12">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-normal text-slate-800">Manage Enquiry</h1>
      </div>

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
            Total Enquiry
          </div>
          <CardContent className="bg-white p-3 text-center border border-t-0 border-slate-200 rounded-b-md">
            <span className="text-xl font-normal text-slate-800">{isLoading ? '...' : totalEnquiry}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            {/* The DataTable component handles its own search bar, but the UI requests it here.
                We'll let the standard DataTable handle it, or we can just rely on the DataTable's global filter */}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/enquiry/create">
              <Button className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white h-9 shadow-none">
                Create Enquiry
              </Button>
            </Link>
            <Button className="bg-[#333] hover:bg-[#222] text-white h-9 shadow-none">
              Download Report
            </Button>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search..."
          />
        </div>
      </Card>
    </div>
  );
}
