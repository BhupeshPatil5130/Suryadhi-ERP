import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Boxes,
  BarChart2,
  FileText,
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
  Package,
  Layers,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  downloadAsExcel,
  downloadAsWord,
  downloadAsPowerPoint,
  downloadAsPDF,
  downloadAsCSV,
} from '@/lib/export';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface InventoryStudent {
  id: string;
  uin: string;
  name: string;
  program: string;
  status: string;
  avatarBg?: string;
}

interface ManualStockRow {
  program: string;
  count: number;
  stockA: number;
  stockB: number;
  remaining: number;
  status: string;
}

interface InventoryReportItem {
  itemCode: string;
  itemName: string;
  program: string;
  category: string;
  received: number;
  issued: number;
  balance: number;
  status: string;
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
];

const PROGRAM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Play Group': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Nursery': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'SUNOIA Junior': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'SUNOIA Senior': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const dummyData: InventoryStudent[] = [
  { id: 'inv-1', uin: 'SNK/SEMS-DEMO-001/0001/2627', name: 'Shaurya Bachhav', program: 'Play Group', status: 'D Model PO Adjustment is pending', avatarBg: AVATAR_GRADIENTS[0] },
  { id: 'inv-2', uin: 'SEMS/3201/0041/2627', name: 'Adiyan Imran Parekh', program: 'SUNOIA Senior', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[1] },
  { id: 'inv-3', uin: 'SEMS/3201/0023/2627', name: 'Affan Baig Mirza', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[2] },
  { id: 'inv-4', uin: 'SEMS/3201/0034/2627', name: 'Alina Shahnawaz Sheikh', program: 'Nursery', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[3] },
  { id: 'inv-5', uin: 'SEMS/3201/0002/2627', name: 'Aarohi Santosh Sonare', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[4] },
  { id: 'inv-6', uin: 'SEMS/3201/0014/2627', name: 'Dnyanda Nandkishor Bawane', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[0] },
  { id: 'inv-7', uin: 'SEMS/3201/0052/2627', name: 'Mahi Sachin Rathod', program: 'SUNOIA Senior', status: 'D Model PO Adjustment is pending', avatarBg: AVATAR_GRADIENTS[1] },
  { id: 'inv-8', uin: 'SEMS/3201/0064/2627', name: 'Nityashree Narendra Halse', program: 'Nursery', status: 'Adjusted against the D Model Inventory', avatarBg: AVATAR_GRADIENTS[2] },
  { id: 'inv-9', uin: 'SEMS/3201/0067/2627', name: 'Priyansh Gopal Pardhi', program: 'SUNOIA Junior', status: 'D Model PO Adjustment is pending', avatarBg: AVATAR_GRADIENTS[3] },
  { id: 'inv-10', uin: 'SEMS/3201/0087/2627', name: 'Virajas Rahul Deshmukh', program: 'Nursery', status: 'D Model PO Adjustment is pending', avatarBg: AVATAR_GRADIENTS[4] },
  { id: 'inv-11', uin: 'SEMS/3201/0085/2627', name: 'Amayara Akash Rathod', program: 'Nursery', status: 'D Model PO Adjustment is pending', avatarBg: AVATAR_GRADIENTS[0] },
];

const initialModalData: ManualStockRow[] = [
  { program: 'Play Group', count: 6, stockA: 5, stockB: 5, remaining: 0, status: 'Fulfilled' },
  { program: 'Nursery', count: 33, stockA: 28, stockB: 28, remaining: 0, status: 'Fulfilled' },
  { program: 'SUNOIA Junior', count: 33, stockA: 16, stockB: 16, remaining: 0, status: 'Fulfilled' },
  { program: 'SUNOIA Senior', count: 16, stockA: 10, stockB: 10, remaining: 0, status: 'Fulfilled' },
];

