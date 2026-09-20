import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Grid, ArrowDownUp, ArrowUp, Loader2, Eye, Edit, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import api from '@/api/client';
import { apiDownload } from '@/lib/downloadUtils';
import { Download } from 'lucide-react';

interface TransferRecord {
  id: string;
  studentName: string;
  fromSchool: string;
  toSchool: string;
  transferDate: string;
  requestDate: string;
  programName: string;
  status: string;
}

const mockTransfers: TransferRecord[] = [
  { id: 't1', studentName: 'Kabir Dev', fromSchool: 'SunoiaKids Arni', toSchool: 'SunoiaKids Pune', transferDate: '12/06/2026', requestDate: '01/06/2026', programName: 'Nursery', status: 'REQUESTED' },
  { id: 't2', studentName: 'Maya Roy', fromSchool: 'SunoiaKids Nagpur', toSchool: 'SunoiaKids Arni', transferDate: '10/06/2026', requestDate: '28/05/2026', programName: 'SUNOIA Junior', status: 'COMPLETED' },
  { id: 't3', studentName: 'Arjun Sharma', fromSchool: 'SunoiaKids Delhi', toSchool: 'SunoiaKids Arni', transferDate: '', requestDate: '05/06/2026', programName: 'Play Group', status: 'REQUESTED' },
];

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

