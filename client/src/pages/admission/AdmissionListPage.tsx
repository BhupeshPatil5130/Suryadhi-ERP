import { useState, useEffect } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import api from '@/api/client';
import DataTable from '@/components/shared/DataTable';
import { AdmissionActionButtons } from '@/features/admission';

interface AdmissionRecord {
  id: string;
  admissionDate: string;
  uin: string;
  name: string;
  fatherName: string;
  program: string;
  batchTime: string;
  mobile1: string;
  mobile2: string;
  type: string;
}

interface ProgramCount { name: string; shortName: string; count: number; color: string; }

const PROGRAM_COLORS: Record<string, string> = {
  PG: '#8bc34a', NR: '#ff9800', EJ: '#03a9f4', ES: '#f44336',
};

const dummyAdmissions: AdmissionRecord[] = [
  { id: '1', admissionDate: '01-04-2026', uin: 'EK3201/0071/2027', name: 'Shourya Sachin Bhoyar', fatherName: 'Sachin Bhoyar', program: 'SUNOIA Junior', batchTime: 'Early Morning Shift', mobile1: '8149811545', mobile2: '8999313214', type: 'ONLINE' },
  { id: '2', admissionDate: '01-04-2026', uin: 'EK3201/0002/2027', name: 'Aarohi Santosh Sonare', fatherName: 'Santosh Sonare', program: 'SUNOIA Junior', batchTime: 'Early Morning Shift', mobile1: '9370005720', mobile2: '9325944111', type: 'OFFLINE' },
  { id: '3', admissionDate: '01-04-2026', uin: 'EK3201/0014/2027', name: 'Dnyanda Nandkishor Bawane', fatherName: 'Nandkishor Bawane', program: 'SUNOIA Junior', batchTime: 'Early Morning Shift', mobile1: '9552407021', mobile2: '9145460195', type: 'OFFLINE' },
  { id: '4', admissionDate: '01-04-2026', uin: 'EK3201/0023/2027', name: 'Alfaz Baig Mirza', fatherName: 'Furhan Baig Mirza', program: 'SUNOIA Junior', batchTime: 'Early Morning Shift', mobile1: '7721024102', mobile2: '7400051112', type: 'OFFLINE' },
  { id: '5', admissionDate: '01-04-2026', uin: 'EK3201/0034/2027', name: 'Darsh Rakesh Dhole', fatherName: 'Rakesh Dhole', program: 'Nursery', batchTime: 'Early Morning Shift', mobile1: '8668903332', mobile2: '9922241511', type: 'ONLINE' },
  { id: '6', admissionDate: '01-04-2026', uin: 'EK3201/0068/2027', name: 'Rudransh Vaibhav Deshmukh', fatherName: 'Vaibhav Deshmukh', program: 'SUNOIA Senior', batchTime: 'Early Morning Shift', mobile1: '9673966580', mobile2: '8208466635', type: 'OFFLINE' },
];

const dummyProgramCounts: ProgramCount[] = [
  { name: 'Play group', shortName: 'PG', count: 6, color: '#8bc34a' },
  { name: 'Nursery', shortName: 'NR', count: 33, color: '#ff9800' },
  { name: 'SUNOIA Junior', shortName: 'EJ', count: 33, color: '#03a9f4' },
  { name: 'SUNOIA Senior', shortName: 'ES', count: 16, color: '#f44336' },
];

const columns: ColumnDef<AdmissionRecord, any>[] = [
  { accessorKey: 'admissionDate', header: 'Admission Date', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  { accessorKey: 'uin', header: 'Student UIN', cell: ({ getValue }) => <div className="text-xs font-medium text-slate-700">{getValue() as string}</div> },
  { accessorKey: 'name', header: 'Student Name', cell: ({ getValue }) => <div className="text-xs font-semibold">{getValue() as string}</div> },
  { accessorKey: 'fatherName', header: 'Father Name', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  { accessorKey: 'program', header: 'Program', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  { accessorKey: 'batchTime', header: 'Batch Time', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  { accessorKey: 'mobile1', header: 'Mobile No 1', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  { accessorKey: 'mobile2', header: 'Mobile No 2', cell: ({ getValue }) => <div className="text-xs">{getValue() as string}</div> },
  {
    accessorKey: 'type',
    header: 'Admission Type',
    cell: ({ getValue }) => (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getValue() === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
        {(getValue() as string).toLowerCase()}
      </span>
    ),
  },
  { id: 'actions', header: 'Action', cell: ({ row }) => <AdmissionActionButtons id={row.original.id} /> },
];

export default function AdmissionListPage() {
  const [data, setData] = useState<AdmissionRecord[]>(dummyAdmissions);
  const [programCounts, setProgramCounts] = useState<ProgramCount[]>(dummyProgramCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear] = useState('Apr 26 - Mar 27');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [admissionsRes, countsRes] = await Promise.all([
          api.get('/admissions?limit=100&status=ACTIVE'),
          api.get('/reports/admission-count'),
        ]);

        if (admissionsRes.data.success && admissionsRes.data.data?.length > 0) {
          setData(admissionsRes.data.data.map((item: any) => ({
            id: item.id,
            admissionDate: new Date(item.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            uin: item.student?.uin || 'N/A',
            name: `${item.student?.firstName || ''} ${item.student?.middleName || ''} ${item.student?.lastName || ''}`.trim(),
            fatherName: item.student?.parent?.fatherName || 'N/A',
            program: item.program?.name || 'N/A',
            batchTime: item.batch?.timeSlot || 'N/A',
            mobile1: item.student?.parent?.fatherMobile || 'N/A',
            mobile2: item.student?.parent?.motherMobile || 'N/A',
            type: item.admissionType || 'OFFLINE',
          })));
        }

        if (countsRes.data.success && countsRes.data.data?.length > 0) {
          setProgramCounts(countsRes.data.data.map((item: any) => ({
            name: item.program.name,
            shortName: item.program.shortName,
            count: item.active,
            color: PROGRAM_COLORS[item.program.shortName] || '#999',
          })));
        }
      } catch (error) {
        console.warn('Falling back to dummy data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalAdmissions = programCounts.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pt-2">
      <h1 className="text-2xl font-normal text-slate-800">Admission</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        {programCounts.map((prog) => (
          <div key={prog.shortName} className="bg-white border border-slate-200 p-3 pt-2 shadow-sm rounded-sm">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
              <span className="w-3 h-3 border border-slate-300 rounded-sm inline-block"></span> {prog.name}
            </div>
            <div className="text-2xl font-normal text-slate-700">{isLoading ? '...' : prog.count}</div>
            <div className="mt-2 h-1 w-full" style={{ backgroundColor: prog.color }}></div>
          </div>
        ))}
        <div className="bg-white border border-slate-200 p-3 pt-2 shadow-sm rounded-sm">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
            <span className="w-3 h-3 border border-slate-300 rounded-sm inline-block"></span> Total Admissions
          </div>
          <div className="text-2xl font-normal text-slate-700">{isLoading ? '...' : totalAdmissions}</div>
          <div className="mt-2 h-1 w-full bg-[#ff9800]"></div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-[#ffe8e8] text-[#d9534f] text-[12px] px-4 py-2.5 rounded-sm border border-[#f5c6c6] font-medium shadow-sm">
        Program change can be done once in academic year for the student | Academic year {currentYear}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-4 pt-2">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Search by name, UIN, mobile..."
        />
      </div>
    </div>
  );
}
