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
  UserMinus,
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
  IndianRupee,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import { downloadAsCSV } from '@/lib/export';

interface QuitRecord {
  id: string;
  uin: string;
  name: string;
  fatherName: string;
  program: string;
  quitDate: string;
  reason?: string;
  invoiceAmount: number;
  collectionAmount: number;
  conversionStatus: 'not-converted' | 'converted';
  avatarBg?: string;
}

const AVATAR_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-blue-500 to-indigo-600',
];

const mockQuitData: QuitRecord[] = [
  {
    id: 'q1',
    uin: 'SNK/3201/0012/2627',
    name: 'Reyansh Deshpande',
    fatherName: 'Mahesh Deshpande',
    program: 'Play Group',
    quitDate: '02/06/2026',
    reason: 'Relocating to another city',
    invoiceAmount: 25000,
    collectionAmount: 15000,
    conversionStatus: 'not-converted',
    avatarBg: AVATAR_GRADIENTS[0],
  },
  {
    id: 'q2',
    uin: 'SEMS/3201/0034/2627',
    name: 'Ishaika Kulkarni',
    fatherName: 'Pravin Kulkarni',
    program: 'Nursery',
    quitDate: '15/05/2026',
    reason: 'Financial considerations',
    invoiceAmount: 32000,
    collectionAmount: 32000,
    conversionStatus: 'converted',
    avatarBg: AVATAR_GRADIENTS[1],
  },
  {
    id: 'q3',
    uin: 'SNK/3201/0078/2627',
    name: 'Devendra Varma',
    fatherName: 'Sunil Varma',
    program: 'SUNOIA Junior',
    quitDate: '28/05/2026',
    reason: 'Medical / Health grounds',
    invoiceAmount: 28000,
    collectionAmount: 20000,
    conversionStatus: 'not-converted',
    avatarBg: AVATAR_GRADIENTS[2],
  },
];

