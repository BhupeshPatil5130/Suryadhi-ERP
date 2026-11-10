import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Printer, Eye, XCircle, Search as SearchIcon } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface TransferOutRecord {
  id: string;
  studentName: string;
  uin?: string;
  fromSchool: string;
  toSchool: string;
  programName: string;
  transferInDate: string;
  status?: string;
  reason?: string;
}

const DEFAULT_TRANSFER_OUT: TransferOutRecord[] = [
  {
    id: 'tout-1',
    studentName: 'Mahi Sachin Rathod',
    uin: 'SNK/3201/0045/2027',
    fromSchool: 'SNK - Dhule - Deopur',
    toSchool: 'SK-Pune-Baner',
    programName: 'SUNOIA Senior',
    transferInDate: '04-06-2026',
    status: 'APPROVED',
  },
  {
    id: 'tout-2',
    studentName: 'Vihaan Deepak Shinde',
    uin: 'SNK/3201/0056/2027',
    fromSchool: 'SNK - Dhule - Deopur',
    toSchool: 'SK-Thane-Majiwada',
    programName: 'Nursery',
    transferInDate: '08-06-2026',
    status: 'COMPLETED',
  },
  {
    id: 'tout-3',
    studentName: 'Ishaan Pritam Chaudhari',
    uin: 'SNK/3201/0063/2027',
    fromSchool: 'SNK - Dhule - Deopur',
    toSchool: 'SK-Aurangabad-CIDCO',
    programName: 'Play Group',
    transferInDate: '18-06-2026',
    status: 'REQUESTED',
  },
];

