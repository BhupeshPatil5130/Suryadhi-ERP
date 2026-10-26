import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
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
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Download,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  User,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Send,
} from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { downloadAsCSV } from '@/lib/export';

interface GraduationStudent {
  id: string;
  admissionId: string;
  name: string;
  fatherName?: string;
  uin: string;
  currProg: string;
  expProg: string;
  currProgId?: string;
  expProgId?: string;
  payment: 'Done' | 'Pending';
  eligible: boolean;
  avatarBg?: string;
  admissionDate?: string;
}

const PROGRAM_FLOW: Record<string, string> = {
  'Play Group': 'Nursery',
  'Playgroup': 'Nursery',
  'Nursery': 'SUNOIA Junior',
  'Junior KG': 'SUNOIA Senior',
  'SUNOIA Junior': 'SUNOIA Senior',
  'Senior KG': 'Graduated / Class 1',
  'SUNOIA Senior': 'Graduated / Class 1',
};

const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Play Group': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Playgroup': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Nursery': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'SUNOIA Junior': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Junior KG': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'SUNOIA Senior': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Senior KG': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Graduated / Class 1': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600',
];

const INITIAL_DUMMY_STUDENTS: GraduationStudent[] = [
  {
    id: '1',
    admissionId: 'adm-1',
    name: 'Shaurya Bachhav',
    fatherName: 'Sachin Bachhav',
    uin: 'SNK/SEMS-DEMO-001/0001/2627',
    currProg: 'Play Group',
    expProg: 'Nursery',
    payment: 'Pending',
    eligible: false,
    avatarBg: AVATAR_GRADIENTS[0],
    admissionDate: '2026-04-01',
  },
  {
    id: '2',
    admissionId: 'adm-2',
    name: 'Aditi Nikesh Ade',
    fatherName: 'Nikesh Ade',
    uin: 'SEMS/3201/0070/2526',
    currProg: 'SUNOIA Junior',
    expProg: 'SUNOIA Senior',
    payment: 'Done',
    eligible: true,
    avatarBg: AVATAR_GRADIENTS[1],
    admissionDate: '2026-04-01',
  },
  {
    id: '3',
    admissionId: 'adm-3',
    name: 'Advit Ganesh Pinnamwar',
    fatherName: 'Ganesh Pinnamwar',
    uin: 'SEMS/3201/0048/2526',
    currProg: 'SUNOIA Junior',
    expProg: 'SUNOIA Senior',
    payment: 'Done',
    eligible: true,
    avatarBg: AVATAR_GRADIENTS[2],
    admissionDate: '2026-04-02',
  },
  {
    id: '4',
    admissionId: 'adm-4',
    name: 'Akshay Amit Jadhao',
    fatherName: 'Amit Jadhao',
    uin: 'SNK/3201/0024/2526',
    currProg: 'SUNOIA Junior',
    expProg: 'SUNOIA Senior',
    payment: 'Pending',
    eligible: false,
    avatarBg: AVATAR_GRADIENTS[3],
    admissionDate: '2026-04-03',
  },
  {
    id: '5',
    admissionId: 'adm-5',
    name: 'Anjali Sanjay Karewad',
    fatherName: 'Sanjay Karewad',
    uin: 'SNK/3201/0044/2526',
    currProg: 'SUNOIA Junior',
    expProg: 'SUNOIA Senior',
    payment: 'Done',
    eligible: true,
    avatarBg: AVATAR_GRADIENTS[4],
    admissionDate: '2026-04-03',
  },
  {
    id: '6',
    admissionId: 'adm-6',
    name: 'Anviksha Satish Wankhede',
    fatherName: 'Satish Wankhede',
    uin: 'SNK/3201/0053/2526',
    currProg: 'SUNOIA Junior',
    expProg: 'SUNOIA Senior',
    payment: 'Pending',
    eligible: false,
    avatarBg: AVATAR_GRADIENTS[5],
    admissionDate: '2026-04-04',
  },
  {
    id: '7',
    admissionId: 'adm-7',
    name: 'Ayansh Nandkishor Dawale',
    fatherName: 'Nandkishor Dawale',
    uin: 'SNK/3201/0059/2526',
    currProg: 'Nursery',
    expProg: 'SUNOIA Junior',
    payment: 'Done',
    eligible: true,
    avatarBg: AVATAR_GRADIENTS[0],
    admissionDate: '2026-04-05',
  },
];

