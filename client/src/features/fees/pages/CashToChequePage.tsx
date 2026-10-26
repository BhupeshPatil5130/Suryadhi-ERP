import { useState, useEffect, useCallback } from 'react';
import { feesApi } from '../api';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileCheck, X, Loader2 } from 'lucide-react';
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

interface ConvertModalData {
  receiptDate: string;
  receiptAmount: string;
  bankName: string;
  bankBranch: string;
  chequeNumber: string;
  confirmChequeNumber: string;
  chequeDate: string;
}

export default function CashToChequePage() {
  const [data, setData] = useState<CashReceipt[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ConvertModalData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCashReceipts = useCallback(async (searchVal?: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchVal) params.search = searchVal;
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

  const handleSearch = () => fetchCashReceipts(search);
  const handleClearSearch = () => { setSearch(''); fetchCashReceipts(''); };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  // ✅ FIX: Pre-populate modal with totals from all selected receipts
  const handleGenerateCheque = () => {
    if (selected.size === 0) return;
    const selectedTotal = selectedReceipts.reduce((sum, r) => sum + r.amount, 0);
    setModal({
      receiptDate: new Date().toISOString().split('T')[0],
      receiptAmount: selectedTotal.toString(),
      bankName: '',
      bankBranch: '',
      chequeNumber: '',
      confirmChequeNumber: '',
      chequeDate: '',
    });
  };

  const handleSave = async () => {
    if (!modal) return;
    if (!modal.chequeNumber || !modal.bankName) {
      showToast('Bank Name and Cheque Number are required', 'error');
      return;
    }
    if (modal.chequeNumber !== modal.confirmChequeNumber) {
      showToast('Cheque numbers do not match!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // ✅ FIX: Use convertBulkPayment instead of looping single conversions
      await feesApi.convertBulkPayment({
        receiptIds: Array.from(selected),
        newPaymentMode: 'CHEQUE',
        bankName: modal.bankName,
        bankBranch: modal.bankBranch || undefined,
        chequeNumber: modal.chequeNumber,
        chequeDate: modal.chequeDate || undefined,
      });
      // ✅ FIX: Success toast
      showToast(`${selected.size} receipt(s) converted to cheque successfully`, 'success');
      setModal(null);
      setSelected(new Set());
      fetchCashReceipts();
    } catch (error: any) {
      console.error('Conversion failed', error);
      const msg = error?.response?.data?.error || 'Failed to convert receipts. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = search
    ? data.filter(
        (r) =>
          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
          r.receiptNumber.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const selectedReceipts = filtered.filter((r) => selected.has(r.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convert Cash To Cheque"
        description="Select cash receipts and convert their payment mode to cheque"
      />

      <Card>
        <CardContent className="p-4">
          {/* Actions */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Button
              onClick={handleGenerateCheque}
              disabled={selected.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Generate Cheque ({selected.size} selected)
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Month Filter (महिने लावा) */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 text-xs border border-input rounded px-2 bg-background font-medium"
            >
              <option value="ALL">All Months</option>
              {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
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

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left font-semibold">Student Name</th>
                  <th className="p-3 text-center font-semibold">Program</th>
                  <th className="p-3 text-center font-semibold">Month</th>
                  <th className="p-3 text-center font-semibold">Receipt Date</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                  <th className="p-3 text-center font-semibold">Admission Type</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No cash receipts found</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${selected.has(row.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleSelect(row.id)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="rounded" />
                      </td>
                      <td className="p-3 font-medium">{row.studentName}</td>
                      <td className="p-3 text-center">{row.program}</td>
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
        </CardContent>
      </Card>

      {/* ── Convert Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
              <h2 className="text-lg font-bold">Convert Cash To Cheque</h2>
              <Button variant="ghost" size="icon" onClick={() => setModal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Converting <strong>{selected.size}</strong> receipt(s) with total{' '}
                <strong className="text-primary">{formatCurrency(parseFloat(modal.receiptAmount))}</strong>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Receipt Date</label>
                  <Input type="date" value={modal.receiptDate} onChange={(e) => setModal({ ...modal, receiptDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Total Receipt Amount</label>
                  <Input value={formatCurrency(parseFloat(modal.receiptAmount))} readOnly className="bg-muted/20 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-red-500">Bank Name *</label>
                  <Input placeholder="Enter bank name" value={modal.bankName} onChange={(e) => setModal({ ...modal, bankName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Bank Branch</label>
                  <Input placeholder="Enter branch" value={modal.bankBranch} onChange={(e) => setModal({ ...modal, bankBranch: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-red-500">Cheque Number *</label>
                  <Input placeholder="Cheque number" value={modal.chequeNumber} onChange={(e) => setModal({ ...modal, chequeNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-red-500">Confirm Cheque Number *</label>
                  <Input
                    placeholder="Confirm cheque no"
                    value={modal.confirmChequeNumber}
                    onChange={(e) => setModal({ ...modal, confirmChequeNumber: e.target.value })}
                    className={modal.confirmChequeNumber && modal.chequeNumber !== modal.confirmChequeNumber ? 'border-red-500' : ''}
                  />
                  {modal.confirmChequeNumber && modal.chequeNumber !== modal.confirmChequeNumber && (
                    <p className="text-xs text-red-500">Numbers don't match</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Cheque Date</label>
                  <Input type="date" value={modal.chequeDate} onChange={(e) => setModal({ ...modal, chequeDate: e.target.value })} />
                </div>
              </div>

              {/* Selected receipts summary */}
              <div className="mt-4 border rounded-lg overflow-hidden">
                <div className="bg-muted/40 px-3 py-2 text-xs font-semibold">Selected Receipts</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="p-2.5 text-left font-semibold">Student Name</th>
                      <th className="p-2.5 text-center font-semibold">Program</th>
                      <th className="p-2.5 text-center font-semibold">Receipt Date</th>
                      <th className="p-2.5 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipts.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="p-2.5">{r.studentName}</td>
                        <td className="p-2.5 text-center">{r.program}</td>
                        <td className="p-2.5 text-center">{formatDate(r.receiptDate)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
