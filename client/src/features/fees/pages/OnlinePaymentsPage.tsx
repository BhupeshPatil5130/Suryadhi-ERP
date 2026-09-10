import { useState, useEffect, useCallback } from 'react';
import { feesApi } from '../api';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileDown, RefreshCw, ChevronDown, ChevronUp, Loader2, Copy } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface OnlinePayment {
  id: string;
  uin: string;
  studentName: string;
  program: string;
  transactionDate: string;
  merchant: string;
  amount: number;
  orderStatus: string;
  transactionId: string;
  paymentMode: string;
}

function downloadCSV(data: OnlinePayment[], filename: string) {
  const headers = ['UIN', 'Student Name', 'Program Name', 'Transaction Date', 'Merchant', 'Amount', 'Order Status', 'Transaction ID'];
  const rows = data.map((r) => [
    r.uin,
    r.studentName,
    r.program,
    r.transactionDate,
    r.merchant,
    r.amount.toString(),
    r.orderStatus,
    r.transactionId,
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function OnlinePaymentsPage() {
  const [data, setData] = useState<OnlinePayment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Advanced search filters
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = useCallback(async (params: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const res = await feesApi.getOnlinePayments(params);
      if (res.data.success && res.data.data) {
        setData(
          res.data.data.map((r: any) => ({
            id: r.id,
            uin: r.admission?.student?.uin || '-',
            studentName: `${r.admission?.student?.firstName || ''} ${r.admission?.student?.lastName || ''}`.trim(),
            program: r.admission?.program?.name || '-',
            transactionDate: r.receiptDate,
            merchant: r.transactionId
              ? r.paymentMode === 'PAYTM_POS'
                ? 'Paytm'
                : 'HDFC'
              : '-',
            amount: Number(r.amount),
            // ✅ FIX: Map server's isCancelled flag correctly
            orderStatus: r.isCancelled ? 'Cancelled' : 'Success',
            transactionId: r.transactionId || '-',
            paymentMode: r.paymentMode,
          }))
        );
        setTotal(res.data.total || 0);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch online payments', error);
      showToast('Failed to load online payments', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Build params from current filter state and fetch
  const buildParamsAndFetch = useCallback(() => {
    const params: Record<string, string> = {};
    if (paymentGateway !== 'All') params.paymentGateway = paymentGateway;
    if (paymentStatus !== 'All') params.paymentStatus = paymentStatus;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (search) params.search = search;
    fetchData(params);
  }, [paymentGateway, paymentStatus, fromDate, toDate, search, fetchData]);

  // Auto-fetch when filter dropdowns change
  useEffect(() => {
    buildParamsAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentGateway, paymentStatus, fromDate, toDate]);

  const handleSearch = () => buildParamsAndFetch();

  // ✅ FIX: handleClearSearch uses state reset + direct call, not setTimeout stale closure
  const handleClearSearch = () => {
    setPaymentGateway('All');
    setPaymentStatus('All');
    setFromDate('');
    setToDate('');
    setSearch('');
    // Directly call fetchData with empty params since state won't update synchronously
    fetchData({});
  };

  const handleRefreshStatus = () => {
    buildParamsAndFetch();
    showToast('Payment status refreshed', 'info');
  };

  const handleCopyTransactionId = (txId: string) => {
    if (txId === '-') return;
    navigator.clipboard.writeText(txId).then(() => {
      showToast('Transaction ID copied to clipboard', 'success');
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r) => r.id)));
  };

  // Client-side filter for instant UX on text search
  const filtered = search
    ? data.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
          r.uin.toLowerCase().includes(search.toLowerCase()) ||
          r.transactionId.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader title="Online Payment Details" description="View and manage all online payment transactions" />

      {/* Advanced Search */}
      <Card>
        <CardContent className="p-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Advanced Search
            </span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Payment Gateway</label>
                  <select
                    className="w-full h-9 border rounded px-3 text-sm bg-background"
                    value={paymentGateway}
                    onChange={(e) => setPaymentGateway(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="HDFC">HDFC Online</option>
                    <option value="PAYTM">Paytm POS</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
                  <select
                    className="w-full h-9 border rounded px-3 text-sm bg-background"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Franchisee</label>
                  <Input value="EK-Yavatmal-Arni" readOnly className="h-9 bg-muted/20" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">From Date</label>
                  <Input type="date" className="h-9" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">To Date</label>
                  <Input type="date" className="h-9" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClearSearch}>Clear Search</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-4">
          {/* Header with buttons */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <Badge variant="outline" className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
              ☑ Online Payment Details
            </Badge>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleRefreshStatus} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button
                onClick={() => downloadCSV(data, 'online_payments.csv')}
                className="bg-blue-700 hover:bg-blue-800 text-white"
                disabled={data.length === 0}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download to Excel
              </Button>
            </div>
          </div>

          {/* Search + pagination */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, UIN, or Txn ID..."
                className="h-8 max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
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

          <p className="text-sm font-medium mb-3 text-muted-foreground">
            Total Records: <strong className="text-foreground">{total}</strong>
          </p>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && paged.every((r) => selected.has(r.id))}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left font-semibold">UIN</th>
                  <th className="p-3 text-left font-semibold">Student Name</th>
                  <th className="p-3 text-center font-semibold">Program</th>
                  <th className="p-3 text-center font-semibold">Transaction Date</th>
                  <th className="p-3 text-center font-semibold">Merchant</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Txn ID</th>
                  <th className="p-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">No data available</td>
                  </tr>
                ) : (
                  paged.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b hover:bg-muted/30 transition-colors ${selected.has(row.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 font-mono text-xs">{row.uin}</td>
                      <td className="p-3 font-medium">{row.studentName}</td>
                      <td className="p-3 text-center">{row.program}</td>
                      <td className="p-3 text-center text-xs">{formatDate(row.transactionDate)}</td>
                      <td className="p-3 text-center">{row.merchant}</td>
                      <td className="p-3 text-right font-mono font-bold text-primary">{formatCurrency(row.amount)}</td>
                      <td className="p-3 text-center">
                        <Badge
                          className={
                            row.orderStatus === 'Success'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }
                        >
                          {row.orderStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          title={row.transactionId !== '-' ? `Copy: ${row.transactionId}` : 'No transaction ID'}
                          onClick={() => handleCopyTransactionId(row.transactionId)}
                          className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded hover:bg-muted transition-colors max-w-[120px] truncate ${row.transactionId === '-' ? 'text-muted-foreground cursor-default' : 'text-primary cursor-pointer'}`}
                        >
                          <Copy className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{row.transactionId}</span>
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.open(`/fees/receipts/${row.id}/print`, '_blank')}
                        >
                          View
                        </Button>
                      </td>
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
