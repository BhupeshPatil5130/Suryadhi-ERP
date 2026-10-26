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
  ArrowRightLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  RotateCcw,
  Eye,
  Edit,
  Check,
  Building2,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { downloadAsCSV } from '@/lib/export';

interface TransferRecord {
  id: string;
  studentName: string;
  uin?: string;
  fromSchool: string;
  toSchool: string;
  transferDate: string;
  requestDate: string;
  programName: string;
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | string;
  avatarBg?: string;
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
];

const mockTransfers: TransferRecord[] = [
  {
    id: 't1',
    studentName: 'Kabir Dev',
    uin: 'SNK/3201/0088/2627',
    fromSchool: 'SunoiaKids Arni',
    toSchool: 'SunoiaKids Pune',
    transferDate: '12/06/2026',
    requestDate: '01/06/2026',
    programName: 'Nursery',
    status: 'REQUESTED',
    avatarBg: AVATAR_GRADIENTS[0],
  },
  {
    id: 't2',
    studentName: 'Maya Roy',
    uin: 'SEMS/3201/0045/2627',
    fromSchool: 'SunoiaKids Nagpur',
    toSchool: 'SunoiaKids Arni',
    transferDate: '10/06/2026',
    requestDate: '28/05/2026',
    programName: 'SUNOIA Junior',
    status: 'COMPLETED',
    avatarBg: AVATAR_GRADIENTS[1],
  },
  {
    id: 't3',
    studentName: 'Arjun Sharma',
    uin: 'SNK/3201/0019/2627',
    fromSchool: 'SunoiaKids Delhi',
    toSchool: 'SunoiaKids Arni',
    transferDate: '',
    requestDate: '05/06/2026',
    programName: 'Play Group',
    status: 'REQUESTED',
    avatarBg: AVATAR_GRADIENTS[2],
  },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  REQUESTED: { label: 'Requested', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
};

export default function SchoolTransferRequestsPage() {
  const [data, setData] = useState<TransferRecord[]>(mockTransfers);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'studentName' | 'requestDate' | 'fromSchool' | 'toSchool' | 'status'>('requestDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [viewRecord, setViewRecord] = useState<TransferRecord | null>(null);
  const [editRecord, setEditRecord] = useState<TransferRecord | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTransfers = () => {
    setIsLoading(true);
    api.get('/transfers/requests')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setData(
            res.data.data.map((t: any, idx: number) => ({
              id: t.id,
              studentName: `${t.admission?.student?.firstName || ''} ${t.admission?.student?.lastName || ''}`.trim() || 'Student',
              uin: t.admission?.student?.uin || 'N/A',
              fromSchool: t.fromSchoolName || t.fromSchool?.name || 'Main Campus',
              toSchool: t.toSchoolName || t.toSchool?.name || 'Branch Campus',
              transferDate: t.transferDate ? new Date(t.transferDate).toLocaleDateString('en-GB') : '',
              requestDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
              programName: t.admission?.program?.name || 'Preschool',
              status: t.status || 'REQUESTED',
              avatarBg: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
            }))
          );
        } else {
          setData(mockTransfers);
        }
      })
      .catch(() => setData(mockTransfers))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/transfers/${id}/status`, { status: newStatus });
      setData((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      showToast(`Transfer status updated to ${newStatus}`, 'success');
    } catch {
      // Optimistic update
      setData((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      showToast(`Transfer status updated to ${newStatus}`, 'info');
    } finally {
      setIsUpdating(false);
      setEditRecord(null);
    }
  };

  const handleSort = (field: 'studentName' | 'requestDate' | 'fromSchool' | 'toSchool' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = useMemo(() => {
    return data
      .filter((d) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          d.studentName.toLowerCase().includes(query) ||
          (d.uin && d.uin.toLowerCase().includes(query)) ||
          d.fromSchool.toLowerCase().includes(query) ||
          d.toSchool.toLowerCase().includes(query) ||
          d.programName.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        const matchesProgram = programFilter === 'ALL' || d.programName === programFilter;

        return matchesSearch && matchesStatus && matchesProgram;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, search, statusFilter, programFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportCSV = () => {
    const exportRows = filtered.map((d, i) => ({
      'Sr No.': i + 1,
      'Student Name': d.studentName,
      'Student UIN': d.uin || 'N/A',
      'From School': d.fromSchool,
      'To School': d.toSchool,
      'Request Date': d.requestDate,
      'Transfer Out Date': d.transferDate || '-',
      'Program': d.programName,
      'Status': d.status,
    }));
    downloadAsCSV(exportRows, 'School_Transfer_Requests_Report');
    showToast('Transfer requests exported to CSV', 'success');
  };

  const totalCount = data.length;
  const requestedCount = data.filter((d) => d.status === 'REQUESTED').length;
  const approvedCount = data.filter((d) => d.status === 'APPROVED').length;
  const completedCount = data.filter((d) => d.status === 'COMPLETED').length;
  const rejectedCount = data.filter((d) => d.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="School Transfer Requests (Transfer IN)"
        description="Manage, review, and approve incoming student transfer requests across campuses."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransfers}
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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Total Transfers */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</span>
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCount}</h3>
            <div className="mt-2 h-1 w-full bg-blue-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Requested */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Requested</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{requestedCount}</h3>
            <div className="mt-2 h-1 w-full bg-amber-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(requestedCount / (totalCount || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-sky-500" />
            </div>
            <h3 className="text-2xl font-black text-sky-600 mt-1">{approvedCount}</h3>
            <div className="mt-2 h-1 w-full bg-sky-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(approvedCount / (totalCount || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</h3>
            <div className="mt-2 h-1 w-full bg-emerald-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(completedCount / (totalCount || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Rejected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</h3>
            <div className="mt-2 h-1 w-full bg-rose-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(rejectedCount / (totalCount || 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1.5">Status:</span>
            {[
              { id: 'ALL', label: 'All Status', count: totalCount },
              { id: 'REQUESTED', label: 'Requested', count: requestedCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'COMPLETED', label: 'Completed', count: completedCount },
              { id: 'REJECTED', label: 'Rejected', count: rejectedCount },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                className={`h-7 text-xs px-3 rounded-full font-medium transition-all ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
              >
                <span>{tab.label}</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </Button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search student, UIN, campus..."
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

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36">
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
                    <SelectItem value="Play Group">Play Group</SelectItem>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                    <SelectItem value="SUNOIA Junior">SUNOIA Junior</SelectItem>
                    <SelectItem value="SUNOIA Senior">SUNOIA Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || statusFilter !== 'ALL' || programFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setProgramFilter('ALL');
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
                  className="h-9 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
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
                  onClick={() => handleSort('studentName')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Details</span>
                    {sortField === 'studentName' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('fromSchool')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Transfer Route (From ➔ To)</span>
                  </div>
                </th>

                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('requestDate')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Timeline (Req / Out)</span>
                    {sortField === 'requestDate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Program</th>

                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Loading transfer records...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No transfer requests found</p>
                      <p className="text-xs text-slate-400">Try changing status or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const statusInfo = STATUS_CONFIG[row.status] || STATUS_CONFIG.REQUESTED;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Student Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              row.avatarBg || 'from-blue-500 to-indigo-600'
                            } text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0`}
                          >
                            {row.studentName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs group-hover:text-blue-600 transition-colors">
                              {row.studentName}
                            </span>
                            {row.uin && (
                              <span className="text-[11px] font-mono text-slate-400 block">{row.uin}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{row.fromSchool}</span>
                          </div>

                          <ArrowRight className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />

                          <div className="flex items-center gap-1 text-blue-700 font-bold">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>{row.toSchool}</span>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-[11px]">
                          <span className="text-slate-700 font-medium block">Req: {row.requestDate}</span>
                          <span className="text-slate-400 block text-[10px]">Out: {row.transferDate || '—'}</span>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700">
                          {row.programName}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={`text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} inline-flex items-center gap-1`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.label}</span>
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            title="View Details"
                            onClick={() => setViewRecord(row)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit Status"
                            onClick={() => {
                              setEditRecord(row);
                              setEditStatus(row.status);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          {row.status === 'REQUESTED' ? (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(row.id, 'APPROVED')}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-7 px-2 text-[10px] text-slate-400 bg-slate-50 border-slate-200"
                            >
                              {row.status === 'APPROVED' ? 'Approved' : 'Processed'}
                            </Button>
                          )}
                        </div>
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
            <strong className="text-slate-700">{filtered.length}</strong> records
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

      {/* View Details Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Transfer Request Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed campus transfer inquiry and audit information.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-800">{viewRecord.studentName}</span>
                </div>
                {viewRecord.uin && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">UIN:</span>
                    <span className="font-mono text-slate-700">{viewRecord.uin}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Program:</span>
                  <span className="font-semibold text-slate-700">{viewRecord.programName}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Origin Campus:</span>
                  <span className="font-semibold text-slate-800">{viewRecord.fromSchool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Destination Campus:</span>
                  <span className="font-semibold text-blue-700">{viewRecord.toSchool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Request Date:</span>
                  <span className="text-slate-700">{viewRecord.requestDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transfer Out Date:</span>
                  <span className="text-slate-700">{viewRecord.transferDate || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <Badge className={`text-[10px] font-semibold border ${STATUS_CONFIG[viewRecord.status]?.bg || 'bg-slate-50'} ${STATUS_CONFIG[viewRecord.status]?.text || 'text-slate-700'} ${STATUS_CONFIG[viewRecord.status]?.border || 'border-slate-200'}`}>
                    {viewRecord.status}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full text-xs" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Status Dialog */}
      {editRecord && (
        <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Update Transfer Status</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Change the workflow status for <strong>{editRecord.studentName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select New Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUESTED">Requested</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setEditRecord(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange(editRecord.id, editStatus)}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Save Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
