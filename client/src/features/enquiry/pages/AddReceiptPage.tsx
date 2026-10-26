import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, Loader2, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface EnquiryData {
  id: string;
  enquirerName: string;
  studentFirstName?: string;
  studentLastName?: string;
  student?: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  program?: {
    name: string;
  };
}

export default function AddReceiptPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState<string>('0');
  const [confirmAmount, setConfirmAmount] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  // Cheque fields
  const [bankName, setBankName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  // Online Transfer fields
  const [transactionId, setTransactionId] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>('');
  const [transferReference, setTransferReference] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');

  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const fetchEnquiry = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/enquiries/${id}`);
        if (res.data.success) {
          setEnquiry(res.data.data);
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
    const numAmount = parseFloat(amount);
    const numConfirm = parseFloat(confirmAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid receipt amount greater than 0', 'error');
      return;
    }

    if (numAmount !== numConfirm) {
      showToast('Receipt Amount and Confirm Receipt Amount must match', 'error');
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        amount: numAmount,
        paymentMode,
        receiptDate,
        ...(bankName && { bankName }),
        ...(branchName && { branchName }),
        ...(chequeNumber && { chequeNumber }),
        ...(chequeDate && { chequeDate }),
        ...(transactionId && { transactionId }),
        ...(transferReference && { transferReference }),
        ...(upiId && { upiId }),
        ...(notes && { notes }),
      };

      const res = await api.post(`/enquiries/${id}/advance-receipts`, payload);
      if (res.data.success) {
        showToast('Advance receipt generated successfully!', 'success');
        navigate(`/enquiry/${id}/receipts`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save advance receipt', 'error');
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-slate-800">Advance Receipt</h1>
        <Button
          onClick={() => navigate(`/enquiry/${id}/receipts`)}
          variant="outline"
          className="h-8 text-xs flex items-center gap-1 border-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Receipts
        </Button>
      </div>

      <Card className="border-slate-300 shadow-sm rounded-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-300 py-3 px-4">
          <CardTitle className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Advance Receipt Form
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 bg-[#f9f9f9]">
          <form onSubmit={handleSave}>
            <div className="p-6 pb-2">
              <div className="grid grid-cols-2 gap-4 mb-8 text-[13px] text-slate-800 px-8">
                <div className="flex gap-12">
                  <span className="font-normal text-slate-600">Student Name</span>
                  <span className="font-medium text-slate-900">{studentName}</span>
                </div>
                <div className="flex gap-6">
                  <span className="font-normal text-slate-600">Program</span>
                  <span className="font-medium text-slate-900">{programName}</span>
                </div>
              </div>

              {/* Fee Table with Receipt Amount & Confirm Receipt Amount */}
              <div className="border border-slate-300 rounded-sm bg-white overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f5f5f5] text-slate-700 font-bold border-b border-slate-300 text-[13px]">
                    <tr>
                      <th className="px-6 py-3 w-1/3 border-r border-slate-200 text-center">Fee Types</th>
                      <th className="px-6 py-3 w-1/3 border-r border-slate-200 text-center">Receipt Amount (₹)</th>
                      <th className="px-6 py-3 w-1/3 text-center">Confirm Receipt Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 bg-white">
                      <td className="px-6 py-4 text-center font-medium text-[13px] text-slate-700 border-r border-slate-200">
                        Advance Admission / Form Fee
                      </td>
                      <td className="px-6 py-3 border-r border-slate-200">
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm max-w-xs mx-auto text-right font-semibold text-emerald-800" 
                          placeholder="Enter Amount"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={confirmAmount}
                          onChange={(e) => setConfirmAmount(e.target.value)}
                          className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm max-w-xs mx-auto text-right font-semibold text-blue-800" 
                          placeholder="Confirm Amount"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">Receipt Date *</Label>
                  <Input 
                    type="date" 
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-normal text-slate-600">Mode of Payment *</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-full bg-white">
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ONLINE">Online Transfer / UPI</SelectItem>
                      <SelectItem value="PAYTM_POS">PayTM / POS</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer / NEFT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cheque Fields: Bank Name, Branch Name, Cheque Number, Cheque Date */}
                {paymentMode === 'CHEQUE' && (
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
                      <Input 
                        type="text" 
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        placeholder="Enter Cheque Number"
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Cheque Date</Label>
                      <Input 
                        type="date" 
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                      />
                    </div>
                  </>
                )}

                {/* Online Transfer Fields: Transaction ID, Reference, UPI ID */}
                {(paymentMode === 'ONLINE' || paymentMode === 'BANK_TRANSFER') && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal text-slate-600">Transaction ID / UTR Number *</Label>
                      <Input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter Transaction ID"
                        className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm block w-full bg-white" 
                        required
                      />
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
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Generate Receipt
              </Button>
              <Button 
                type="button"
                onClick={() => navigate(-1)} 
                className="bg-[#d9534f] hover:bg-[#c9302c] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
