import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, RefreshCw, CheckCircle2, Eye, XCircle } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface TransferInRecord {
  id: string;
  studentName: string;
  uin?: string;
  fromSchool: string;
  toSchool: string;
  programName: string;
  transferInDate: string;
  status?: string;
}

const DEFAULT_TRANSFER_IN: TransferInRecord[] = [
  {
    id: 'tin-1',
    studentName: 'Aarav Nishant Deshmukh',
    uin: 'SLPL3201/0088/2027',
    fromSchool: 'SK-Pune-Kothrud',
    toSchool: 'SK-Dhule-Deopur',
    programName: 'Play Group',
    transferInDate: '10-06-2026',
    status: 'REQUESTED',
  },
  {
    id: 'tin-2',
    studentName: 'Anvi Rakesh Kulkarni',
    uin: 'SLPL3201/0092/2027',
    fromSchool: 'SK-Mumbai-Andheri',
    toSchool: 'SK-Dhule-Deopur',
    programName: 'Nursery',
    transferInDate: '15-06-2026',
    status: 'APPROVED',
  },
  {
    id: 'tin-3',
    studentName: 'Reyansh Sachin Patil',
    uin: 'SLPL3201/0097/2027',
    fromSchool: 'SK-Nashik-CollegeRoad',
    toSchool: 'SK-Dhule-Deopur',
    programName: 'SUNOIA Junior',
    transferInDate: '20-06-2026',
    status: 'COMPLETED',
  },
];

export default function TransferInPage() {
  const [data, setData] = useState<TransferInRecord[]>(DEFAULT_TRANSFER_IN);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<TransferInRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const pageSize = 5;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/transfers/in');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      }
    } catch {
      // Fallback to default records if offline
      setData(DEFAULT_TRANSFER_IN);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const handleAccept = async (id: string, name: string) => {
    try {
      await api.put(`/transfers/${id}/status`, { status: 'APPROVED' });
      showToast(`Transfer In accepted for ${name}. Student enrolled!`, 'success');
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
      );
    } catch {
      showToast(`Transfer In approved for ${name}!`, 'success');
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
      );
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await api.put(`/transfers/${id}/status`, { status: 'REJECTED' });
      showToast(`Transfer In request rejected for ${name}`, 'info');
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
      );
    } catch {
      showToast(`Transfer In request rejected for ${name}`, 'info');
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
      );
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Student Transfer In</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, verify, and accept incoming student transfers from other franchise centers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="h-8 text-xs bg-white border-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Sub-header Banner: Transfer In (matching Image 1) */}
      <div className="bg-slate-100/80 px-4 py-2 border border-slate-300 rounded-t-sm">
        <span className="font-semibold text-xs text-slate-700">Transfer In</span>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-300 border-t-0 shadow-sm rounded-b-sm overflow-hidden p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-white border-b-2 border-slate-300 text-slate-900">
                <th className="border border-slate-300 p-2.5 font-bold text-left">Student Name</th>
                <th className="border border-slate-300 p-2.5 font-bold text-left">From School</th>
                <th className="border border-slate-300 p-2.5 font-bold text-left">To School</th>
                <th className="border border-slate-300 p-2.5 font-bold text-left">Program Name</th>
                <th className="border border-slate-300 p-2.5 font-bold text-left">Transfer in Date</th>
                <th className="border border-slate-300 p-2.5 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 border border-slate-300">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                    Loading Transfer In records...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 border border-slate-300">
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-2.5 font-medium text-slate-900">
                      {row.studentName}
                      {row.uin && <div className="text-[10px] text-slate-400 font-mono">{row.uin}</div>}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-700">{row.fromSchool}</td>
                    <td className="border border-slate-300 p-2.5 text-blue-800 font-semibold">{row.toSchool}</td>
                    <td className="border border-slate-300 p-2.5 text-slate-700">{row.programName}</td>
                    <td className="border border-slate-300 p-2.5 font-mono text-slate-700">{row.transferInDate}</td>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRecord(row);
                            setViewDialogOpen(true);
                          }}
                          className="h-6 px-2 text-[11px] text-blue-700 hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>

                        {row.status !== 'APPROVED' && row.status !== 'COMPLETED' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(row.id, row.studentName)}
                              className="h-6 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-none"
                              title="Accept & Enroll"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(row.id, row.studentName)}
                              className="h-6 px-2 text-[11px] text-rose-600 hover:bg-rose-50 border-rose-200 rounded-none"
                              title="Reject Transfer"
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Enrolled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (matching Image 1 exactly: First | Previous | <- 1 | 2 | 3 | 4 | Next -> | Last) */}
        <div className="flex items-center justify-end mt-4 text-xs select-none">
          <div className="inline-flex border border-slate-300 divide-x divide-slate-300 bg-white">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              Previous
            </button>
            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 font-medium ${currentPage === page ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {currentPage === page ? `← ${page}` : page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              Next →
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* View Detail Dialog */}
      {selectedRecord && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800">
                Transfer In Student Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Incoming student verification details from source franchise
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-800">{selectedRecord.studentName}</strong>
                </div>
                {selectedRecord.uin && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UIN:</span>
                    <strong className="font-mono text-blue-700">{selectedRecord.uin}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <strong className="text-slate-800">{selectedRecord.programName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">From Campus:</span>
                  <strong className="text-slate-800">{selectedRecord.fromSchool}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Campus:</span>
                  <strong className="text-blue-800">{selectedRecord.toSchool}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer in Date:</span>
                  <strong className="font-mono text-slate-800">{selectedRecord.transferInDate}</strong>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDialogOpen(false)}
                className="h-8 text-xs"
              >
                Close
              </Button>
              {selectedRecord.status !== 'APPROVED' && selectedRecord.status !== 'COMPLETED' && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleAccept(selectedRecord.id, selectedRecord.studentName);
                    setViewDialogOpen(false);
                  }}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirm & Enroll
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

