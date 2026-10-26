import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  RotateCcw,
  Eye,
  Copy,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GraduationCap,
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import { downloadAsCSV } from '@/lib/export';

interface ProgramConfirmation {
  name: string;
  confirmed: boolean;
  studentCount: number;
}

interface StudentNameCorrection {
  id: string;
  admissionDate: string;
  program: string;
  uin: string;
  originalName: string;
  correctedName: string;
  originalDob: string;
  correctedDob: string;
  confirmed: boolean;
  avatarBg?: string;
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

const INITIAL_PROGRAMS: ProgramConfirmation[] = [
  { name: 'Play Group', confirmed: false, studentCount: 14 },
  { name: 'Nursery', confirmed: false, studentCount: 22 },
  { name: 'SUNOIA Junior', confirmed: false, studentCount: 31 },
  { name: 'SUNOIA Senior', confirmed: false, studentCount: 19 },
  { name: 'DayCare', confirmed: false, studentCount: 6 },
  { name: 'Bridge SUNOIAJunior', confirmed: false, studentCount: 8 },
  { name: 'Bridge SUNOIASenior', confirmed: false, studentCount: 5 },
  { name: 'Teacher Training Program', confirmed: false, studentCount: 12 },
  { name: 'SUNOIATots', confirmed: false, studentCount: 9 },
];

const INITIAL_CORRECTIONS: StudentNameCorrection[] = [
  {
    id: 'nc-1',
    admissionDate: '2026-04-01',
    program: 'Play Group',
    uin: 'SNK/SEMS-DEMO-001/0001/2627',
    originalName: 'Shaurya Bachhav',
    correctedName: 'Shaurya Sachin Bachhav',
    originalDob: '15/08/2022',
    correctedDob: '15/08/2022',
    confirmed: false,
    avatarBg: AVATAR_GRADIENTS[0],
  },
  {
    id: 'nc-2',
    admissionDate: '2026-04-01',
    program: 'SUNOIA Junior',
    uin: 'SEMS/3201/0070/2526',
    originalName: 'Aditi Ade',
    correctedName: 'Aditi Nikesh Ade',
    originalDob: '10/02/2021',
    correctedDob: '12/02/2021',
    confirmed: true,
    avatarBg: AVATAR_GRADIENTS[1],
  },
  {
    id: 'nc-3',
    admissionDate: '2026-04-02',
    program: 'Nursery',
    uin: 'SNK/3201/0059/2526',
    originalName: 'Ayansh Dawale',
    correctedName: 'Ayansh Nandkishor Dawale',
    originalDob: '05/11/2021',
    correctedDob: '05/11/2021',
    confirmed: false,
    avatarBg: AVATAR_GRADIENTS[2],
  },
];

export default function NameChangeConfirmationPage() {
  const [programsList, setProgramsList] = useState<ProgramConfirmation[]>(INITIAL_PROGRAMS);
  const [isGlobalConfirmed, setIsGlobalConfirmed] = useState(false);
  const [corrections, setCorrections] = useState<StudentNameCorrection[]>(INITIAL_CORRECTIONS);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedUin, setCopiedUin] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'admissionDate' | 'originalName' | 'uin'>('admissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [selectedCorrection, setSelectedCorrection] = useState<StudentNameCorrection | null>(null);

  const handleCopyUin = (uin: string) => {
    navigator.clipboard.writeText(uin);
    setCopiedUin(uin);
    showToast(`UIN ${uin} copied`, 'info');
    setTimeout(() => setCopiedUin(null), 2000);
  };

  const toggleGlobalConfirmation = (checked: boolean) => {
    setIsGlobalConfirmed(checked);
    setProgramsList((prev) => prev.map((p) => ({ ...p, confirmed: checked })));
    setCorrections((prev) => prev.map((c) => ({ ...c, confirmed: checked })));
    showToast(
      checked
        ? 'All graduation name & DOB change records verified & confirmed'
        : 'All confirmations cleared',
      checked ? 'success' : 'info'
    );
  };

  const toggleProgramConfirmation = (programName: string) => {
    setProgramsList((prev) =>
      prev.map((p) => (p.name === programName ? { ...p, confirmed: !p.confirmed } : p))
    );
    showToast(`Updated confirmation status for ${programName}`, 'info');
  };

  const toggleStudentConfirmation = (id: string) => {
    setCorrections((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.confirmed;
          showToast(
            nextState
              ? `Confirmed name/DOB change for ${item.correctedName}`
              : `Confirmation revoked for ${item.originalName}`,
            nextState ? 'success' : 'info'
          );
          return { ...item, confirmed: nextState };
        }
        return item;
      })
    );
  };

  const handleSort = (field: 'admissionDate' | 'originalName' | 'uin') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredCorrections = useMemo(() => {
    return corrections
      .filter((d) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          d.originalName.toLowerCase().includes(query) ||
          d.correctedName.toLowerCase().includes(query) ||
          d.uin.toLowerCase().includes(query) ||
          d.program.toLowerCase().includes(query);

        const matchesProgram = programFilter === 'ALL' || d.program === programFilter;
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'CONFIRMED' && d.confirmed) ||
          (statusFilter === 'PENDING' && !d.confirmed);

        return matchesSearch && matchesProgram && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [corrections, search, programFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCorrections.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCorrections.slice(start, start + pageSize);
  }, [filteredCorrections, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredCorrections.map((d, i) => ({
      'Sr No.': i + 1,
      'Admission Date': d.admissionDate,
      'Program': d.program,
      'UIN': d.uin,
      'Original Name': d.originalName,
      'Corrected Name': d.correctedName,
      'Original DOB': d.originalDob,
      'Corrected DOB': d.correctedDob,
      'Confirmation Status': d.confirmed ? 'Confirmed' : 'Pending Verification',
    }));
    downloadAsCSV(rows, 'Graduation_Name_DOB_Corrections_Report');
    showToast('Name change verification report downloaded', 'success');
  };

  const totalCorrections = corrections.length;
  const confirmedCorrections = corrections.filter((c) => c.confirmed).length;
  const pendingCorrections = corrections.filter((c) => !c.confirmed).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Name & DOB Change Confirmation"
        description="Verify and approve student name and date of birth adjustments for official graduation certificates."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report CSV
          </Button>

          <Button
            size="sm"
            onClick={() => toggleGlobalConfirmation(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 font-semibold shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirm All Records
          </Button>
        </div>
      </PageHeader>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Change Requests</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCorrections}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Under certificate audit</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmed & Verified</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{confirmedCorrections}</h3>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Ready for certificate print</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Review</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCorrections}</h3>
              <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Awaiting coordinator confirmation</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program-wise Batch Verification Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="global-confirm"
              checked={isGlobalConfirmed}
              onCheckedChange={(c) => toggleGlobalConfirmation(!!c)}
              className="h-4 w-4"
            />
            <label htmlFor="global-confirm" className="text-xs font-bold text-slate-800 cursor-pointer">
              Graduation Day Name & DOB Change Confirmation (Program Batch)
            </label>
          </div>
          <Badge variant="outline" className="text-[11px] bg-blue-50 text-blue-700 border-blue-200">
            {programsList.filter((p) => p.confirmed).length} / {programsList.length} Programs Verified
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                  <th className="py-2.5 px-4 w-16 text-center">Confirm</th>
                  <th className="py-2.5 px-4">Program Name</th>
                  <th className="py-2.5 px-4 text-center">Verification Status</th>
                  <th className="py-2.5 px-4 text-center">Enrolled Students</th>
                  <th className="py-2.5 px-4 text-center w-28">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programsList.map((prog) => (
                  <tr key={prog.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-center">
                      <Checkbox
                        checked={prog.confirmed}
                        onCheckedChange={() => toggleProgramConfirmation(prog.name)}
                        aria-label={`Confirm ${prog.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{prog.name}</td>
                    <td className="py-2.5 px-4 text-center">
                      {prog.confirmed ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Confirmed</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Not Confirmed</span>
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">{prog.studentCount} Students</td>
                    <td className="py-2.5 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                        onClick={() => {
                          setProgramFilter(prog.name);
                          showToast(`Filtered to ${prog.name} records`, 'info');
                        }}
                      >
                        Show Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Main Student Records Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by student name, corrected name, UIN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs bg-white border-slate-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-40">
              <Select
                value={programFilter}
                onValueChange={(val) => {
                  setProgramFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Programs</SelectItem>
                  {programsList.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(search || programFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setProgramFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="h-9 text-xs px-2.5 text-slate-500 hover:text-slate-800 gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('admissionDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Admission Date</span>
                    {sortField === 'admissionDate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Program</th>

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('uin')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student UIN</span>
                  </div>
                </th>

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('originalName')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name Correction (Original ➔ Corrected)</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center">DOB Correction (Original ➔ Corrected)</th>

                <th className="py-3 px-4 text-center">Status</th>

                <th className="py-3 px-4 text-center w-32">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No name correction records found</p>
                      <p className="text-xs text-slate-400">All student name & DOB records are aligned</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Admission Date */}
                    <td className="py-3 px-4 text-slate-700 font-medium">{row.admissionDate}</td>

                    {/* Program */}
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700">
                        {row.program}
                      </Badge>
                    </td>

                    {/* UIN */}
                    <td className="py-3 px-4 font-mono">
                      <div className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 transition-colors px-2 py-1 rounded text-[11px] text-slate-700">
                        <span>{row.uin}</span>
                        <button
                          type="button"
                          title="Copy UIN"
                          onClick={() => handleCopyUin(row.uin)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                        >
                          {copiedUin === row.uin ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name Correction */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 line-through text-[11px]">{row.originalName}</span>
                        <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="font-bold text-slate-900 text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                          {row.correctedName}
                        </span>
                      </div>
                    </td>

                    {/* DOB Correction */}
                    <td className="py-3 px-4 text-center">
                      {row.originalDob === row.correctedDob ? (
                        <span className="text-slate-600 font-mono text-xs">{row.originalDob}</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-slate-400 line-through">{row.originalDob}</span>
                          <ArrowRight className="h-3 w-3 text-emerald-500" />
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {row.correctedDob}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {row.confirmed ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Confirmed</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </Badge>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1 text-slate-600 hover:bg-slate-100"
                          onClick={() => setSelectedCorrection(row)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant={row.confirmed ? 'outline' : 'default'}
                          onClick={() => toggleStudentConfirmation(row.id)}
                          className={`h-7 text-xs px-2.5 rounded font-semibold ${
                            row.confirmed
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {row.confirmed ? 'Revoke' : 'Confirm'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{filteredCorrections.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-700">{Math.min(currentPage * pageSize, filteredCorrections.length)}</strong> of{' '}
            <strong className="text-slate-700">{filteredCorrections.length}</strong> records
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 bg-white gap-1"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </Button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 bg-white gap-1"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Dialog */}
      {selectedCorrection && (
        <Dialog open={!!selectedCorrection} onOpenChange={() => setSelectedCorrection(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <FileCheck className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Name & DOB Correction Audit</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed comparison between admission record and requested graduation certificate details.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student UIN:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedCorrection.uin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Program:</span>
                  <span className="font-semibold text-slate-700">{selectedCorrection.program}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Admission Date:</span>
                  <span className="text-slate-700">{selectedCorrection.admissionDate}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2.5">
                <div className="space-y-1 bg-blue-50/50 p-2.5 rounded border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-900 block">Name Update:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 line-through">{selectedCorrection.originalName}</span>
                    <ArrowRight className="h-3 w-3 text-blue-500" />
                    <span className="font-bold text-blue-800">{selectedCorrection.correctedName}</span>
                  </div>
                </div>

                <div className="space-y-1 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-900 block">Date of Birth Update:</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500">{selectedCorrection.originalDob}</span>
                    {selectedCorrection.originalDob !== selectedCorrection.correctedDob && (
                      <>
                        <ArrowRight className="h-3 w-3 text-emerald-500" />
                        <span className="font-bold text-emerald-800">{selectedCorrection.correctedDob}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedCorrection(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toggleStudentConfirmation(selectedCorrection.id);
                  setSelectedCorrection(null);
                }}
                className={`text-xs ${
                  selectedCorrection.confirmed
                    ? 'bg-slate-800 hover:bg-slate-900 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedCorrection.confirmed ? 'Revoke Confirmation' : 'Confirm & Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
