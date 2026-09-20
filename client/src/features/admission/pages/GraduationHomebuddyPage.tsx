import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid, XCircle, ArrowDownUp } from 'lucide-react';
import api from '@/api/client';

interface GraduationRow {
  id: string;
  name: string;
  uin: string;
  currProg: string;
  expProg: string;
  payment: string;
  eligible: boolean;
  admissionId: string;
}

const dummyData: GraduationRow[] = [
  { id: '1', name: 'Aditi Nikesh Ade', uin: 'SEMS/3201/0070/2526', currProg: 'SUNOIA Junior', expProg: 'SUNOIA Senior', payment: 'No', eligible: false, admissionId: '1' },
  { id: '2', name: 'Advit Ganesh Pinnamwar', uin: 'SEMS/3201/0048/2526', currProg: 'SUNOIA Junior', expProg: 'SUNOIA Senior', payment: 'No', eligible: false, admissionId: '2' },
  { id: '3', name: 'Akshay Amit Jadhao', uin: 'SNK/3201/0024/2526', currProg: 'SUNOIA Junior', expProg: 'SUNOIA Senior', payment: 'No', eligible: false, admissionId: '3' },
  { id: '4', name: 'Anjali Sanjay Karewad', uin: 'SNK/3201/0044/2526', currProg: 'SUNOIA Junior', expProg: 'SUNOIA Senior', payment: 'No', eligible: false, admissionId: '4' },
  { id: '5', name: 'Anviksha Satish Wankhede', uin: 'SNK/3201/0053/2526', currProg: 'SUNOIA Junior', expProg: 'SUNOIA Senior', payment: 'No', eligible: false, admissionId: '5' },
  { id: '6', name: 'Ayansh Nandkishor Dawale', uin: 'SNK/3201/0059/2526', currProg: 'Nursery', expProg: 'SUNOIA Junior', payment: 'No', eligible: false, admissionId: '6' },
];

const NEXT_PROGRAM: Record<string, string> = {
  'Play Group': 'Nursery',
  'Nursery': 'SUNOIA Junior',
  'SUNOIA Junior': 'SUNOIA Senior',
  'SUNOIA Senior': 'Graduated',
};