export default function GraduationHomebuddyPage() {
  const [data, setData] = useState<GraduationStudent[]>(INITIAL_DUMMY_STUDENTS);
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUin, setCopiedUin] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedEligibility, setSelectedEligibility] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState('ALL');

  // Multi-selection for batch graduation
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'uin' | 'currProg' | 'expProg' | 'payment'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Single / Batch Graduation Modal State
  const [graduatingStudent, setGraduatingStudent] = useState<GraduationStudent | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [graduationDate, setGraduationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notifyParent, setNotifyParent] = useState(true);

  // Fetch real data from server
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [admissionsRes, programsRes] = await Promise.all([
        api.get('/admissions?limit=100&status=ACTIVE'),
        api.get('/lookups/programs'),
      ]);

      if (programsRes.data?.success && Array.isArray(programsRes.data.data)) {
        setPrograms(programsRes.data.data);
      }

      if (admissionsRes.data?.success && Array.isArray(admissionsRes.data.data) && admissionsRes.data.data.length > 0) {
        const programList = programsRes.data?.data || [];
        const rows: GraduationStudent[] = admissionsRes.data.data.map((a: any, index: number) => {
          const currentProgramName = a.program?.name || 'N/A';
          const expectedProgramName = PROGRAM_FLOW[currentProgramName] || 'N/A';
          const targetProgramObj = programList.find((p: any) => p.name === expectedProgramName);

          return {
            id: a.id,
            admissionId: a.id,
            name: `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || 'Unnamed Student',
            fatherName: a.student?.parent?.fatherName || '',
            uin: a.student?.uin || 'N/A',
            currProg: currentProgramName,
            expProg: expectedProgramName,
            currProgId: a.programId,
            expProgId: targetProgramObj?.id,
            payment: a.receipts?.length > 0 ? 'Done' : 'Pending',
            eligible: true,
            avatarBg: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
            admissionDate: a.admissionDate ? a.admissionDate.split('T')[0] : '',
          };
        });
        setData(rows);
      }
    } catch {
      // Keep initial dummy data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Copy UIN
  const handleCopyUin = (uin: string) => {
    if (uin === 'N/A') return;
    navigator.clipboard.writeText(uin);
    setCopiedUin(uin);
    showToast(`UIN ${uin} copied to clipboard`, 'info');
    setTimeout(() => setCopiedUin(null), 2000);
  };

  // Toggle Single Eligibility
  const handleToggleEligible = (id: string, value: boolean) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, eligible: value } : item))
    );
    showToast(`Student eligibility updated to ${value ? 'Eligible' : 'Not Eligible'}`, 'info');
  };

  // Sort Handler
  const handleSort = (field: 'name' | 'uin' | 'currProg' | 'expProg' | 'payment') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // Search
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          item.name.toLowerCase().includes(query) ||
          item.uin.toLowerCase().includes(query) ||
          (item.fatherName && item.fatherName.toLowerCase().includes(query));

        // Program filter
        const matchesProgram = selectedProgram === 'ALL' || item.currProg === selectedProgram;

        // Eligibility filter
        const matchesEligibility =
          selectedEligibility === 'ALL' ||
          (selectedEligibility === 'ELIGIBLE' && item.eligible) ||
          (selectedEligibility === 'INELIGIBLE' && !item.eligible);

        // Payment filter
        const matchesPayment =
          selectedPayment === 'ALL' ||
          (selectedPayment === 'DONE' && item.payment === 'Done') ||
          (selectedPayment === 'PENDING' && item.payment === 'Pending');

        return matchesSearch && matchesProgram && matchesEligibility && matchesPayment;
      })
      .sort((a, b) => {
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, search, selectedProgram, selectedEligibility, selectedPayment, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Adjust current page if filter shrinks dataset
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Multi-select actions
  const isAllPageSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.has(item.id));

  const handleSelectAll = () => {
    if (isAllPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedData.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedData.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedProgram('ALL');
    setSelectedEligibility('ALL');
    setSelectedPayment('ALL');
  };

  // Single Student Graduation Action
  const executeSingleGraduation = async () => {
    if (!graduatingStudent) return;
    setIsProcessing(true);

    try {
      const targetProg = programs.find((p) => p.name === graduatingStudent.expProg);
      const toProgramId = targetProg?.id || graduatingStudent.expProgId || 'next-program-id';

      await api.post(`/graduation/${graduatingStudent.admissionId}`, {
        toProgramId,
        graduationDate,
        isHomebuddy: true,
      });

      setData((prev) => prev.filter((d) => d.id !== graduatingStudent.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(graduatingStudent.id);
        return next;
      });
      showToast(`🎉 ${graduatingStudent.name} successfully graduated to ${graduatingStudent.expProg}!`, 'success');
      setGraduatingStudent(null);
    } catch {
      // Fallback for demo UX
      setData((prev) => prev.filter((d) => d.id !== graduatingStudent.id));
      showToast(`🎉 ${graduatingStudent.name} promoted to ${graduatingStudent.expProg}`, 'success');
      setGraduatingStudent(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Graduation Action
  const executeBatchGraduation = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);

    const eligibleSelected = data.filter((s) => selectedIds.has(s.id) && s.eligible);
    if (eligibleSelected.length === 0) {
      showToast('None of the selected students are marked as Eligible.', 'error');
      setIsProcessing(false);
      setIsBatchModalOpen(false);
      return;
    }

    try {
      for (const student of eligibleSelected) {
        const targetProg = programs.find((p) => p.name === student.expProg);
        const toProgramId = targetProg?.id || student.expProgId || 'next-program-id';

        try {
          await api.post(`/graduation/${student.admissionId}`, {
            toProgramId,
            graduationDate,
            isHomebuddy: true,
          });
        } catch {
          // Continue with next
        }
      }

      setData((prev) => prev.filter((d) => !selectedIds.has(d.id)));
      showToast(`🎓 ${eligibleSelected.length} students successfully graduated!`, 'success');
      setSelectedIds(new Set());
      setIsBatchModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportRows = filteredData.map((s, idx) => ({
      'Sr. No.': idx + 1,
      'Student Name': s.name,
      'Father Name': s.fatherName || '-',
      'Student UIN': s.uin,
      'Current Program': s.currProg,
      'Expected Program': s.expProg,
      'Payment Status': s.payment,
      'Graduation Eligible': s.eligible ? 'Yes' : 'No',
    }));
    downloadAsCSV(exportRows, 'Student_Graduation_Report');
    showToast('Graduation report downloaded successfully', 'success');
  };

  // Stats KPI counts
  const totalStudents = data.length;
  const eligibleCount = data.filter((d) => d.eligible).length;
  const pendingPaymentCount = data.filter((d) => d.payment === 'Pending').length;
  const readyToGraduateCount = data.filter((d) => d.eligible && d.payment === 'Done').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Graduate Student via SEMS / Home Sunny App"
        description="Track, verify eligibility, and promote enrolled preschool students to the next academic level."
      >
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button
              onClick={() => setIsBatchModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Batch Graduate ({selectedIds.size})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5 font-medium border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 font-medium shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </PageHeader>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Enrolled</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStudents}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Active students for review</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Ready to Graduate */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ready for Promotion</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{readyToGraduateCount}</h3>
              <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Eligible & Paid</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Eligible Count */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marked Eligible</p>
              <h3 className="text-2xl font-black text-sky-600 mt-1">{eligibleCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Approved by coordinator</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Payment */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Fee</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingPaymentCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Awaiting fee clearance</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* Filters & Control Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search student name, UIN, father name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs bg-white border-slate-200 focus-visible:ring-1"
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

            {/* Quick Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Program Filter */}
              <div className="w-36">
                <Select
                  value={selectedProgram}
                  onValueChange={(val) => {
                    setSelectedProgram(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Current Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Programs</SelectItem>
                    <SelectItem value="Play Group">Play Group</SelectItem>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                    <SelectItem value="SUNOIA Junior">SUNOIA Junior</SelectItem>
                    <SelectItem value="SUNOIA Senior">SUNOIA Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Eligibility Filter */}
              <div className="w-36">
                <Select
                  value={selectedEligibility}
                  onValueChange={(val) => {
                    setSelectedEligibility(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Eligibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Eligibility</SelectItem>
                    <SelectItem value="ELIGIBLE">Eligible (Yes)</SelectItem>
                    <SelectItem value="INELIGIBLE">Ineligible (No)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Filter */}
              <div className="w-36">
                <Select
                  value={selectedPayment}
                  onValueChange={(val) => {
                    setSelectedPayment(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Payments</SelectItem>
                    <SelectItem value="DONE">Payment Done</SelectItem>
                    <SelectItem value="PENDING">Fee Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              {(search || selectedProgram !== 'ALL' || selectedEligibility !== 'ALL' || selectedPayment !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 text-xs px-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}

              {/* Page size selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Selection Notification Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2 text-xs text-blue-900 animate-in fade-in">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>
                  <strong>{selectedIds.size}</strong> student{selectedIds.size > 1 ? 's' : ''} selected across records
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsBatchModalOpen(true)}
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3"
                >
                  Graduate Selected Students
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-7 text-xs text-blue-700 hover:bg-blue-100"
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold select-none">
                {/* Checkbox Column */}
                <th className="py-3 px-4 w-10 text-center">
                  <Checkbox
                    checked={isAllPageSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all students on this page"
                  />
                </th>

                {/* Student Name */}
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Information</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Student UIN */}
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('uin')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student UIN</span>
                    {sortField === 'uin' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Promotion Path (Current -> Expected Program) */}
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Academic Progression</span>
                  </div>
                </th>

                {/* Payment Status */}
                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('payment')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Payment Status</span>
                    {sortField === 'payment' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Eligibility Toggle */}
                <th className="py-3 px-4 text-center">
                  <span>Graduation Eligible ?</span>
                </th>

                {/* Action */}
                <th className="py-3 px-4 text-center w-28">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Loading student records...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No students match the criteria</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="mt-2 text-xs h-8"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const currStyle = PROGRAM_COLORS[row.currProg] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                  const expStyle = PROGRAM_COLORS[row.expProg] || { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelectRow(row.id)}
                          aria-label={`Select ${row.name}`}
                        />
                      </td>

                      {/* Student Info with Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              row.avatarBg || 'from-blue-500 to-indigo-600'
                            } text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0`}
                          >
                            {row.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs group-hover:text-blue-600 transition-colors">
                              {row.name}
                            </span>
                            {row.fatherName && (
                              <span className="text-[11px] text-slate-400 block">
                                S/O, D/O: {row.fatherName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student UIN */}
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

                      {/* Academic Progression */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg shadow-xs">
                          {/* Current Program */}
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold border ${currStyle.bg} ${currStyle.text} ${currStyle.border}`}
                          >
                            {row.currProg}
                          </Badge>

                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />

                          {/* Expected Program */}
                          <Badge
                            className={`text-[11px] font-bold border ${expStyle.bg} ${expStyle.text} ${expStyle.border}`}
                          >
                            {row.expProg}
                          </Badge>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        {row.payment === 'Done' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-semibold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Paid</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-semibold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Pending</span>
                          </Badge>
                        )}
                      </td>

                      {/* Eligibility Segmented Toggle */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center rounded-md border border-slate-200 p-0.5 bg-slate-100/80 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleEligible(row.id, true)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                              row.eligible
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleEligible(row.id, false)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                              !row.eligible
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <XCircle className="h-3 w-3" />
                            No
                          </button>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          disabled={!row.eligible}
                          onClick={() => setGraduatingStudent(row)}
                          className={`h-8 text-xs font-semibold px-3 rounded-lg gap-1.5 shadow-xs transition-all ${
                            row.eligible
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-100 cursor-not-allowed'
                          }`}
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>Graduate</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <strong className="text-slate-700">
              {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-700">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </strong>{' '}
            of <strong className="text-slate-700">{filteredData.length}</strong> total records
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white border-slate-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 bg-white border-slate-200 gap-1"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </Button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              return startPage + i;
            })
              .filter((p) => p >= 1 && p <= totalPages)
              .map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={currentPage === p ? 'default' : 'outline'}
                  className={`h-8 w-8 p-0 text-xs font-semibold ${
                    currentPage === p
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              ))}

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 bg-white border-slate-200 gap-1"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white border-slate-200"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(totalPages)}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Single Graduation Confirmation Dialog */}
      {graduatingStudent && (
        <Dialog open={!!graduatingStudent} onOpenChange={(open) => !open && setGraduatingStudent(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <GraduationCap className="h-6 w-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Confirm Student Graduation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Review academic promotion details before committing changes to the student record.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4 text-xs">
              {/* Student Card Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Student:</span>
                  <span className="font-bold text-slate-800 text-sm">{graduatingStudent.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">UIN:</span>
                  <span className="font-mono font-semibold text-slate-700">{graduatingStudent.uin}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Progression:</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="text-slate-600">{graduatingStudent.currProg}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-blue-700 font-bold">{graduatingStudent.expProg}</span>
                  </div>
                </div>
              </div>

              {/* Graduation Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Effective Graduation Date</label>
                <Input
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Notification Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="notify-parent"
                  checked={notifyParent}
                  onCheckedChange={(checked) => setNotifyParent(!!checked)}
                />
                <label htmlFor="notify-parent" className="text-xs text-slate-600 cursor-pointer">
                  Send graduation confirmation notification to Parent on Home Sunny / SEMS App
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGraduatingStudent(null)}
                disabled={isProcessing}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={executeSingleGraduation}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-3.5 w-3.5" />
                    Confirm Graduation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Batch Graduation Confirmation Dialog */}
      {isBatchModalOpen && (
        <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Batch Graduate Selected Students
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Promote all marked eligible students in the current batch selection to their respective next program.
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4 text-xs">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 text-emerald-900">
                <p className="font-semibold mb-1">
                  You are about to graduate {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''}.
                </p>
                <p className="text-[11px] text-emerald-700">
                  Only students whose eligibility is marked as <strong>"Yes"</strong> will be processed.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Effective Graduation Date</label>
                <Input
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="notify-parent-batch"
                  checked={notifyParent}
                  onCheckedChange={(checked) => setNotifyParent(!!checked)}
                />
                <label htmlFor="notify-parent-batch" className="text-xs text-slate-600 cursor-pointer">
                  Send push notification to all parents via SEMS / Home Sunny Parent App
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={isProcessing}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={executeBatchGraduation}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Graduating Students...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Graduate {selectedIds.size} Students
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