export default function ManageQuitAdmissionPage() {
  const [data, setData] = useState<QuitRecord[]>(mockQuitData);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conversionFilter, setConversionFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [copiedUin, setCopiedUin] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'uin' | 'quitDate' | 'invoiceAmount'>('quitDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // View modal
  const [selectedRecord, setSelectedRecord] = useState<QuitRecord | null>(null);

  const fetchQuitList = () => {
    setIsLoading(true);
    api.get('/quit/list')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setData(
            res.data.data.map((q: any, idx: number) => ({
              id: q.id,
              uin: q.admission?.student?.uin || 'N/A',
              name: `${q.admission?.student?.firstName || ''} ${q.admission?.student?.lastName || ''}`.trim() || 'Student',
              fatherName: q.admission?.student?.parent?.fatherName || 'Not Provided',
              program: q.admission?.program?.name || 'Preschool',
              quitDate: q.quitDate ? new Date(q.quitDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
              reason: q.reason || 'General Withdrawal',
              invoiceAmount: Number(q.invoiceAmount || q.admission?.fees || 25000),
              collectionAmount: Number(q.collectionAmount || q.admission?.paidFees || 15000),
              conversionStatus: q.isConverted ? 'converted' : 'not-converted',
              avatarBg: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
            }))
          );
        } else {
          setData(mockQuitData);
        }
      })
      .catch(() => setData(mockQuitData))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQuitList();
  }, []);

  const handleCopyUin = (uin: string) => {
    if (uin === 'N/A') return;
    navigator.clipboard.writeText(uin);
    setCopiedUin(uin);
    showToast(`UIN ${uin} copied`, 'info');
    setTimeout(() => setCopiedUin(null), 2000);
  };

  const handleToggleConversion = (id: string) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.conversionStatus === 'converted' ? 'not-converted' : 'converted';
          showToast(
            nextStatus === 'converted'
              ? `Student ${item.name} marked as Retained / Converted!`
              : `Student ${item.name} status reverted to Active Quit`,
            'success'
          );
          return { ...item, conversionStatus: nextStatus };
        }
        return item;
      })
    );
  };

  const handleSort = (field: 'name' | 'uin' | 'quitDate' | 'invoiceAmount') => {
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
          d.name.toLowerCase().includes(query) ||
          d.uin.toLowerCase().includes(query) ||
          d.fatherName.toLowerCase().includes(query) ||
          d.program.toLowerCase().includes(query);

        const matchesConversion =
          conversionFilter === 'all' || d.conversionStatus === conversionFilter;
        const matchesProgram = programFilter === 'ALL' || d.program === programFilter;

        return matchesSearch && matchesConversion && matchesProgram;
      })
      .sort((a, b) => {
        if (sortField === 'invoiceAmount') {
          return sortOrder === 'asc' ? a.invoiceAmount - b.invoiceAmount : b.invoiceAmount - a.invoiceAmount;
        }
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, search, conversionFilter, programFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportCSV = () => {
    const exportRows = filtered.map((d, i) => ({
      'Sr No.': i + 1,
      'Student Name': d.name,
      'UIN': d.uin,
      'Father Name': d.fatherName,
      'Program': d.program,
      'Quit Date': d.quitDate,
      'Invoice Amount (Rs.)': d.invoiceAmount,
      'Collection Amount (Rs.)': d.collectionAmount,
      'Retention Status': d.conversionStatus === 'converted' ? 'Converted / Retained' : 'Not Converted',
    }));
    downloadAsCSV(exportRows, 'Manage_Quit_Admission_Report');
    showToast('Quit admission records exported to CSV', 'success');
  };

  const totalQuit = data.length;
  const activeQuitCount = data.filter((d) => d.conversionStatus === 'not-converted').length;
  const convertedCount = data.filter((d) => d.conversionStatus === 'converted').length;
  const totalBalanceAmount = data.reduce((acc, d) => acc + (d.invoiceAmount - d.collectionAmount), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Manage Quit Admission"
        description="Track student withdrawal requests, review financial settlement, and record retention conversions."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuitList}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Withdrawals</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalQuit}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Recorded dropouts</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserMinus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Quit (Unconverted)</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{activeQuitCount}</h3>
              <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Not retained</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Successfully Retained</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{convertedCount}</h3>
              <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Converted back to active</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fee Balance Dues</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(totalBalanceAmount)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Pending collection/refund</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student, UIN, father name..."
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
                value={conversionFilter}
                onValueChange={(val) => {
                  setConversionFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <SelectValue placeholder="Retention Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="not-converted">Not Converted</SelectItem>
                  <SelectItem value="converted">Converted / Retained</SelectItem>
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

            {(search || conversionFilter !== 'all' || programFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setConversionFilter('all');
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
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student & Parent Name</span>
                    {sortField === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Program Taken</th>

                <th
                  className="py-3 px-4 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('quitDate')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Quit Date</span>
                    {sortField === 'quitDate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-blue-600" /> : <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                </th>

                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => handleSort('invoiceAmount')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Fee Settlement (Inv / Paid)</span>
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Retention Status</th>

                <th className="py-3 px-4 text-center w-36">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Loading quit admission records...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserMinus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No quit admission records found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const isConverted = row.conversionStatus === 'converted';

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

                      {/* Name & Parent */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              row.avatarBg || 'from-rose-500 to-pink-600'
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
                            <span className="text-[11px] text-slate-400 block">Father: {row.fatherName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className="text-[11px] font-medium border-slate-200 bg-slate-50 text-slate-700">
                          {row.program}
                        </Badge>
                      </td>

                      {/* Quit Date */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.quitDate}</span>
                        </div>
                      </td>

                      {/* Financial Settlement */}
                      <td className="py-3 px-4 text-right">
                        <div>
                          <span className="font-bold text-slate-900 block font-mono">
                            Inv: {formatCurrency(row.invoiceAmount)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-mono block">
                            Paid: {formatCurrency(row.collectionAmount)}
                          </span>
                        </div>
                      </td>

                      {/* Conversion Status */}
                      <td className="py-3 px-4 text-center">
                        {isConverted ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Retained</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Active Quit</span>
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
                            onClick={() => setSelectedRecord(row)}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={isConverted ? 'outline' : 'default'}
                            onClick={() => handleToggleConversion(row.id)}
                            className={`h-7 text-[11px] px-2.5 rounded font-semibold ${
                              isConverted
                                ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            {isConverted ? 'Revert' : 'Retain'}
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
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5">
                <UserMinus className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">Withdrawal Record Details</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Detailed student quit record, fee settlement, and reason for withdrawal.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-bold text-slate-800">{selectedRecord.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">UIN:</span>
                  <span className="font-mono text-slate-700">{selectedRecord.uin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Father's Name:</span>
                  <span className="text-slate-700">{selectedRecord.fatherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Program Taken:</span>
                  <span className="font-semibold text-slate-700">{selectedRecord.program}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Quit Date:</span>
                  <span className="text-slate-800 font-semibold">{selectedRecord.quitDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Recorded Reason:</span>
                  <span className="text-slate-700">{selectedRecord.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice Amount:</span>
                  <span className="font-bold font-mono text-slate-900">{formatCurrency(selectedRecord.invoiceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Collected Amount:</span>
                  <span className="font-bold font-mono text-emerald-600">{formatCurrency(selectedRecord.collectionAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Retention Status:</span>
                  <Badge
                    className={`text-[10px] font-semibold ${
                      selectedRecord.conversionStatus === 'converted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedRecord.conversionStatus === 'converted' ? 'Retained / Converted' : 'Active Quit'}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleToggleConversion(selectedRecord.id);
                  setSelectedRecord(null);
                }}
                className={`text-xs ${
                  selectedRecord.conversionStatus === 'converted'
                    ? 'bg-slate-800 hover:bg-slate-900 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedRecord.conversionStatus === 'converted' ? 'Revert to Active Quit' : 'Mark as Retained'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
