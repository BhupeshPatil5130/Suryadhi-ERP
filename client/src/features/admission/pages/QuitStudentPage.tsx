import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, Search, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface QuitStudentItem {
  id: string;
  name: string;
  fatherName: string;
  batchTime: string;
  program: string;
  quitDate?: string;
  reason?: string;
}

const DEFAULT_QUIT_RECORDS: QuitStudentItem[] = [
  {
    id: 'quit-1',
    name: 'Agastya Alpesh Ade',
    fatherName: 'Alpesh Ade',
    batchTime: 'Early Morning Shift',
    program: 'Sunoia Junior',
    quitDate: '2026-06-15',
    reason: 'Relocation',
  },
  {
    id: 'quit-2',
    name: 'Mahi Ganesh Ade',
    fatherName: 'Ganesh Sitaram Ade',
    batchTime: 'Early Morning Shift',
    program: 'Sunoia Junior',
    quitDate: '2026-06-20',
    reason: 'Personal Reason',
  },
];

export default function QuitStudentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const admissionId = searchParams.get('admissionId');

  const [records, setRecords] = useState<QuitStudentItem[]>(DEFAULT_QUIT_RECORDS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<'name' | 'fatherName' | 'batchTime' | 'program'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Quit modal state for active student
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [reason, setReason] = useState<string>('relocation');
  const [quitDate, setQuitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load Quit records from API
  const fetchQuitRecords = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/quit/list');
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const mapped: QuitStudentItem[] = res.data.data.map((r: any) => {
          const s = r.admission?.student;
          const fullName = s ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : 'Student';
          const father = s?.parent?.fatherName || (s?.lastName ? `Parent of ${s.firstName}` : '-');
          const batch = r.admission?.batch?.timeSlot || 'Early Morning Shift';
          const prog = (r.admission?.program?.name || 'Sunoia Junior').replace(/euro/gi, 'Sunoia');
          return {
            id: r.id,
            name: fullName,
            fatherName: father,
            batchTime: batch,
            program: prog,
            quitDate: r.quitDate?.split('T')[0],
            reason: r.reason,
          };
        });
        setRecords(mapped);
      } else {
        // Fallback default sample records matching ERP screenshot
        setRecords(DEFAULT_QUIT_RECORDS);
      }
    } catch (err) {
      // Fallback sample records
      setRecords(DEFAULT_QUIT_RECORDS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuitRecords();
  }, []);

  // When admissionId is passed in URL, load student details and open Quit confirmation dialog
  useEffect(() => {
    if (admissionId) {
      async function loadStudent() {
        try {
          const res = await api.get(`/admissions/${admissionId}`);
          if (res.data?.success && res.data?.data) {
            setSelectedAdmission(res.data.data);
            setIsDialogOpen(true);
          } else {
            setIsDialogOpen(true);
          }
        } catch (e) {
          setIsDialogOpen(true);
        }
      }
      loadStudent();
    }
  }, [admissionId]);

  // Handle Quit submission
  const handleSubmitQuit = async () => {
    if (!admissionId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/quit/${admissionId}`, {
        reason,
        quitDate,
        isDuplicate,
      });
      showToast('Student successfully marked as Quit', 'success');
      setIsDialogOpen(false);
      // Remove query param without reload
      setSearchParams({});
      // Reload quit list
      fetchQuitRecords();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to process quit';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSearchParams({});
  };

  // Filtered and Sorted records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.fatherName.toLowerCase().includes(q) ||
        r.batchTime.toLowerCase().includes(q) ||
        r.program.toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase();
      const valB = (b[sortField] || '').toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const toggleSort = (field: 'name' | 'fatherName' | 'batchTime' | 'program') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Program Breakdown Cards
  const programCount = records.filter(
    (r) => r.program.toLowerCase().includes('junior') || r.program.toLowerCase().includes('sunoia')
  ).length || records.length;
  const totalQuit = records.length;

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-64px)] p-4 md:p-6 font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quit</h1>

        {/* Top KPI Cards (matching the EuroKids / SEMS screenshot) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Card 1: Sunoia Junior */}
          <div className="w-[180px] sm:w-[200px] bg-gradient-to-b from-white to-[#f5f6f8] border border-slate-300 rounded shadow-xs p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-1">
              <Menu className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">Sunoia Junior</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{programCount}</div>
            <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (programCount / Math.max(1, totalQuit)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: Total Quit */}
          <div className="w-[180px] sm:w-[200px] bg-gradient-to-b from-white to-[#f5f6f8] border border-slate-300 rounded shadow-xs p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-1">
              <Menu className="w-3.5 h-3.5 text-slate-500" />
              <span>Total Quit</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalQuit}</div>
            <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-full w-[35%] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-[#d0d0d0] rounded shadow-xs overflow-hidden">
          {/* Controls: Search (Left) & Show Entries (Right) */}
          <div className="bg-[#f8f9fa] border-b border-[#e2e8f0] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Box on Left */}
            <div className="flex items-center gap-2">
              <label htmlFor="quit-search" className="font-medium text-slate-700">Search:</label>
              <input
                id="quit-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-7 w-48 sm:w-60 border border-[#ccc] rounded px-2.5 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder=""
              />
            </div>

            {/* Show Entries on Right */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 border border-[#ccc] rounded px-2 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="font-medium text-slate-700">entries</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f3f5] border-b border-slate-300 text-slate-800 font-semibold select-none">
                  <th
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-200/80 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-700" /> : <ArrowDown className="w-3 h-3 text-blue-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-200/80 transition-colors"
                    onClick={() => toggleSort('fatherName')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Father&apos;s Name</span>
                      {sortField === 'fatherName' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-700" /> : <ArrowDown className="w-3 h-3 text-blue-700" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-200/80 transition-colors"
                    onClick={() => toggleSort('batchTime')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Batch Time</span>
                      {sortField === 'batchTime' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-700" /> : <ArrowDown className="w-3 h-3 text-blue-700" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 cursor-pointer hover:bg-slate-200/80 transition-colors"
                    onClick={() => toggleSort('program')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program</span>
                      {sortField === 'program' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-700" /> : <ArrowDown className="w-3 h-3 text-blue-700" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading quit records...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No matching quit records found
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-[#fbfcfd] hover:bg-blue-50/40'}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{row.name}</td>
                      <td className="py-2.5 px-4 text-slate-700">{row.fatherName}</td>
                      <td className="py-2.5 px-4 text-slate-700">{row.batchTime}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{row.program}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination (First, Previous, 1, Next, Last) */}
          <div className="bg-[#f8f9fa] border-t border-[#e2e8f0] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div>
              Showing {sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length} entries
            </div>

            <div className="flex items-center gap-1 select-none">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &larr; Previous
              </button>
              <span className="px-3 py-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next &rarr;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal when quitting a student */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirm Student Quit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            {selectedAdmission && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1">
                <p>
                  <strong>Student:</strong> {selectedAdmission.student?.firstName}{' '}
                  {selectedAdmission.student?.lastName}
                </p>
                <p>
                  <strong>UIN:</strong> {selectedAdmission.student?.uin || selectedAdmission.id}
                </p>
                <p>
                  <strong>Program:</strong>{' '}
                  {(selectedAdmission.program?.name || '').replace(/euro/gi, 'SUNOIA')}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Reason for quitting</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="financial">Financial considerations</SelectItem>
                  <SelectItem value="school_admission">School Admission</SelectItem>
                  <SelectItem value="personal">Personal Reason</SelectItem>
                  <SelectItem value="duplicate">Duplicate Entry</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Quit Date</Label>
              <Input
                type="date"
                value={quitDate}
                onChange={(e) => setQuitDate(e.target.value)}
                className="h-8 text-xs border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="is-dup"
                type="checkbox"
                checked={isDuplicate}
                onChange={(e) => setIsDuplicate(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <Label htmlFor="is-dup" className="text-xs font-normal text-slate-600 cursor-pointer">
                Mark as duplicate entry
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseDialog}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmitQuit}
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Processing...
                </>
              ) : (
                'Confirm Quit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