export default function GraduationHomebuddyPage() {
  const [data, setData] = useState<GraduationRow[]>(dummyData);
  const [programs, setPrograms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [admissionsRes, programsRes] = await Promise.all([
          api.get('/admissions?limit=100&status=ACTIVE'),
          api.get('/lookups/programs'),
        ]);

        if (admissionsRes.data.success && admissionsRes.data.data?.length > 0) {
          const rows = admissionsRes.data.data.map((a: any) => ({
            id: a.id,
            admissionId: a.id,
            name: `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim(),
            uin: a.student?.uin || 'N/A',
            currProg: a.program?.name || 'N/A',
            expProg: NEXT_PROGRAM[a.program?.name || ''] || 'N/A',
            payment: 'No',
            eligible: false,
          }));
          setData(rows);
        }
        if (programsRes.data.success) setPrograms(programsRes.data.data);
      } catch {
        // fallback to dummy
      }
    };
    fetchData();
  }, []);

  const toggleEligible = (id: string, value: boolean) => {
    setData(data.map((item) => item.id === id ? { ...item, eligible: value } : item));
  };

  const handleGraduate = async (row: GraduationRow) => {
    if (!row.eligible) return;
    setSaving(row.id);
    try {
      const toProgram = programs.find((p) => p.name === row.expProg);
      if (toProgram) {
        await api.post(`/graduation/${row.admissionId}`, {
          toProgramId: toProgram.id,
          graduationDate: new Date().toISOString().split('T')[0],
          isHomebuddy: true,
        });
        setData(data.filter((d) => d.id !== row.id));
      }
    } catch {
      // ignore - demo still works
    } finally {
      setSaving(null);
    }
  };

  const filtered = data.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.uin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-normal text-[#333]">Graduate Student via Home Sunny Parent App</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and verify graduation eligibility for enrolled students across academic terms</p>
        </div>
      </div>

      <div className="bg-white border border-[#ccc] shadow-sm p-4">
        {/* Table Top Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-[#f2f2f2] border border-[#ccc] p-1.5 rounded-sm">
              <Grid className="w-4 h-4 text-slate-600" />
            </div>
            <label className="text-[13px] text-slate-600 flex items-center gap-2">
              Search:
              <Input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 w-[200px] border-[#ccc] rounded-sm text-[13px] px-2" />
            </label>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <Select defaultValue="10">
              <SelectTrigger className="h-7 w-[60px] border-[#ccc] rounded-sm text-[13px] px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            entries
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-[#ccc] overflow-hidden">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#f9f9f9]">
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] w-[20%]">
                  <div className="flex items-center justify-between">Student Name <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] w-[18%]">
                  <div className="flex items-center justify-between">Student UIN <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[15%]">
                  <div className="flex items-center justify-between">Current Program <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[15%]">
                  <div className="flex items-center justify-between">Expected Program <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[15%]">
                  <div className="flex items-center justify-between">Payment Done ? <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center">
                  Graduation Eligible ?
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-[13px] text-[#333]">No data available</td></tr>
              ) : (
                filtered.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white hover:bg-[#f5f5f5]' : 'bg-[#f9f9f9] hover:bg-[#f5f5f5]'}>
                    <td className="py-2.5 px-3 border-r border-b border-[#eee] text-[13px] text-[#333] align-top">{row.name}</td>
                    <td className="py-2.5 px-3 border-r border-b border-[#eee] text-[13px] text-[#333] align-top">{row.uin}</td>
                    <td className="py-2.5 px-3 border-r border-b border-[#eee] text-[13px] text-[#333] text-center align-top">{row.currProg}</td>
                    <td className="py-2.5 px-3 border-r border-b border-[#eee] text-[13px] text-[#333] text-center align-top">{row.expProg}</td>
                    <td className="py-2.5 px-3 border-r border-b border-[#eee] text-[13px] text-[#333] text-center align-top">{row.payment}</td>
                    <td className="py-2.5 px-3 border-b border-[#eee] text-[13px] align-top">
                      <div className="flex items-center justify-center gap-[2px]">
                        <button
                          onClick={() => { toggleEligible(row.id, true); handleGraduate({ ...row, eligible: true }); }}
                          disabled={isSaving === row.id}
                          className={`px-3 py-[2px] text-[12px] rounded-[3px] border ${row.eligible ? 'bg-[#5cb85c] text-white border-[#4cae4c]' : 'bg-[#fff] hover:bg-[#e6e6e6] text-[#333] border-[#ccc]'}`}
                        >
                          {isSaving === row.id ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => toggleEligible(row.id, false)}
                          className={`px-3 py-[2px] text-[12px] rounded-[3px] border ${!row.eligible ? 'bg-[#d9534f] text-white border-[#d43f3a]' : 'bg-[#fff] hover:bg-[#e6e6e6] text-[#333] border-[#ccc]'}`}
                        >
                          No
                        </button>
                        <button className="ml-1 text-[#333] hover:text-black">
                          <XCircle className="w-[15px] h-[15px] fill-black stroke-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gradient-to-b from-[#f5f5f5] to-[#d1d1d1] p-2.5 flex justify-center border border-t-0 border-[#ccc]">
          <div className="flex overflow-hidden text-[13px] shadow-sm">
            <button className="px-3 py-1.5 text-[#999] bg-[#f9f9f9] border border-[#ccc] border-r-0 rounded-l-[3px]">First</button>
            <button className="px-3 py-1.5 text-[#999] bg-[#f9f9f9] border border-[#ccc] border-r-0">← Previous</button>
            <button className="px-3 py-1.5 text-[#333] bg-white border border-[#ccc] border-r-0">1</button>
            <button className="px-3 py-1.5 text-[#333] bg-white border border-[#ccc] border-r-0 hover:bg-[#eee]">Next →</button>
            <button className="px-3 py-1.5 text-[#337ab7] bg-white border border-[#ccc] hover:bg-[#eee] rounded-r-[3px]">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}