const initialReportData: InventoryReportItem[] = [
  { itemCode: 'KIT-PG-001', itemName: 'Play Group Welcome Kit', program: 'Play Group', category: 'Kit', received: 50, issued: 6, balance: 44, status: 'In Stock' },
  { itemCode: 'KIT-NR-002', itemName: 'Nursery Welcome Kit', program: 'Nursery', category: 'Kit', received: 100, issued: 33, balance: 67, status: 'In Stock' },
  { itemCode: 'KIT-EJ-003', itemName: 'SUNOIA Junior Welcome Kit', program: 'SUNOIA Junior', category: 'Kit', received: 50, issued: 33, balance: 17, status: 'Low Stock' },
  { itemCode: 'KIT-ES-004', itemName: 'SUNOIA Senior Welcome Kit', program: 'SUNOIA Senior', category: 'Kit', received: 30, issued: 16, balance: 14, status: 'In Stock' },
  { itemCode: 'BKS-NR-102', itemName: 'Nursery Book Set', program: 'Nursery', category: 'Book', received: 120, issued: 33, balance: 87, status: 'In Stock' },
  { itemCode: 'UNF-EJ-201', itemName: 'SUNOIA Junior Summer Uniform', program: 'SUNOIA Junior', category: 'Uniform', received: 60, issued: 33, balance: 27, status: 'In Stock' },
  { itemCode: 'UNF-ES-202', itemName: 'SUNOIA Senior Summer Uniform', program: 'SUNOIA Senior', category: 'Uniform', received: 40, issued: 16, balance: 24, status: 'In Stock' },
];

