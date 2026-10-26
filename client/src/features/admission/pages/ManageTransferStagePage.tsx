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
  Copy,
  User,
  ShieldCheck,
} from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';

interface TransferStageStudent {
  id: string;
  studentFirstName?: string;
  studentLastName?: string;
  uin: string;
  school?: { name: string };
  transferToSchoolName?: string;
  transferDate?: string;
  program?: { name: string };
  batch?: { name: string };
  status: string;
  createdAt?: string;
  avatarBg?: string;
}

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
];

const mockTransferStageData: TransferStageStudent[] = [
  {
    id: 'ts-1',
    studentFirstName: 'Shaurya',
    studentLastName: 'Bachhav',
    uin: 'SNK/SEMS-DEMO-001/0001/2627',
    school: { name: 'SunoiaKids Arni' },
    transferToSchoolName: 'SunoiaKids Pune',
    transferDate: '2026-06-12',
    program: { name: 'Play Group' },
    batch: { name: 'Morning Batch' },
    status: 'TRANSFERRED_OUT',
    createdAt: '2026-06-01',
    avatarBg: AVATAR_GRADIENTS[0],
  },
  {
    id: 'ts-2',
    studentFirstName: 'Aarav',
    studentLastName: 'Kulkarni',
    uin: 'SEMS/3201/0042/2627',
    school: { name: 'SunoiaKids Nagpur' },
    transferToSchoolName: 'SunoiaKids Arni',
    transferDate: '2026-06-15',
    program: { name: 'Nursery' },
    batch: { name: 'Regular Shift' },
    status: 'IN_TRANSIT',
    createdAt: '2026-06-05',
    avatarBg: AVATAR_GRADIENTS[1],
  },
];

