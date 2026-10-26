import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Menu, Loader2, Receipt, Info } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

const OTHER_RECEIPT_TYPES = [
  { value: 'Admission Form Fee', label: 'Admission Form Fee' },
  { value: 'Cheque Bounce Charge', label: 'Cheque Bounce Charge' },
  { value: 'Transfer Charges', label: 'Transfer Charges' },
  { value: 'Transport Fees / Winter Uniform', label: 'Transport Fees / Winter Uniform' },
  { value: 'Events and Celebrations Fees', label: 'Events and Celebrations Fees' },
];

export default function AddReceiptPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [programName, setProgramName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');

  const [feeType, setFeeType] = useState('Admission Form Fee');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');

  useEffect(() => {
    const fetchEnquiry = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/enquiries/${id}`);
        if (res.data.success) {
          const eq = res.data.data;
          const s = eq.student;
          const sName = s ? `${s.firstName || ''} ${s.lastName || ''}`.trim() : eq.enquirerName || '';
          setStudentName(sName);
          setProgramName(eq.program?.name || 'Nursery');
          setFatherEmail(eq.enquirerEmail || '');
        }
      } catch (err: any) {
        console.error('Failed to load enquiry data', err);
        showToast('Could not load enquiry details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnquiry();
  }, [id]);

  const studentName = enquiry?.student
    ? `${enquiry.student.firstName} ${enquiry.student.middleName || ''} ${enquiry.student.lastName}`.trim()
    : enquiry?.studentFirstName
    ? `${enquiry.studentFirstName} ${enquiry.studentLastName || ''}`.trim()
    : enquiry?.enquirerName
    ? `Child of ${enquiry.enquirerName}`
    : 'N/A';

  const programName = enquiry?.program?.name || 'N/A';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount) || 0;
    if (amt <= 0) { showToast('Please enter a valid receipt amount', 'error'); return; }

    if (numAmount !== numConfirm) {
      showToast('Receipt Amount and Confirm Receipt Amount must match', 'error');
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      let mode = paymentMode.toUpperCase();
      if (mode !== 'CHEQUE' && mode !== 'ONLINE') mode = 'CASH';

      const payload = {
        amount: amt,
        paymentMode: mode,
        receiptDate: receiptDate || new Date().toISOString().split('T')[0],
        chequeNumber: mode === 'CHEQUE' ? chequeNumber : undefined,
        chequeDate: mode === 'CHEQUE' && chequeDate ? chequeDate : undefined,
        notes: feeType,
      };

      const res = await api.post(`/enquiries/${id}/advance-receipts`, payload);
      if (res.data.success) {
        showToast('Receipt saved successfully!', 'success');
        navigate(`/enquiry/${id}/receipts`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save receipt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-slate-500">Loading enquiry details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-4">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Other Receipt</h1>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span><strong>Other Receipt</strong> — These fees are collected independently and are NOT connected to Admission Fees.</span>
      </div>

      <Card className="border-slate-300 shadow-sm rounded-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-300 py-3 px-4">
          <CardTitle className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Add Other Receipt
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="p-0 bg-[#f9f9f9]">
            <div className="p-6 pb-2">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-[13px] text-slate-800 px-4 py-3 bg-white border border-slate-200 rounded-sm">
                <div className="flex gap-8"><span className="font-normal text-slate-600 w-28">Student Name</span><span className="font-medium">{isLoading ? 'Loading...' : studentName || '—'}</span></div>
                <div className="flex gap-8"><span className="font-normal text-slate-600 w-20">Program</span><span className="font-medium">{isLoading ? 'Loading...' : programName || '—'}</span></div>
              </div>

              {/* Fee Type + Amount Table */}
              <div className="border border-slate-300 rounded-sm bg-white overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f5f5] text-slate-700 font-bold border-b border-slate-300 text-[13px]">
                    <tr>
                      <th className="px-6 py-3 w-1/2 border-r border-slate-200 text-center">Fee Type</th>
                      <th className="px-6 py-3 w-1/2 text-center">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="px-6 py-4 border-r border-slate-200">
                        <Select value={feeType} onValueChange={setFeeType}>
                          <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OTHER_RECEIPT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm"
                          placeholder="0.00"
                          required
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">Receipt Date</Label>
                  <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" required />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">Mode of Payment *</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ONLINE">Online Transfer / UPI</SelectItem>
                      <SelectItem value="PAYTM_POS">PayTM / POS</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer / NEFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMode === 'cheque' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Bank Name *</Label>
                      <Input 
                        type="text" 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter Bank Name"
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Branch Name *</Label>
                      <Input 
                        type="text" 
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Enter Branch Name"
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Cheque Number</Label>
                      <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} placeholder="e.g. 000124" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-full bg-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Cheque Date</Label>
                      <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-full bg-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Transfer Date</Label>
                      <Input 
                        type="date" 
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Payment Reference</Label>
                      <Input 
                        type="text" 
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Enter Reference Number"
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                      />
                    </div>
                    {paymentMode === 'ONLINE' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-normal text-slate-600">UPI ID (optional)</Label>
                        <Input 
                          type="text" 
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. name@upi"
                          className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-normal text-slate-600">Notes / Particulars</Label>
                  <Input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes or reference number"
                    className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#f2f2f2] border-t border-slate-300 p-4 px-12 mt-4 flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold flex items-center gap-1.5">
                {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : 'Save Receipt'}
              </Button>
              <Button type="button" onClick={() => navigate(-1)} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