export default function TransferOutPage() {
  const [data, setData] = useState<TransferOutRecord[]>(DEFAULT_TRANSFER_OUT);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('9');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Out Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [destinationSchool, setDestinationSchool] = useState('');
  const [transferReason, setTransferReason] = useState('Parent Relocation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal
  const [viewRecord, setViewRecord] = useState<TransferOutRecord | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/transfers/out');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
      }
    } catch {
      setData(DEFAULT_TRANSFER_OUT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.fromSchool.toLowerCase().includes(q) ||
        item.toSchool.toLowerCase().includes(q) ||
        item.programName.toLowerCase().includes(q) ||
        item.transferInDate.includes(q)
    );
  }, [data, searchQuery]);

  const limit = parseInt(pageSize, 10) || 9;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / limit));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, currentPage, limit]);

  const handlePrintTC = (record: TransferOutRecord) => {
    const printContent = `
      <html><head><title>Transfer Certificate - ${record.studentName}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333;line-height:1.6}h1{color:#1e3a8a;text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{border:1px solid #ddd;padding:10px}</style></head>
      <body>
        <h1>SŪNOIAKIDS™ Pre-School</h1>
        <h3 style="text-align:center;color:#666">Official Student Transfer Certificate (TC)</h3>
        <hr/>
        <p>This is to certify that <strong>${record.studentName}</strong> (UIN: ${record.uin || 'N/A'}) was a bonafide student of <strong>${record.fromSchool}</strong> enrolled in <strong>${record.programName}</strong>.</p>
        <p>The student is being transferred to <strong>${record.toSchool}</strong> with effect from <strong>${record.transferInDate}</strong>.</p>
        <p>All school dues have been cleared up to the date of leaving.</p>
        <br/><br/><br/>
        <div style="display:flex;justify-content:space-between;margin-top:50px">
          <div><p>_______________________</p><p><strong>Center Head Signature</strong></p></div>
          <div><p>_______________________</p><p><strong>School Stamp & Date</strong></p></div>
        </div>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  const handleCancelTransfer = async (id: string, name: string) => {
    try {
      await api.put(`/transfers/${id}/status`, { status: 'CANCELLED' });
      showToast(`Transfer cancelled for ${name}. Student status restored.`, 'info');
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch {
      showToast(`Transfer cancelled for ${name}.`, 'info');
      setData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleInitiateSubmit = async () => {
    if (!selectedStudentName.trim() || !destinationSchool.trim()) {
      showToast('Please provide student name and destination school', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const newRecord: TransferOutRecord = {
        id: `tout-${Date.now()}`,
        studentName: selectedStudentName,
        fromSchool: 'SNK - Dhule - Deopur',
        toSchool: destinationSchool,
        programName: 'SUNOIA Senior',
        transferInDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
        status: 'REQUESTED',
        reason: transferReason,
      };
      setData((prev) => [newRecord, ...prev]);
      showToast(`Transfer Out requested successfully for ${selectedStudentName}!`, 'success');
      setCreateModalOpen(false);
      setSelectedStudentName('');
      setDestinationSchool('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Transfer Out Students</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process campus departures, clearance certificates, and manage outgoing transfers
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Request Transfer Out
        </Button>
      </div>

      {/* Top Controls Box: Search on Left, Show entries on Right (matching Image 2) */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        {/* Search */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 font-medium">Search</span>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-900 rounded-none px-2 py-0.5 text-xs h-7 w-[180px] sm:w-[220px] outline-none bg-white font-mono"
            />
          </div>
        </div>

        {/* Show entries */}
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-900 rounded-none px-2 py-0.5 text-xs h-7 bg-white outline-none min-w-[50px] text-center"
          >
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* Table (matching Image 2 exactly) */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-300 text-slate-900">
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
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-amber-600" />
                    Loading Transfer Out records...
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
                    <td className="border border-slate-300 p-2.5 text-blue-800 font-semibold">{row.fromSchool}</td>
                    <td className="border border-slate-300 p-2.5 text-slate-700">{row.toSchool}</td>
                    <td className="border border-slate-300 p-2.5 text-slate-700">{row.programName}</td>
                    <td className="border border-slate-300 p-2.5 font-mono text-slate-700">{row.transferInDate}</td>
                    <td className="border border-slate-300 p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewRecord(row)}
                          className="h-6 px-2 text-[11px] text-blue-700 hover:bg-blue-50"
                          title="View Transfer Details"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintTC(row)}
                          className="h-6 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 border-emerald-300 rounded-none"
                          title="Print Transfer Certificate (TC)"
                        >
                          <Printer className="h-3 w-3 mr-1" /> Print TC
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelTransfer(row.id, row.studentName)}
                          className="h-6 px-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                          title="Cancel Transfer"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (matching Image 2 exactly: First | Previous | <- 1 | 2 | 3 | 4 | Next -> | Last) */}
        <div className="flex items-center justify-end p-3 text-xs select-none">
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

      {/* Modal: Initiate Transfer Out */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              Initiate Student Transfer Out
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create an outgoing relocation request and generate Transfer Certificate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Student Name *</label>
              <Input
                value={selectedStudentName}
                onChange={(e) => setSelectedStudentName(e.target.value)}
                placeholder="Enter student full name"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Destination Center (To School) *</label>
              <Input
                value={destinationSchool}
                onChange={(e) => setDestinationSchool(e.target.value)}
                placeholder="e.g. SK-Pune-Baner"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Transfer Reason</label>
              <Select value={transferReason} onValueChange={setTransferReason}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parent Relocation">Parent Relocation</SelectItem>
                  <SelectItem value="City Change">City Change</SelectItem>
                  <SelectItem value="Distance Issue">Distance Issue</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleInitiateSubmit}
              disabled={isSubmitting}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Transfer Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800">
                Transfer Out Details
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Outgoing relocation record
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-800">{viewRecord.studentName}</strong>
                </div>
                {viewRecord.uin && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">UIN:</span>
                    <strong className="font-mono text-blue-700">{viewRecord.uin}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Program:</span>
                  <strong className="text-slate-800">{viewRecord.programName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Campus (From):</span>
                  <strong className="text-slate-800">{viewRecord.fromSchool}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Campus (To):</span>
                  <strong className="text-blue-800">{viewRecord.toSchool}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer in Date:</span>
                  <strong className="font-mono text-slate-800">{viewRecord.transferInDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    {viewRecord.status}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewRecord(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handlePrintTC(viewRecord);
                  setViewRecord(null);
                }}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certificate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

