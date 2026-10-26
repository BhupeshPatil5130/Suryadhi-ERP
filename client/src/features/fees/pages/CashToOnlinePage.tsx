import { useState, useEffect, useCallback } from 'react';
import { feesApi } from '../api';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, ArrowRight, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface CashReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  studentName: string;
  program: string;
  amount: number;
  admissionType: string;
}

type Step = 'select' | 'confirm';

// Server only accepts 'ONLINE' or 'CHEQUE' as newPaymentMode.
// paymentGateway is a separate metadata field.
type PaymentGateway = 'HDFC_ONLINE' | 'PAYTM_POS';

export default function CashToOnlinePage() {
  const [data, setData] = useState<CashReceipt[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>('select');
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('HDFC_ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [month, setMonth] = useState('');

  const fetchCashReceipts = useCallback(async (searchVal?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchVal) params.search = searchVal;
      if (month) params.month = month;
      const res = await feesApi.getCashReceipts(params);
      if (res.data.success && res.data.data) {
        setData(
          res.data.data.map((r: any) => ({
            id: r.id,
            receiptNumber: r.receiptNumber,
            receiptDate: r.receiptDate,
            studentName: `${r.admission?.student?.firstName || ''} ${r.admission?.student?.lastName || ''}`.trim(),
            program: r.admission?.program?.name || '-',
            amount: Number(r.amount),
            admissionType: r.admission?.admissionType || 'Offline',
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch cash receipts', error);
      showToast('Failed to load cash receipts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashReceipts();
  }, [fetchCashReceipts]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCashReceipts(search);
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

  const handleContinue = () => {
    if (selected.size === 0) return;
    setStep('confirm');
  };

  const handleBack = () => setStep('select');

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      await feesApi.convertBulkPayment({
        receiptIds: Array.from(selected),
        // ✅ FIX: Server Zod schema only accepts 'ONLINE' or 'CHEQUE'
        // 'HDFC_ONLINE' / 'PAYTM_POS' were causing 400 errors
        newPaymentMode: 'ONLINE',
        paymentGateway, // stored as metadata / transactionId prefix
      });
      showToast(`${selected.size} receipt(s) converted to online payment successfully`, 'success');
      setSelected(new Set());
      setStep('select');
      fetchCashReceipts();
    } catch (error: any) {
      console.error('Payment conversion failed', error);
      const msg = error?.response?.data?.error || 'Failed to convert receipts. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setMonth('');
    setCurrentPage(1);
    fetchCashReceipts('');
  };

  // ─── Derived ────────────────────────────────────────────────
  const filtered = search
    ? data.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
          r.receiptNumber.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedReceipts = data.filter((r) => selected.has(r.id));
  const totalAmount = selectedReceipts.reduce((sum, r) => sum + r.amount, 0);

  // ─── Step 1: Selection ─────────────────────────────────────
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Convert Cash Receipts To Online"
          description="Select cash receipts to convert to online payment"
        />

        <Card>
          <CardContent className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
                ☑ Convert Cash Receipts To Online
              </Badge>
              <Button
                onClick={handleContinue}
                disabled={selected.size === 0}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue ({selected.size} selected)
              </Button>
            </div>

            {/* Search + page size */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by name or receipt no..."
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
                <label className="text-xs font-medium">Month:</label>
                <Input
                  type="month"
                  className="h-8 w-[150px]"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
                {month && (
                  <Button size="sm" onClick={() => fetchCashReceipts(search)} className="h-8">
                    Filter
                  </Button>
                )}
                <span className="mx-2">|</span>
                Show
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="border rounded px-1 py-0.5 bg-background text-foreground"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                entries
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b">
                    <th className="p-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={paged.length > 0 && paged.every((r) => selected.has(r.id))}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold">Student Name</th>
                    <th className="p-3 text-center font-semibold">Program</th>
                    <th className="p-3 text-center font-semibold">Receipt Number</th>
                    <th className="p-3 text-center font-semibold">Receipt Date</th>
                    <th className="p-3 text-right font-semibold">Amount</th>
                    <th className="p-3 text-center font-semibold">Admission Type</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No cash receipts found
                      </td>
                    </tr>
                  ) : (
                    paged.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${selected.has(row.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleSelect(row.id)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-medium">{row.studentName}</td>
                        <td className="p-3 text-center">{row.program}</td>
                        <td className="p-3 text-center font-mono text-xs">{row.receiptNumber}</td>
                        <td className="p-3 text-center">{formatDate(row.receiptDate)}</td>
                        <td className="p-3 text-right font-mono font-bold text-primary">{formatCurrency(row.amount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">{row.admissionType}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</Button>
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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

            {/* Selected summary */}
            {selected.size > 0 && (
              <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
                  {selected.size} receipt(s) selected
                </span>
                <span className="text-sm font-bold text-teal-900 dark:text-teal-200 font-mono">
                  Total: {formatCurrency(selectedReceipts.reduce((s, r) => s + r.amount, 0))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Step 2: Confirm ───────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Confirm Cash Receipt Details"
        description="Review selected receipts and choose payment method"
      />

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <span className="text-base">≡</span> Payment Details
          </h3>

          {/* Total + Payment Mode */}
          <div className="flex flex-wrap items-start justify-between gap-6 mb-6 bg-muted/20 p-4 rounded-lg border">
            <div>
              <span className="text-sm font-semibold">Total Amount : </span>
              <span className="text-lg font-bold text-primary ml-2">{formatCurrency(totalAmount)}</span>
            </div>
            <div>
              <span className="text-sm font-semibold mb-2 block">Mode of payment :</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentGateway"
                    checked={paymentGateway === 'HDFC_ONLINE'}
                    onChange={() => setPaymentGateway('HDFC_ONLINE')}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">HDFC Online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentGateway"
                    checked={paymentGateway === 'PAYTM_POS'}
                    onChange={() => setPaymentGateway('PAYTM_POS')}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">Paytm POS</span>
                </label>
              </div>
            </div>
          </div>

          {/* Selected receipts table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left font-semibold">Student Name</th>
                  <th className="p-3 text-center font-semibold">Receipt Number</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceipts.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 font-medium">{r.studentName}</td>
                    <td className="p-3 text-center font-mono text-xs">{r.receiptNumber}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-green-50 dark:bg-green-900/20 font-bold">
                  <td className="p-3 text-green-700 dark:text-green-400">Total</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right font-mono text-green-700 dark:text-green-400">{formatCurrency(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handlePayNow} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
            <Button variant="secondary" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
