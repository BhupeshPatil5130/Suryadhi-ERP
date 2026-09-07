import { useState, useEffect, useCallback } from 'react';
import { feesApi } from '../api';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileDown, Loader2 } from 'lucide-react';

interface HomebuddyReceipt {
  id: string;
  uin: string;
  studentName: string;
  program: string;
  receiptNumber: string;
  amount: number;
  receiptDate: string;
}

function downloadCSV(data: HomebuddyReceipt[], filename: string) {
  const headers = ['Student UIN', 'Student Name', 'Program Name', 'Receipt Number', 'Amount', 'Payment Date'];
  const rows = data.map((r) => [r.uin, r.studentName, r.program, r.receiptNumber, r.amount.toString(), r.receiptDate]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function HomebuddyFeePage() {
  const [data, setData] = useState<HomebuddyReceipt[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async (searchVal?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchVal) params.search = searchVal;
      const res = await feesApi.getHomebuddyReceipts(params);
      if (res.data.success && res.data.data) {
        const mapped = res.data.data.map((r: any) => ({
          id: r.id,
          uin: r.admission?.student?.uin || '-',
          studentName: `${r.admission?.student?.firstName || ''} ${r.admission?.student?.lastName || ''}`.trim(),
          program: r.admission?.program?.name || '-',
          receiptNumber: r.receiptNumber,
          amount: Number(r.amount),
          receiptDate: r.receiptDate,
        }));
        setData(mapped);
        setServerTotal(res.data.total || mapped.length);
      }
    } catch (error) {
      console.error('Failed to fetch homebuddy receipts', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    fetchData('');
  };

  // Client-side filter for instant local refinement
  const filtered = search
    ? data.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
          r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
          r.uin.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Collection through HomeSunny App"
        description="Track payments received through the HomeSunny mobile app"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Receipts (Server)</p>
            <p className="text-2xl font-bold">{serverTotal}</p>
            <div className="w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Amount Collected</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Download button */}
          <div className="mb-4">
            <Button
              className="bg-slate-700 hover:bg-slate-800 text-white"
              onClick={() => downloadCSV(filtered, 'homesunny_payment_report.csv')}
              disabled={filtered.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download HomeSunny Payment Report
            </Button>
          </div>

          {/* Search + page size */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by name, UIN, or receipt no..."
                className="h-8 max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button size="sm" onClick={handleSearch} className="h-8">
                <Search className="h-3.5 w-3.5 mr-1" /> Search
              </Button>
              {search && (
                <Button size="sm" variant="outline" onClick={handleClearSearch} className="h-8">
                  Clear
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Show
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded px-1 py-0.5 bg-background"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              entries
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-3 text-left font-semibold">Student UIN</th>
                  <th className="p-3 text-left font-semibold">Student Name</th>
                  <th className="p-3 text-center font-semibold">Program Name</th>
                  <th className="p-3 text-center font-semibold">Receipt Number</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                  <th className="p-3 text-center font-semibold">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No data available</td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs">{row.uin}</td>
                      <td className="p-3 font-medium">{row.studentName}</td>
                      <td className="p-3 text-center">{row.program}</td>
                      <td className="p-3 text-center font-mono text-xs">{row.receiptNumber}</td>
                      <td className="p-3 text-right font-mono font-bold text-primary">{formatCurrency(row.amount)}</td>
                      <td className="p-3 text-center">{formatDate(row.receiptDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ FIX: Proper pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</Button>
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  return start + i;
                }).filter((p) => p <= totalPages).map((p) => (
                  <Button key={p} variant={currentPage === p ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(p)}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