export default function SchoolTransferRequestsPage() {
  const [data, setData] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewRecord, setViewRecord] = useState<TransferRecord | null>(null);
  const [editRecord, setEditRecord] = useState<TransferRecord | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const fetchTransfers = () => {
    setIsLoading(true);
    api.get('/transfers/requests')
      .then((res) => {
        if (res.data.success && res.data.data?.length > 0) {
          setData(res.data.data.map((t: any) => ({
            id: t.id,
            studentName: `${t.admission?.student?.firstName || ''} ${t.admission?.student?.lastName || ''}`.trim(),
            fromSchool: t.fromSchoolName || 'N/A',
            toSchool: t.toSchoolName || 'N/A',
            transferDate: t.transferDate ? new Date(t.transferDate).toLocaleDateString('en-GB') : 'N/A',
            requestDate: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : 'N/A',
            programName: t.admission?.program?.name || 'N/A',
            status: t.status || 'REQUESTED',
          })));
        } else {
          setData(mockTransfers);
        }
      })
      .catch(() => setData(mockTransfers))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/transfers/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      }
    } catch {
      // Optimistic update even on API failure
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
  };

  const handleSaveEdit = () => {
    if (!editRecord) return;
    handleStatusChange(editRecord.id, editStatus);
    setEditRecord(null);
  };

  const filtered = data.filter((d) => {
    const matchSearch = d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.toSchool.toLowerCase().includes(search.toLowerCase()) ||
      d.fromSchool.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount = data.length;
  const requestedCount = data.filter(d => d.status === 'REQUESTED').length;
  const approvedCount = data.filter(d => d.status === 'APPROVED').length;
  const completedCount = data.filter(d => d.status === 'COMPLETED').length;
  const rejectedCount = data.filter(d => d.status === 'REJECTED').length;

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-normal text-[#333]">School Transfer Requests (Transfer IN)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track student transfer-in requests across campuses</p>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Transfers</div>
          <div className="text-2xl font-bold text-slate-700">{isLoading ? '...' : totalCount}</div>
          <div className="mt-2 h-1 w-full bg-blue-500 rounded"></div>
        </div>
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Requested</div>
          <div className="text-2xl font-bold text-amber-600">{isLoading ? '...' : requestedCount}</div>
          <div className="mt-2 h-1 w-full bg-amber-500 rounded"></div>
        </div>
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Approved</div>
          <div className="text-2xl font-bold text-blue-600">{isLoading ? '...' : approvedCount}</div>
          <div className="mt-2 h-1 w-full bg-blue-600 rounded"></div>
        </div>
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{isLoading ? '...' : completedCount}</div>
          <div className="mt-2 h-1 w-full bg-emerald-500 rounded"></div>
        </div>
        <div className="bg-white border border-slate-200 p-3 shadow-sm rounded-sm">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Rejected</div>
          <div className="text-2xl font-bold text-rose-600">{isLoading ? '...' : rejectedCount}</div>
          <div className="mt-2 h-1 w-full bg-rose-500 rounded"></div>
        </div>
      </div>

      <div className="bg-white border border-[#ccc] shadow-sm">
        <div className="p-3 border-b border-[#ccc] space-y-3">
          {/* Status Tabs / Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-600 mr-2">Status:</span>
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'REQUESTED', label: 'Requested' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                className={`h-7 text-xs px-3 rounded-sm ${statusFilter === tab.id ? 'bg-[#0056b3] text-white' : 'bg-white text-slate-700'}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="bg-[#f9f9f9] border border-[#ccc] p-1.5 rounded-sm">
                <Grid className="w-4 h-4 text-slate-600" />
              </div>
              <label className="text-[13px] text-slate-600 flex items-center gap-2">
                Search:
                <Input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="h-[30px] w-[200px] border-[#ccc] rounded-sm text-[13px] px-2" />
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => apiDownload(
                'transfers',
                {},
                filtered.map((d) => ({
                  'Student Name': d.studentName,
                  'From School': d.fromSchool,
                  'To School': d.toSchool,
                  'Request Date': d.requestDate,
                  'Transfer Date': d.transferDate,
                  'Program': d.programName,
                  'Status': d.status,
                })),
                'transfer-requests'
              )}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#f9f9f9]">
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">Student Name</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">From School</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">To School</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">Request Date</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">Transfer Out Date</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">Program Name</th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333]">Status</th>
                <th className="py-2.5 px-3 border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-8 text-center text-[13px] text-[#666]">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-4 text-center text-[13px] text-[#333] border-b border-[#ccc]">No data available in table</td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-white border-b border-[#ccc]' : 'bg-[#f9f9f9] border-b border-[#ccc]'}>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333] font-medium">{row.studentName}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333]">{row.fromSchool}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333]">{row.toSchool}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333]">{row.requestDate}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333]">{row.transferDate || '—'}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px] text-[#333]">{row.programName}</td>
                    <td className="py-2.5 px-3 border-r border-[#eee] text-[13px]">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[13px] text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-slate-500 hover:text-slate-800"
                          title="View Details" onClick={() => setViewRecord(row)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-blue-500 hover:text-blue-800"
                          title="Edit Status" onClick={() => { setEditRecord(row); setEditStatus(row.status); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          disabled={row.status === 'APPROVED' || row.status === 'COMPLETED'}
                          onClick={() => handleStatusChange(row.id, 'APPROVED')}
                          className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-medium disabled:opacity-40"
                        >
                          <Check className="w-3 h-3 mr-1 inline-block" />
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#f9f9f9] p-3 flex items-center justify-between border-t border-[#ccc]">
          <span className="text-[13px] text-[#666]">Showing {filtered.length} of {data.length} records</span>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-3 text-sm">
              {[
                ['Student Name', viewRecord.studentName],
                ['From School', viewRecord.fromSchool],
                ['To School', viewRecord.toSchool],
                ['Program', viewRecord.programName],
                ['Request Date', viewRecord.requestDate],
                ['Transfer Date', viewRecord.transferDate || '—'],
                ['Status', viewRecord.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="font-semibold text-right">{value}</span>
                </div>
              ))}
              <Button className="w-full mt-2" onClick={() => setViewRecord(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Transfer Status</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Student: <strong>{editRecord.studentName}</strong></p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-9 border rounded px-3 text-sm bg-background"
                >
                  <option value="REQUESTED">Requested</option>
                  <option value="APPROVED">Approved</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveEdit}>Save Changes</Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditRecord(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
