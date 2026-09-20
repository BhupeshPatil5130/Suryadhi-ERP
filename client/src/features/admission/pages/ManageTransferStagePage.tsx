import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid, ArrowDownUp, Loader2, Download, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { apiDownload } from '@/lib/downloadUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ManageTransferStagePage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admissions', { 
        params: { 
          status: 'TRANSFERRED_OUT',
          search: search || undefined
        } 
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transfers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [search]);

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      <h1 className="text-[24px] font-normal text-[#333] mb-4">Manage Transfer Stage</h1>
      
      <div className="bg-white border border-[#ccc] shadow-sm">
        
        {/* Table Top Toolbar */}
        <div className="p-3 border-b border-[#ccc] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-[#f9f9f9] border border-[#ccc] p-1.5 rounded-sm">
                <Grid className="w-4 h-4 text-slate-600" />
              </div>
              <label className="text-[13px] text-slate-600 flex items-center gap-2">
                Search:
                <Input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-[30px] w-[200px] border-[#ccc] rounded-sm text-[13px] px-2" 
                />
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[13px] text-slate-600 mr-2">
                Show 
                <Select defaultValue="10">
                  <SelectTrigger className="h-[30px] w-[60px] border-[#ccc] rounded-sm text-[13px] px-2 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                entries
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => apiDownload(
                  'transfers',
                  { status: 'TRANSFERRED_OUT' },
                  data.map((d) => ({
                    'Student Name': `${d.studentFirstName || ''} ${d.studentLastName || ''}`.trim(),
                    'UIN': d.uin,
                    'From School': d.school?.name || 'N/A',
                    'To School': d.transferToSchoolName || 'N/A',
                    'Transfer Date': d.transferDate ? formatDate(d.transferDate) : 'N/A',
                    'Program': d.program?.name || 'N/A',
                    'Status': d.status || 'N/A',
                  })),
                  'manage-transfer-stage'
                )}
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[300px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#f9f9f9]">
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] w-[15%]">
                  <div className="flex items-center justify-between">Student Name <ArrowDownUp className="w-3 h-3 text-[#333]" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[15%]">
                  <div className="flex items-center justify-between">From School <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[15%]">
                  <div className="flex items-center justify-between">To School <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[12%]">
                  <div className="flex items-center justify-between">Transfer Date <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[12%]">
                  <div className="flex items-center justify-between">Program Name <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[12%]">
                  <div className="flex items-center justify-between">Status <ArrowDownUp className="w-3 h-3 text-[#999] opacity-50" /></div>
                </th>
                <th className="py-2.5 px-3 border-r border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[12%]">
                  Request Date
                </th>
                <th className="py-2.5 px-3 border-b border-[#ccc] text-[13px] font-bold text-[#333] text-center w-[13%]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-[13px] text-[#333] border-b border-[#ccc]">
                    No data available in table
                  </td>
                </tr>
              ) : (
                data.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors border-b border-[#ccc]">
                    <td className="py-2 px-3 text-[13px] font-medium text-[#0056b3] border-r border-[#ccc]">
                      {student.studentFirstName} {student.studentLastName}
                      <div className="text-[#999] font-normal text-[11px]">{student.uin}</div>
                    </td>
                    <td className="py-2 px-3 text-[13px] text-[#333] text-center border-r border-[#ccc]">{student.school?.name}</td>
                    <td className="py-2 px-3 text-[13px] text-[#333] text-center border-r border-[#ccc]">{student.transferToSchoolName || 'N/A'}</td>
                    <td className="py-2 px-3 text-[13px] text-[#333] text-center border-r border-[#ccc]">{student.transferDate ? formatDate(student.transferDate) : 'N/A'}</td>
                    <td className="py-2 px-3 text-[13px] text-[#333] text-center border-r border-[#ccc]">{student.program?.name}</td>
                    <td className="py-2 px-3 text-[13px] text-center border-r border-[#ccc]">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-sm whitespace-nowrap">
                        {student.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[13px] text-[#333] text-center border-r border-[#ccc]">
                      {student.createdAt ? formatDate(student.createdAt) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-[13px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 rounded-sm gap-1 bg-white hover:bg-slate-50"
                          onClick={() => setSelectedStudent(student)}
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-[11px] px-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          onClick={async () => {
                            try {
                              await api.put(`/transfers/${student.id}/status`, { status: 'APPROVED' });
                              fetchTransfers();
                            } catch {
                              fetchTransfers();
                            }
                          }}
                          title="Approve Transfer"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 rounded-sm text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={async () => {
                            try {
                              await api.put(`/transfers/${student.id}/status`, { status: 'REJECTED' });
                              fetchTransfers();
                            } catch {
                              fetchTransfers();
                            }
                          }}
                          title="Reject Transfer"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-[#f9f9f9] p-3 flex justify-center">
          <div className="flex border border-[#ccc] rounded-sm overflow-hidden text-[13px]">
            <button className="px-3 py-1.5 text-[#999] bg-[#f9f9f9] border-r border-[#ccc] cursor-not-allowed">First</button>
            <button className="px-3 py-1.5 text-[#999] bg-[#f9f9f9] border-r border-[#ccc] cursor-not-allowed">&larr; Previous</button>
            <button className="px-3 py-1.5 text-[#999] bg-[#f9f9f9] border-r border-[#ccc] cursor-not-allowed">Next &rarr;</button>
            <button className="px-3 py-1.5 text-[#337ab7] bg-white cursor-pointer hover:bg-[#eee]">Last</button>
          </div>
        </div>

      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Stage Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 text-sm">
              {[
                ['Student Name', `${selectedStudent.studentFirstName} ${selectedStudent.studentLastName}`],
                ['UIN', selectedStudent.uin],
                ['From School', selectedStudent.school?.name || 'N/A'],
                ['To School', selectedStudent.transferToSchoolName || 'N/A'],
                ['Transfer Date', selectedStudent.transferDate ? formatDate(selectedStudent.transferDate) : 'N/A'],
                ['Program', selectedStudent.program?.name || 'N/A'],
                ['Batch', selectedStudent.batch?.name || 'N/A'],
                ['Status', selectedStudent.status],
                ['Request Date', selectedStudent.createdAt ? formatDate(selectedStudent.createdAt) : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-2 last:border-0">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="font-semibold text-right">{value}</span>
                </div>
              ))}
              <Button className="w-full mt-2" onClick={() => setSelectedStudent(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
