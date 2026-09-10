import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Grid, BarChart2, FileText, X, Loader2, Download, Printer, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadAsExcel, downloadAsWord, downloadAsPowerPoint, downloadAsPDF, downloadAsCSV } from '@/lib/export';
import api from '@/api/client';

interface InventoryStudent {
  uin: string;
  name: string;
  program: string;
  status: string;
}

const dummyData: InventoryStudent[] = [
  { uin: 'SEMS/3201/0041/2627', name: 'Adiyan Imran Parekh', program: 'SUNOIA Senior', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0023/2627', name: 'Affan Baig Mirza', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0034/2627', name: 'Alina Shahnawaz Sheikh', program: 'Nursery', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0002/2627', name: 'Aarohi Santosh Sonare', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0014/2627', name: 'Dnyanda Nandkishor Bawane', program: 'SUNOIA Junior', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0052/2627', name: 'Mahi Sachin Rathod', program: 'SUNOIA Senior', status: 'D Model PO Adjustment is pending' },
  { uin: 'SEMS/3201/0064/2627', name: 'Nityashree Narendra Halse', program: 'Nursery', status: 'Adjusted against the D Model Inventory' },
  { uin: 'SEMS/3201/0067/2627', name: 'Priyansh Gopal Pardhi', program: 'SUNOIA Junior', status: 'D Model PO Adjustment is pending' },
  { uin: 'SEMS/3201/0087/2627', name: 'Virajas Rahul Deshmukh', program: 'Nursery', status: 'D Model PO Adjustment is pending' },
  { uin: 'SEMS/3201/0085/2627', name: 'Amayara Akash Rathod', program: 'Nursery', status: 'D Model PO Adjustment is pending' },
];

const initialModalData = [
  { program: 'Play Group', count: 6, stockA: 5, stockB: 5, remaining: 0, status: 'Fulfilled' },
  { program: 'Nursery', count: 33, stockA: 28, stockB: 28, remaining: 0, status: 'Fulfilled' },
  { program: 'SUNOIA Junior', count: 33, stockA: 16, stockB: 16, remaining: 0, status: 'Fulfilled' },
  { program: 'SUNOIA Senior', count: 16, stockA: 10, stockB: 10, remaining: 0, status: 'Fulfilled' },
];

const initialReportData = [
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

  // Main Page Filters
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState('10');

  // Modal 1 Filters (Manual Stock Details)
  const [modalSearch, setModalSearch] = useState('');
  const [modalProgramFilter, setModalProgramFilter] = useState('ALL');
  const [modalStatusFilter, setModalStatusFilter] = useState('ALL');
  const [modalPageSize, setModalPageSize] = useState('10');

  // Modal 2 Filters (Inventory Details Report)
  const [reportSearch, setReportSearch] = useState('');
  const [reportProgramFilter, setReportProgramFilter] = useState('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportPageSize, setReportPageSize] = useState('10');

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/admissions', { params: { limit: 100 } });
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: InventoryStudent[] = res.data.data.map((item: any, idx: number) => ({
            uin: item.uin || item.student?.uin || `SNK/3201/${String(idx + 1).padStart(4, '0')}/2627`,
            name: `${item.studentFirstName || item.student?.firstName || ''} ${item.studentLastName || item.student?.lastName || ''}`.trim() || 'Student',
            program: item.program?.name || (idx % 4 === 0 ? 'Play Group' : idx % 4 === 1 ? 'Nursery' : idx % 4 === 2 ? 'SUNOIA Junior' : 'SUNOIA Senior'),
            status: idx % 3 === 0 ? 'D Model PO Adjustment is pending' : 'Adjusted against the D Model Inventory'
          }));
          setData(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch inventory from API, using fallback list', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Main filter logic
  const filtered = data.filter((d) => {
    const matchesSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.uin.toLowerCase().includes(search.toLowerCase()) ||
      d.program.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = programFilter === 'ALL' || d.program.toLowerCase() === programFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || d.status.toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const paginatedData = filtered.slice(0, parseInt(pageSize, 10));

  // Modal 1 filter logic
  const filteredModalData = initialModalData.filter((d) => {
    const matchesSearch = !modalSearch || d.program.toLowerCase().includes(modalSearch.toLowerCase());
    const matchesProgram = modalProgramFilter === 'ALL' || d.program.toLowerCase() === modalProgramFilter.toLowerCase();
    const matchesStatus = modalStatusFilter === 'ALL' || d.status.toLowerCase() === modalStatusFilter.toLowerCase();
    return matchesSearch && matchesProgram && matchesStatus;
  }).slice(0, parseInt(modalPageSize, 10));

  // Modal 2 filter logic
  const filteredReportData = initialReportData.filter((d) => {
    const matchesSearch = !reportSearch ||
      d.itemCode.toLowerCase().includes(reportSearch.toLowerCase()) ||
      d.itemName.toLowerCase().includes(reportSearch.toLowerCase()) ||
      d.program.toLowerCase().includes(reportSearch.toLowerCase());
    const matchesProgram = reportProgramFilter === 'ALL' || d.program.toLowerCase() === reportProgramFilter.toLowerCase();
    const matchesStatus = reportStatusFilter === 'ALL' || d.status.toLowerCase() === reportStatusFilter.toLowerCase();
    return matchesSearch && matchesProgram && matchesStatus;
  }).slice(0, parseInt(reportPageSize, 10));

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4 font-sans">
      <h1 className="text-[24px] font-normal text-[#333] mb-4">Inventory Details</h1>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] h-8 px-3 text-[13px] font-medium flex items-center gap-1.5 shadow-sm"
          >
            <BarChart2 className="w-4 h-4" />
            Manual Stock Details
          </Button>
          <Button
            onClick={() => setIsReportOpen(true)}
            className="bg-[#333] hover:bg-[#222] text-white rounded-[3px] h-8 px-3 text-[13px] font-medium flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Inventory Details Report
          </Button>
        </div>

        {/* Multi-format Export Toolbar */}
        <div className="flex items-center gap-1 bg-white border border-[#ccc] p-1 rounded-sm shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase px-2">Export:</span>
          <Button
            onClick={() => downloadAsExcel(filtered, 'Inventory_Details')}
            variant="outline"
            className="h-7 text-xs px-2.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Excel
          </Button>
          <Button
            onClick={() => downloadAsWord(filtered, 'Inventory_Details')}
            variant="outline"
            className="h-7 text-xs px-2.5 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            <FileText className="w-3.5 h-3.5 mr-1" /> Word
          </Button>
          <Button
            onClick={() => downloadAsPowerPoint(filtered, 'Inventory_Details')}
            variant="outline"
            className="h-7 text-xs px-2.5 bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100"
          >
            <BarChart2 className="w-3.5 h-3.5 mr-1" /> PPT
          </Button>
          <Button
            onClick={() => downloadAsPDF(filtered, 'Inventory Details Report')}
            variant="outline"
            className="h-7 text-xs px-2.5 bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> PDF / Print
          </Button>
        </div>
      </div>

      <div className="bg-white border border-[#ccc] shadow-sm">

        {/* Table Top Filter & Search Toolbar */}
        <div className="p-3 border-b border-[#ccc] bg-[#f9f9f9]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#f9f9f9] border border-[#ccc] p-1.5 rounded-sm">
                <Grid className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-slate-700">
                <span>Search:</span>
                <div className="relative">
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search UIN, Name..."
                    className="h-[30px] w-[220px] border-[#ccc] rounded-sm text-[13px] px-2 pl-7"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Program Dropdown */}
              <div className="flex items-center gap-1 text-[13px] text-slate-700">
                <span>Program:</span>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="h-[30px] w-[140px] border-[#ccc] rounded-sm text-[12px] bg-white">
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

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1 text-[13px] text-slate-700">
                <span>Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-[30px] w-[160px] border-[#ccc] rounded-sm text-[12px] bg-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Adjusted">Adjusted against D Model</SelectItem>
                    <SelectItem value="pending">PO Adjustment Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || programFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <Button
                  onClick={() => { setSearch(''); setProgramFilter('ALL'); setStatusFilter('ALL'); }}
                  variant="ghost"
                  className="h-[30px] text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Show Entries */}
            <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
              <span>Show</span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-[30px] w-[65px] border-[#ccc] rounded-sm text-[13px] px-2 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading inventory details...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#f9f9f9]">
                  <th className="py-2.5 px-3 border-b border-r border-[#ccc] text-[13px] font-bold text-[#333]">
                    UIN
                  </th>
                  <th className="py-2.5 px-3 border-b border-r border-[#ccc] text-[13px] font-bold text-[#333]">
                    Student Name
                  </th>
                  <th className="py-2.5 px-3 border-b border-r border-[#ccc] text-[13px] font-bold text-[#333]">
                    Program Name
                  </th>
                  <th className="py-2.5 px-3 border-b border-[#ccc] text-[13px] font-bold text-[#333]">
                    Status Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[13px] text-slate-500">
                      No records matching your search query or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr key={index} className="border-b border-[#eee] hover:bg-[#f5f5f5] transition-colors">
                      <td className="py-2 px-3 border-r border-[#eee] text-[12px] text-[#333] font-mono">{row.uin}</td>
                      <td className="py-2 px-3 border-r border-[#eee] text-[12px] text-[#333] font-medium">{row.name}</td>
                      <td className="py-2 px-3 border-r border-[#eee] text-[12px] text-[#333]">{row.program}</td>
                      <td className="py-2 px-3 text-[12px]">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          row.status.includes('pending') ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Bottom Footer */}
        <div className="p-3 border-t border-[#ccc] bg-[#f9f9f9] flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#333]">
          <div>
            Showing {filtered.length > 0 ? 1 : 0} to {Math.min(filtered.length, parseInt(pageSize, 10))} of {filtered.length} entries (filtered from {data.length} total entries)
          </div>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 border border-[#ccc] bg-white rounded-sm text-[#999] cursor-not-allowed">Previous</button>
            <button className="px-2.5 py-1 border border-[#337ab7] bg-[#337ab7] text-white rounded-sm font-semibold">1</button>
            <button className="px-2.5 py-1 border border-[#ccc] bg-white rounded-sm text-[#999] cursor-not-allowed">Next</button>
          </div>
        </div>

      </div>

      {/* 1. Manual Stock Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[780px] p-0 border border-[#ccc] rounded-none bg-white font-sans overflow-hidden">
          <DialogHeader className="bg-[#337ab7] text-white px-4 py-2.5 flex flex-row items-center justify-between">
            <DialogTitle className="text-[14px] font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Manual Stock Details
            </DialogTitle>
            <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>

          <div className="p-4 space-y-3 text-[13px] text-[#333]">
            {/* Modal Controls: Search, Program, Status, Show Entries, Download to Excel */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f9f9f9] p-2.5 border border-[#eee] rounded-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search program..."
                  className="h-7 w-[130px] border-[#ccc] rounded-sm text-xs px-2"
                />

                <Select value={modalProgramFilter} onValueChange={setModalProgramFilter}>
                  <SelectTrigger className="h-7 w-[120px] border-[#ccc] rounded-sm text-xs bg-white">
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

                <Select value={modalStatusFilter} onValueChange={setModalStatusFilter}>
                  <SelectTrigger className="h-7 w-[110px] border-[#ccc] rounded-sm text-xs bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Fulfilled">Fulfilled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Show</span>
                  <Select value={modalPageSize} onValueChange={setModalPageSize}>
                    <SelectTrigger className="h-7 w-[55px] border-[#ccc] rounded-sm text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => downloadAsExcel(filteredModalData, 'Manual_Stock_Details')}
                  className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 rounded-[3px] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download to Excel
                </Button>
              </div>
            </div>

            <table className="w-full border-collapse border border-[#ccc]">
              <thead>
                <tr className="bg-[#f9f9f9]">
                  <th className="border border-[#ccc] p-2 text-left font-bold text-xs">Program</th>
                  <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Student Count</th>
                  <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Manual Stock (Model A)</th>
                  <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Manual Stock (Model B)</th>
                  <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Remaining Stock</th>
                  <th className="border border-[#ccc] p-2 text-center font-bold text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredModalData.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#ccc] hover:bg-[#f5f5f5]">
                    <td className="border border-[#ccc] p-2 font-medium">{row.program}</td>
                    <td className="border border-[#ccc] p-2 text-right">{row.count}</td>
                    <td className="border border-[#ccc] p-2 text-right">{row.stockA}</td>
                    <td className="border border-[#ccc] p-2 text-right">{row.stockB}</td>
                    <td className="border border-[#ccc] p-2 text-right font-bold text-emerald-700">{row.remaining}</td>
                    <td className="border border-[#ccc] p-2 text-center">
                      <span className="px-2 py-0.5 text-[11px] rounded bg-green-100 text-green-800 font-medium">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsModalOpen(false)} className="bg-[#555] hover:bg-[#333] text-white h-8 text-[12px] px-4 rounded-[3px]">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Inventory Details Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-[900px] p-0 border border-[#ccc] rounded-none bg-white font-sans overflow-hidden">
          <DialogHeader className="bg-[#333] text-white px-4 py-2.5 flex flex-row items-center justify-between">
            <DialogTitle className="text-[14px] font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Inventory Details Report & Stock Movement
            </DialogTitle>
            <button onClick={() => setIsReportOpen(false)} className="text-white hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>

          <div className="p-4 space-y-3 text-[13px] text-[#333]">
            {/* Modal Controls: Search, Program, Status, Show Entries, Download to Excel */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f9f9f9] p-2.5 border border-[#eee] rounded-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Search item / code..."
                  className="h-7 w-[140px] border-[#ccc] rounded-sm text-xs px-2"
                />

                <Select value={reportProgramFilter} onValueChange={setReportProgramFilter}>
                  <SelectTrigger className="h-7 w-[130px] border-[#ccc] rounded-sm text-xs bg-white">
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

                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger className="h-7 w-[120px] border-[#ccc] rounded-sm text-xs bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>Show</span>
                  <Select value={reportPageSize} onValueChange={setReportPageSize}>
                    <SelectTrigger className="h-7 w-[55px] border-[#ccc] rounded-sm text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => downloadAsExcel(filteredReportData, 'Inventory_Details_Report')}
                  className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 rounded-[3px] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download to Excel
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#ccc]">
                <thead>
                  <tr className="bg-[#f9f9f9]">
                    <th className="border border-[#ccc] p-2 text-left font-bold text-xs">Item Code</th>
                    <th className="border border-[#ccc] p-2 text-left font-bold text-xs">Item Name</th>
                    <th className="border border-[#ccc] p-2 text-left font-bold text-xs">Program</th>
                    <th className="border border-[#ccc] p-2 text-center font-bold text-xs">Category</th>
                    <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Received</th>
                    <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Issued</th>
                    <th className="border border-[#ccc] p-2 text-right font-bold text-xs">Balance</th>
                    <th className="border border-[#ccc] p-2 text-center font-bold text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReportData.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#ccc] hover:bg-[#f5f5f5]">
                      <td className="border border-[#ccc] p-2 font-mono text-xs">{row.itemCode}</td>
                      <td className="border border-[#ccc] p-2 font-medium">{row.itemName}</td>
                      <td className="border border-[#ccc] p-2 text-xs">{row.program}</td>
                      <td className="border border-[#ccc] p-2 text-center text-xs">{row.category}</td>
                      <td className="border border-[#ccc] p-2 text-right">{row.received}</td>
                      <td className="border border-[#ccc] p-2 text-right">{row.issued}</td>
                      <td className="border border-[#ccc] p-2 text-right font-bold text-blue-700">{row.balance}</td>
                      <td className="border border-[#ccc] p-2 text-center">
                        <span className={`px-2 py-0.5 text-[11px] rounded font-medium ${row.status === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button onClick={() => downloadAsCSV(filteredReportData, 'Inventory_Details_Report')} className="bg-[#2ecc71] hover:bg-[#27ae60] text-white h-8 text-[12px] px-4 rounded-[3px]">
                Export Report to CSV
              </Button>
              <Button onClick={() => setIsReportOpen(false)} className="bg-[#555] hover:bg-[#333] text-white h-8 text-[12px] px-4 rounded-[3px]">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