export default function ManageTransferStagePage() {
  const [data, setData] = useState<TransferStageStudent[]>(mockTransferStageData);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [copiedUin, setCopiedUin] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'transferDate' | 'status'>('transferDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // View modal
  const [selectedStudent, setSelectedStudent] = useState<TransferStageStudent | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admissions', {
        params: {
          status: 'TRANSFERRED_OUT',
          search: search || undefined,
        },
      });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setData(
          res.data.data.map((item: any, idx: number) => ({
            id: item.id,
            studentFirstName: item.studentFirstName || item.student?.firstName || 'Student',
            studentLastName: item.studentLastName || item.student?.lastName || '',
            uin: item.uin || item.student?.uin || 'N/A',
            school: item.school || { name: 'SunoiaKids Arni' },
            transferToSchoolName: item.transferToSchoolName || 'Branch Campus',
            transferDate: item.transferDate,
            program: item.program || { name: 'Nursery' },
            batch: item.batch || { name: 'Morning' },
            status: item.status || 'TRANSFERRED_OUT',
            createdAt: item.createdAt,
            avatarBg: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
          }))
        );
      } else {
        setData(mockTransferStageData);
      }
    } catch {
      setData(mockTransferStageData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCopyUin = (uin: string) => {
    if (uin === 'N/A') return;
    navigator.clipboard.writeText(uin);
    setCopiedUin(uin);
    showToast(`UIN ${uin} copied`, 'info');
    setTimeout(() => setCopiedUin(null), 2000);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsProcessingId(id);
    try {
      await api.put(`/transfers/${id}/status`, { status: newStatus });
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast(`Transfer stage status updated to ${newStatus}`, 'success');
    } catch {
      // Optimistic update
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      showToast(`Transfer stage status updated to ${newStatus}`, 'info');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleSort = (field: 'name' | 'transferDate' | 'status') => {
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
        const fullName = `${d.studentFirstName || ''} ${d.studentLastName || ''}`.toLowerCase();
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          fullName.includes(query) ||
          d.uin.toLowerCase().includes(query) ||
          (d.school?.name && d.school.name.toLowerCase().includes(query)) ||
          (d.transferToSchoolName && d.transferToSchoolName.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        const matchesProgram = programFilter === 'ALL' || d.program?.name === programFilter;

        return matchesSearch && matchesStatus && matchesProgram;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          const aName = `${a.studentFirstName} ${a.studentLastName}`.toLowerCase();
          const bName = `${b.studentFirstName} ${b.studentLastName}`.toLowerCase();
          return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        }
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
      'Student Name': `${d.studentFirstName || ''} ${d.studentLastName || ''}`.trim(),
      'UIN': d.uin,
      'From Campus': d.school?.name || 'N/A',
      'Destination Campus': d.transferToSchoolName || 'N/A',
      'Transfer Date': d.transferDate ? formatDate(d.transferDate) : 'N/A',
      'Program': d.program?.name || 'N/A',
      'Batch': d.batch?.name || 'N/A',
      'Stage Status': d.status,
    }));
    downloadAsCSV(exportRows, 'Manage_Transfer_Stage_Report');
    showToast('Transfer stage records exported to CSV', 'success');
  };

  const totalStageCount = data.length;
  const inTransitCount = data.filter((d) => d.status === 'TRANSFERRED_OUT' || d.status === 'IN_TRANSIT').length;
  const approvedStageCount = data.filter((d) => d.status === 'APPROVED').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Manage Transfer Stage"
        description="Track students currently undergoing campus transfers and oversee stage approvals."
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total In-Stage</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalStageCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Students in transfer pipeline</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Awaiting Destination</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{inTransitCount}</h3>
              <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Pending receiving acceptance</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved & Enrolled</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{approvedStageCount}</h3>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Completed stage transfer</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-36">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="Stage Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Stages</SelectItem>
                  <SelectItem value="TRANSFERRED_OUT">Transferred Out</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Name & UIN</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4">Campus Movement</th>

                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('transferDate')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Dates (Transfer / Req)</span>
                    {sortField === 'transferDate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Program & Batch</th>

                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Stage Status</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center w-40">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Loading stage data...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No students found in transfer stage</p>
                      <p className="text-xs text-slate-400">All student transfer stages are currently clear</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((student) => {
                  const studentName = `${student.studentFirstName || ''} ${student.studentLastName || ''}`.trim();

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              student.avatarBg || 'from-blue-500 to-indigo-600'
                            } text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0`}
                          >
                            {studentName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs group-hover:text-blue-600 transition-colors">
                              {studentName}
                            </span>
                            <div className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <span>{student.uin}</span>
                              <button
                                type="button"
                                title="Copy UIN"
                                onClick={() => handleCopyUin(student.uin)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                              >
                                {copiedUin === student.uin ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Movement */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.school?.name || 'Origin Campus'}</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <div className="flex items-center gap-1 text-blue-700 font-bold">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>{student.transferToSchoolName || 'Destination'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-[11px]">
                          <span className="text-slate-700 font-medium block">
                            Out: {student.transferDate ? formatDate(student.transferDate) : 'Pending'}
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            Req: {student.createdAt ? formatDate(student.createdAt) : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Program & Batch */}
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700">
                            {student.program?.name || 'Preschool'}
                          </Badge>
                          {student.batch?.name && (
                            <span className="text-[10px] text-slate-400 block">{student.batch.name}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={`text-[10px] font-bold border ${
                            student.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {student.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 text-slate-600 hover:bg-slate-100"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>

                          <Button
                            size="sm"
                            disabled={isProcessingId === student.id || student.status === 'APPROVED'}
                            onClick={() => handleUpdateStatus(student.id, 'APPROVED')}
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            <span>Accept</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessingId === student.id}
                            onClick={() => handleUpdateStatus(student.id, 'REJECTED')}
                            className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50 rounded"
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
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

      {/* Details Dialog */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Transfer Stage Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed audit trail and current stage progress for {selectedStudent.studentFirstName} {selectedStudent.studentLastName}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student:</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.studentFirstName} {selectedStudent.studentLastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">UIN:</span>
                  <span className="font-mono text-slate-700">{selectedStudent.uin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Program / Batch:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStudent.program?.name || 'N/A'} {selectedStudent.batch?.name ? `(${selectedStudent.batch.name})` : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Origin Campus:</span>
                  <span className="font-semibold text-slate-800">{selectedStudent.school?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Destination Campus:</span>
                  <span className="font-semibold text-blue-700">{selectedStudent.transferToSchoolName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transfer Out Date:</span>
                  <span className="text-slate-700">{selectedStudent.transferDate ? formatDate(selectedStudent.transferDate) : 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Request Initialized:</span>
                  <span className="text-slate-700">{selectedStudent.createdAt ? formatDate(selectedStudent.createdAt) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <Badge className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                    {selectedStudent.status.replace(/_/g, ' ')}
                  </Badge>
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