export default function InventoryDetailsPage() {
  const [data, setData] = useState<InventoryStudent[]>(dummyData);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedUin, setCopiedUin] = useState<string | null>(null);

  // Main Page Filters
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'uin' | 'program' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal 1 Filters (Manual Stock Details)
  const [modalSearch, setModalSearch] = useState('');
  const [modalProgramFilter, setModalProgramFilter] = useState('ALL');

  // Modal 2 Filters (Inventory Details Report)
  const [reportSearch, setReportSearch] = useState('');
  const [reportProgramFilter, setReportProgramFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');

  // Single Item View Dialog
  const [selectedStudent, setSelectedStudent] = useState<InventoryStudent | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admissions', { params: { limit: 100 } });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped: InventoryStudent[] = res.data.data.map((item: any, idx: number) => ({
          id: item.id || `inv-${idx + 1}`,
          uin: item.uin || item.student?.uin || `SNK/3201/${String(idx + 1).padStart(4, '0')}/2627`,
          name: `${item.studentFirstName || item.student?.firstName || ''} ${item.studentLastName || item.student?.lastName || ''}`.trim() || 'Student',
          program: item.program?.name || (idx % 4 === 0 ? 'Play Group' : idx % 4 === 1 ? 'Nursery' : idx % 4 === 2 ? 'SUNOIA Junior' : 'SUNOIA Senior'),
          status: idx % 3 === 0 ? 'D Model PO Adjustment is pending' : 'Adjusted against the D Model Inventory',
          avatarBg: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
        }));
        setData(mapped);
      }
    } catch {
      setData(dummyData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCopyUin = (uin: string) => {
    navigator.clipboard.writeText(uin);
    setCopiedUin(uin);
    showToast(`UIN ${uin} copied to clipboard`, 'info');
    setTimeout(() => setCopiedUin(null), 2000);
  };

  const handleSort = (field: 'name' | 'uin' | 'program' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Main filter logic
  const filtered = useMemo(() => {
    return data
      .filter((d) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          d.name.toLowerCase().includes(query) ||
          d.uin.toLowerCase().includes(query) ||
          d.program.toLowerCase().includes(query) ||
          d.status.toLowerCase().includes(query);

        const matchesProgram = programFilter === 'ALL' || d.program === programFilter;
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'ADJUSTED' && d.status.includes('Adjusted')) ||
          (statusFilter === 'PENDING' && d.status.includes('pending'));

        return matchesSearch && matchesProgram && matchesStatus;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, search, programFilter, statusFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Modal 1 filter logic
  const filteredModalData = useMemo(() => {
    return initialModalData.filter((d) => {
      const matchesSearch = !modalSearch || d.program.toLowerCase().includes(modalSearch.toLowerCase());
      const matchesProgram = modalProgramFilter === 'ALL' || d.program === modalProgramFilter;
      return matchesSearch && matchesProgram;
    });
  }, [modalSearch, modalProgramFilter]);

  // Modal 2 filter logic
  const filteredReportData = useMemo(() => {
    return initialReportData.filter((d) => {
      const query = reportSearch.toLowerCase();
      const matchesSearch =
        !reportSearch ||
        d.itemCode.toLowerCase().includes(query) ||
        d.itemName.toLowerCase().includes(query) ||
        d.program.toLowerCase().includes(query);

      const matchesProgram = reportProgramFilter === 'ALL' || d.program === reportProgramFilter;
      const matchesStatus = reportStatusFilter === 'ALL' || d.status === reportStatusFilter;
      return matchesSearch && matchesProgram && matchesStatus;
    });
  }, [reportSearch, reportProgramFilter, reportStatusFilter]);

  // Overall metrics
  const totalStudents = data.length;
  const adjustedCount = data.filter((d) => d.status.includes('Adjusted')).length;
  const pendingCount = data.filter((d) => d.status.includes('pending')).length;
  const totalStockBalance = initialReportData.reduce((acc, r) => acc + r.balance, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Inventory Details"
        description="Track student welcome kit allocations, manual stock levels, and D-Model purchase order adjustments."
      >
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          {/* Top Button Row */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 gap-1.5 font-semibold shadow-sm"
            >
              <BarChart2 className="w-4 h-4" />
              Manual Stock Details
            </Button>

            <Button
              onClick={() => setIsReportOpen(true)}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50 text-slate-800 text-xs h-9 gap-1.5 font-semibold shadow-sm"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              Inventory Details Report
            </Button>
          </div>

          {/* Export Toolbar - Aligned to the rightmost edge */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white shadow-xs self-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Export:</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                downloadAsExcel(filtered, 'Inventory_Details');
                showToast('Exported to Excel', 'success');
              }}
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              Excel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
              onClick={() => {
                downloadAsWord(filtered, 'Inventory_Details.doc', 'Inventory Details');
                showToast('Exported to Word', 'success');
              }}
              title="Export to Word"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Word
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
              onClick={() => {
                downloadAsPowerPoint(filtered, 'Inventory_Details.ppt', 'Inventory Details');
                showToast('Exported to PowerPoint', 'success');
              }}
              title="Export to PowerPoint"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              PPT
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-rose-700 hover:bg-rose-50"
              onClick={() => downloadAsPDF(filtered, 'Inventory Details Report')}
              title="PDF / Print"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Allocations</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStudents}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Enrolled student inventory</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Adjusted Against D-Model */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fulfilled & Adjusted</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{adjustedCount}</h3>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">D-Model inventory cleared</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* PO Adjustment Pending */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">PO Adjustment Pending</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
              <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Awaiting purchase order sync</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overall Kit Stock Balance */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kit Stock Balance</p>
              <h3 className="text-2xl font-black text-sky-600 mt-1">{totalStockBalance} units</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all preschool kits</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search UIN, student name, status..."
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
            {/* Program Filter */}
            <div className="w-40">
              <Select
                value={programFilter}
                onValueChange={(val) => {
                  setProgramFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="All Programs" />
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

            {/* Status Filter */}
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ADJUSTED">Adjusted against D-Model</SelectItem>
                  <SelectItem value="PENDING">PO Adjustment Pending</SelectItem>
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
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors w-[22%]"
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

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors w-[28%]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Name</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-center w-[18%]"
                  onClick={() => handleSort('program')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Program Name</span>
                  </div>
                </th>

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-left w-[24%]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status Details</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center w-[8%]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Loading inventory records...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Boxes className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No inventory records found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isPending = row.status.includes('pending');
                  const progStyle = PROGRAM_COLORS[row.program] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
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

                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              row.avatarBg || 'from-blue-500 to-indigo-600'
                            } text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0`}
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
                            <span className="text-[11px] text-slate-400 block">Active Student Kit</span>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold border ${progStyle.bg} ${progStyle.text} ${progStyle.border}`}
                        >
                          {row.program}
                        </Badge>
                      </td>

                      {/* Status Details */}
                      <td className="py-3 px-4">
                        {isPending ? (
                          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-[11px] font-semibold py-1 px-2.5 inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>{row.status}</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold py-1 px-2.5 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{row.status}</span>
                          </Badge>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setSelectedStudent(row)}
                          title="View Allocation Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-700">{Math.min(currentPage * pageSize, filtered.length)}</strong> of{' '}
            <strong className="text-slate-700">{filtered.length}</strong> entries (filtered from {data.length} total)
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

      {/* 1. Modern Manual Stock Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden rounded-xl border border-slate-200">
          <DialogHeader className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                Manual Stock Details
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-100 mt-0.5">
                Overview of physical kit counts allocated and remaining by preschool model.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4 text-xs">
            {/* Modal Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search program..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="pl-8 h-8 text-xs w-[160px] bg-white border-slate-200"
                  />
                </div>

                <div className="w-36">
                  <Select value={modalProgramFilter} onValueChange={setModalProgramFilter}>
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Program" />
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
              </div>

              <Button
                size="sm"
                onClick={() => {
                  downloadAsExcel(filteredModalData, 'Manual_Stock_Details');
                  showToast('Stock details exported to Excel', 'success');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download to Excel
              </Button>
            </div>

            {/* Modal Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                    <th className="p-3">Program</th>
                    <th className="p-3 text-right">Student Count</th>
                    <th className="p-3 text-right">Manual Stock (Model A)</th>
                    <th className="p-3 text-right">Manual Stock (Model B)</th>
                    <th className="p-3 text-right">Remaining Stock</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredModalData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{row.program}</td>
                      <td className="p-3 text-right font-mono">{row.count}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{row.stockA}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{row.stockB}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{row.remaining}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modern Inventory Details Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[880px] p-0 overflow-hidden rounded-xl border border-slate-200">
          <DialogHeader className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Inventory Details Report & Stock Movement
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 mt-0.5">
                Item-level audit for welcome kits, uniform sets, and books.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4 text-xs">
            {/* Report Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search item or code..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-8 h-8 text-xs w-[170px] bg-white border-slate-200"
                  />
                </div>

                <div className="w-36">
                  <Select value={reportProgramFilter} onValueChange={setReportProgramFilter}>
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Program" />
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

                <div className="w-32">
                  <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    downloadAsExcel(filteredReportData, 'Inventory_Details_Report');
                    showToast('Report exported to Excel', 'success');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                    <th className="p-3">Item Code</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Program</th>
                    <th className="p-3 text-center">Category</th>
                    <th className="p-3 text-right">Received</th>
                    <th className="p-3 text-right">Issued</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-700 font-medium">{row.itemCode}</td>
                      <td className="p-3 font-semibold text-slate-900">{row.itemName}</td>
                      <td className="p-3 text-slate-600">{row.program}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px] border-slate-200 bg-slate-50">
                          {row.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono">{row.received}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{row.issued}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">{row.balance}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            row.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex sm:justify-between items-center">
            <Button
              onClick={() => {
                downloadAsCSV(filteredReportData, 'Inventory_Details_Report');
                showToast('Report downloaded as CSV', 'success');
              }}
              size="sm"
              variant="outline"
              className="text-xs h-8 border-slate-300"
            >
              Download CSV
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsReportOpen(false)} className="text-xs h-8 bg-slate-900">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Student Allocation Audit Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <Boxes className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Student Kit Allocation</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Audit trail and inventory settlement status for {selectedStudent.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">UIN:</span>
                  <span className="font-mono text-slate-700">{selectedStudent.uin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Program:</span>
                  <span className="font-semibold text-slate-700">{selectedStudent.program}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Kit Status:</span>
                  <Badge
                    className={`text-[10px] font-semibold border ${
                      selectedStudent.status.includes('Adjusted')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedStudent.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Inventory Model:</span>
                  <span className="font-semibold text-slate-800">D-Model PO Allocation</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full text-xs" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
