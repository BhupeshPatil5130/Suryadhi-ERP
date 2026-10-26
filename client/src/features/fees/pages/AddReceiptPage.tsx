import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Search, CreditCard, Layers, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function AddReceiptPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [admission, setAdmission] = useState<any>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  // ── Form state ─────────────────────────────────────────────
  const [amount, setAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceId, setReferenceId] = useState('');
  // Cheque-specific
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  // Other
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get('/admissions', { params: { search: query, limit: 5 } });
      if (res.data.success) {
        setSearchResults(res.data.data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStudent = async (studentData: any) => {
    setAdmission(studentData);
    setSearchQuery(`${studentData.studentFirstName} ${studentData.studentLastName}`);
    setShowDropdown(false);

    setIsLoadingFees(true);
    try {
      const res = await api.get(`/fees/receipts/${studentData.id}`);
      if (res.data.success) {
        setFeeData(res.data.data);
        // ✅ FIX: Guard against negative balance (overpaid)
        const balance = res.data.data.summary.balanceAmount;
        setAmount(balance > 0 ? String(balance) : '0');
      }
    } catch (err) {
      console.error('Failed to load fees', err);
      showToast('Could not load fee information for this student', 'error');
    } finally {
      setIsLoadingFees(false);
    }
  };

  const handleClear = () => {
    setAdmission(null);
    setFeeData(null);
    setAmount('0');
    setSearchQuery('');
    setSearchResults([]);
    setReferenceId('');
    setBankName('');
    setBankBranch('');
    setChequeNumber('');
    setChequeDate('');
    setRemarks('');
    setPaymentMode('ONLINE');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleIssueReceipt = async () => {
    if (!admission || !amount) return;
    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ FIX: paymentDate now included in payload
      const payload: any = {
        admissionId: admission.id,
        amount: parsedAmount,
        paymentMode,
        paymentDate: paymentDate || undefined,
        transactionId: referenceId || undefined,
        remarks: remarks || undefined,
      };

      if (paymentMode === 'CHEQUE') {
        if (!bankName || !chequeNumber) {
          showToast('Bank name and cheque number are required for cheque payments', 'error');
          setIsSubmitting(false);
          return;
        }
        payload.bankName = bankName;
        // ✅ FIX: bankBranch now included
        payload.bankBranch = bankBranch || undefined;
        payload.chequeNumber = chequeNumber;
        payload.chequeDate = chequeDate || undefined;
      }

      const res = await api.post('/fees/receipts', payload);
      // ✅ FIX: Show success toast before navigating
      showToast('Receipt issued successfully!', 'success');
      navigate('/admissions/view-receipt', {
        state: { receipt: res.data.data, student: admission },
      });
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to issue receipt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheque = paymentMode === 'CHEQUE';
  const isNonCash = paymentMode !== 'CASH' && paymentMode !== 'CHEQUE';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Fee Collection Terminal"
        description="Record regular fee payments, issue receipts, and clear dues"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Left Panel: Student Search & Due Summary ── */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-primary/20 bg-primary/5 relative" ref={searchRef}>
            <CardContent className="pt-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Search by Name or UIN..."
                  className="pl-9 h-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 top-16 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((res: any) => (
                    <div
                      key={res.id}
                      className="p-3 border-b border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => selectStudent(res)}
                    >
                      <div className="font-semibold text-sm">{res.studentFirstName} {res.studentLastName}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{res.uin} • {res.program?.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {admission && (
                <div className="pt-4 border-t border-primary/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Student Selected</p>
                  <p className="font-bold text-lg text-foreground mt-1">
                    {admission.studentFirstName} {admission.studentLastName}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">{admission.uin} • {admission.program?.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Dues */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <Layers className="h-4 w-4" />
                Outstanding Dues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingFees ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading dues...
                </div>
              ) : feeData ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span>Total Invoiced</span>
                    <span className="font-mono font-medium">{formatCurrency(feeData.summary.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Total Received</span>
                    <span className="font-mono font-medium text-emerald-600">{formatCurrency(feeData.summary.amountReceived)}</span>
                  </div>
                  <div className="pt-2 border-t border-destructive/20 flex justify-between items-center font-bold">
                    <span>Balance Due</span>
                    <span className={`font-mono ${feeData.summary.balanceAmount > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {feeData.summary.balanceAmount <= 0 ? 'Fully Paid' : formatCurrency(feeData.summary.balanceAmount)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Select a student to view dues</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Panel: Payment Entry ── */}
        <div className="md:col-span-2">
          {/* Quick Receipt Type Selector */}
          <div className="mb-3 bg-muted/30 border border-border rounded-lg px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Quick Mode:</span>
            <Button
              type="button"
              size="sm"
              variant={paymentMode === 'CASH' ? 'default' : 'outline'}
              className="h-7 text-xs px-3"
              onClick={() => setPaymentMode('CASH')}
            >
              1. Cash Receipt
            </Button>
            <Button
              type="button"
              size="sm"
              variant={paymentMode === 'CHEQUE' ? 'default' : 'outline'}
              className="h-7 text-xs px-3"
              onClick={() => setPaymentMode('CHEQUE')}
            >
              2. Cheque Receipt
            </Button>
            <Button
              type="button"
              size="sm"
              variant={paymentMode === 'ONLINE' ? 'default' : 'outline'}
              className="h-7 text-xs px-3"
              onClick={() => setPaymentMode('ONLINE')}
            >
              3. Online Receipt
            </Button>
          </div>

          <Card>
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Entry — Admission Fee Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Payment Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">Payment Date *</label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Mode of Payment */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">Mode of Payment *</label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE">Online Transfer / UPI</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="PAYTM_POS">Card / POS</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Received Amount */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">Received Amount (₹) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-muted-foreground font-semibold">₹</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9 font-mono text-xl h-12 bg-background font-semibold"
                      required
                      disabled={!admission}
                    />
                  </div>
                </div>

                {/* Online / Bank Transfer: Reference ID */}
                {isNonCash && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">Reference / Trxn ID *</label>
                    <Input
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. UPI Ref Number"
                      required
                    />
                  </div>
                )}

                {/* Cheque Fields */}
                {isCheque && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">Bank Name *</label>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" required />
                    </div>
                    {/* ✅ FIX: bankBranch field added */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">Bank Branch</label>
                      <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="e.g. MG Road" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">Cheque Number *</label>
                      <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">Cheque Date</label>
                      <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">Remarks (Optional)</label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any notes regarding this payment..."
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <Button type="button" variant="outline" className="min-w-[100px]" onClick={handleClear}>
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={handleIssueReceipt}
                    disabled={isSubmitting || !admission || parseFloat(amount) <= 0}
                    className="min-w-[180px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Issuing...' : 'Issue Receipt'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
