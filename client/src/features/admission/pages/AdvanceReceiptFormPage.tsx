import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Search, Plus, Loader2, Receipt } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface AdmissionData {
  studentName: string;
  program: string;
  invoiceNumber: string;
  term1Amount: number;
  term2Amount: number;
  totalAmount: number;
  netAmount: number;
  discountAmount: number;
  amountReceived: number;
  balanceAmount: number;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  uin: string;
  email: string;
  address: string;
  invoiceId: string;
  invoiceStatus: string;
  academicYear: string;
  franchisee: string;
}

interface ReceiptRow {
  id: string;
  receiptDate: string;
  receiptNumber: string;
  bankName: string | null;
  chequeNumber: string | null;
  chequeDate: string | null;
  amount: number;
  paymentMode: string;
}

export default function AdvanceReceiptFormPage() {
  const navigate = useNavigate();
  const { id: admissionId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'main' | 'status' | 'new' | 'other'>('main');
  const [data, setData] = useState<AdmissionData | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!admissionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/fees/receipts/${admissionId}`);
      if (res.data.success) {
        const d = res.data.data;
        const invoice = d.invoices?.[0];
        const amountReceived = d.receipts?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;

        setData({
          studentName: `${d.student?.firstName || ''} ${d.student?.middleName || ''} ${d.student?.lastName || ''}`.trim(),
          program: d.program?.name || 'N/A',
          uin: d.student?.uin || 'N/A',
          invoiceNumber: invoice?.invoiceNumber || 'Not Generated',
          invoiceId: invoice?.id || '',
          invoiceStatus: invoice?.status || 'PENDING',
          term1Amount: Number(invoice?.term1Amount || 0),
          term2Amount: Number(invoice?.term2Amount || 0),
          totalAmount: Number(invoice?.totalAmount || 0),
          discountAmount: Number(invoice?.discountAmount || 0),
          netAmount: Number(invoice?.netAmount || 0),
          amountReceived,
          balanceAmount: Number(invoice?.netAmount || 0) - amountReceived,
          fatherName: d.student?.parent?.fatherName || 'N/A',
          motherName: d.student?.parent?.motherName || 'N/A',
          fatherMobile: d.student?.parent?.fatherMobile || 'N/A',
          motherMobile: d.student?.parent?.motherMobile || 'N/A',
          email: d.student?.parent?.fatherEmail || d.student?.parent?.motherEmail || 'N/A',
          address: d.student?.address || 'N/A',
          academicYear: d.academicYear?.label || 'N/A',
          franchisee: d.school?.name || 'N/A',


        });

        setReceipts((d.receipts || []).map((r: any) => ({
          id: r.id,
          receiptDate: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-GB') : 'N/A',
          receiptNumber: r.receiptNumber,
          bankName: r.bankName,
          chequeNumber: r.chequeNumber,
          chequeDate: r.chequeDate ? new Date(r.chequeDate).toLocaleDateString('en-GB') : null,
          amount: Number(r.amount),
          paymentMode: r.paymentMode,
        })));
      }
    } catch (err: any) {
      console.error('Failed to fetch admission receipt data', err);
      showToast('Could not load receipt data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [admissionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-slate-500">Loading receipt data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p>Could not load admission data.</p>
        <Button onClick={() => navigate(-1)} className="mt-4 bg-slate-600 text-white rounded-sm h-8 px-4 text-xs">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {activeTab === 'main' && <MainView data={data} receipts={receipts} onNavigate={setActiveTab} onBack={() => navigate('/admission')} />}
      {activeTab === 'status' && <PaymentStatusView data={data} receipts={receipts} onBack={() => setActiveTab('main')} />}
      {activeTab === 'new' && <NewReceiptView data={data} admissionId={admissionId!} onBack={() => { setActiveTab('main'); fetchData(); }} />}
      {activeTab === 'other' && <OtherReceiptView data={data} admissionId={admissionId!} onBack={() => { setActiveTab('main'); fetchData(); }} />}
    </div>
  );
}

// ─── 1. MAIN VIEW ─────────────────────────────────────────────────────────
function MainView({ data, receipts, onNavigate, onBack }: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  onNavigate: (tab: any) => void;
  onBack: () => void;
}) {
  return (
    <>
      <h1 className="text-2xl font-normal text-slate-800 mb-4">View Receipt</h1>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">

        {/* Header grey bar */}
        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm flex items-center">
          <span className="font-semibold text-[13px] text-slate-700">≡ View Receipts</span>
        </div>

        <div className="border border-slate-300 p-6 space-y-8">

          {/* Summary Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6">
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Student Name</span>
              <span className="text-slate-800 font-medium">{data.studentName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Program</span>
              <span className="text-slate-800">{data.program}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Invoice Number</span>
              <span className="text-slate-800 font-mono text-xs">{data.invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Amount Term 1</span>
              <span className="text-slate-800">₹{data.term1Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Amount Term 2</span>
              <span className="text-slate-800">₹{data.term2Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div></div>

            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Total Amount</span>
              <span className="text-slate-800 font-semibold">₹{data.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Amount Received</span>
              <span className="text-green-700 font-semibold">₹{data.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Balance Amount</span>
              <span className={`font-semibold ${data.balanceAmount > 0 ? 'text-red-600' : 'text-green-700'}`}>
                ₹{data.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Invoice Status */}
          {data.invoiceNumber === 'Not Generated' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[12px] px-4 py-2 rounded">
              ⚠ No invoice has been generated yet for this admission. Please ensure fee structures are seeded in the system.
            </div>
          )}

          {/* Receipts Table Section */}
          <div className="border border-slate-300 rounded-sm">
            <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <span className="font-semibold text-[13px] text-slate-700">Receipts</span>
              <div className="flex gap-1">
                <Button onClick={() => onNavigate('status')} className="bg-[#0056b3] hover:bg-[#004494] text-white h-7 px-3 text-[12px] shadow-none rounded-sm">
                  <Search className="w-3 h-3 mr-1" /> View Payment Status
                </Button>
                <Button onClick={() => onNavigate('new')} className="bg-[#0056b3] hover:bg-[#004494] text-white h-7 px-3 text-[12px] shadow-none rounded-sm">
                  <Plus className="w-3 h-3 mr-1" /> Add Receipt
                </Button>
                <Button onClick={() => onNavigate('other')} className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white h-7 px-3 text-[12px] shadow-none rounded-sm border border-[#eea236]">
                  <Plus className="w-3 h-3 mr-1" /> Add Other Receipt
                </Button>
              </div>
            </div>
            <div className="p-4 bg-[#f9f9f9]">
              <table className="w-full border-collapse border border-slate-300 text-[13px]">
                <thead>
                  <tr className="bg-[#f2f2f2]">
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Receipt Date</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Receipt Number</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Payment Mode</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Bank Name</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Cheque Number</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Cheque Date</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-500 bg-white border border-slate-300">
                        No receipts recorded yet
                      </td>
                    </tr>
                  ) : (
                    receipts.map((r) => (
                      <tr key={r.id} className="bg-white hover:bg-slate-50">
                        <td className="border border-slate-300 p-2">{r.receiptDate}</td>
                        <td className="border border-slate-300 p-2 font-mono text-xs">{r.receiptNumber}</td>
                        <td className="border border-slate-300 p-2 capitalize">{r.paymentMode?.toLowerCase()}</td>
                        <td className="border border-slate-300 p-2">{r.bankName || '—'}</td>
                        <td className="border border-slate-300 p-2">{r.chequeNumber || '—'}</td>
                        <td className="border border-slate-300 p-2">{r.chequeDate || '—'}</td>
                        <td className="border border-slate-300 p-2 text-right font-semibold">₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="bg-[#f2f2f2] px-6 py-4 border border-slate-300 border-t-0 rounded-b-sm">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm">
            Back
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── 2. PAYMENT STATUS VIEW ────────────────────────────────────────────────
function PaymentStatusView({ data, receipts, onBack }: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  onBack: () => void;
}) {
  return (
    <>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300">
          <span className="font-semibold text-[13px] text-slate-700">≡ Parent Payment Status</span>
        </div>

        <div className="p-4">
          <h3 className="text-[11px] font-bold text-slate-800 mb-2 uppercase">Student details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 mb-6 text-[12px]">
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Student Name</span>
              <span className="text-slate-800 font-medium">{data.studentName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">UIN</span>
              <span className="text-slate-800 font-medium font-mono text-xs">{data.uin}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Father Name</span>
              <span className="text-slate-800 font-medium">{data.fatherName}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Mother Name</span>
              <span className="text-slate-800 font-medium">{data.motherName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Mobile (Father)</span>
              <span className="text-slate-800 font-medium">{data.fatherMobile}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Mobile (Mother)</span>
              <span className="text-slate-800 font-medium">{data.motherMobile}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Program</span>
              <span className="text-slate-800 font-medium">{data.program}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Academic Year</span>
              <span className="text-slate-800 font-medium">{data.academicYear}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">School</span>
              <span className="text-slate-800 font-medium">{data.franchisee}</span>
            </div>
          </div>

          <h3 className="text-[11px] font-bold text-slate-800 mb-2 uppercase">Student Payment details</h3>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Invoice</div>
              <div className="text-[16px] font-bold text-blue-700 mt-1">₹{data.netAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Amount Received</div>
              <div className="text-[16px] font-bold text-green-700 mt-1">₹{data.amountReceived.toLocaleString('en-IN')}</div>
            </div>
            <div className={`border rounded p-3 text-center ${data.balanceAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Balance Due</div>
              <div className={`text-[16px] font-bold mt-1 ${data.balanceAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                ₹{data.balanceAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Receipts Table */}
          <table className="w-full text-center text-[12px] border border-slate-300">
            <thead className="bg-[#f2f2f2]">
              <tr>
                <th className="p-2 border border-slate-300 font-semibold">Receipt Date</th>
                <th className="p-2 border border-slate-300 font-semibold">Receipt No.</th>
                <th className="p-2 border border-slate-300 font-semibold">Payment Mode</th>
                <th className="p-2 border border-slate-300 font-semibold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">No receipts recorded yet</td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300">{r.receiptDate}</td>
                    <td className="p-2 border border-slate-300 font-mono text-xs">{r.receiptNumber}</td>
                    <td className="p-2 border border-slate-300 capitalize">{r.paymentMode?.toLowerCase()}</td>
                    <td className="p-2 border border-slate-300 font-semibold">₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#f2f2f2] px-6 py-4 border-t border-slate-300 rounded-b-sm">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm">
            Back
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── 3. NEW RECEIPT VIEW ──────────────────────────────────────────────────
function NewReceiptView({ data, admissionId, onBack }: {
  data: AdmissionData;
  admissionId: string;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [term, setTerm] = useState('term1');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !confirmAmount) {
      showToast('Please enter and confirm the receipt amount', 'error');
      return;
    }
    if (amount !== confirmAmount) {
      showToast('Receipt amount and confirm amount do not match', 'error');
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/fees/receipts', {
        admissionId,
        invoiceId: data.invoiceId || undefined,
        amount: Number(amount),
        receiptDate,
        paymentMode,
        bankName: bankName || undefined,
        branchName: branchName || undefined,
        chequeNumber: chequeNumber || undefined,
        chequeDate: chequeDate || undefined,
        transactionId: transactionId || undefined,
        transferReference: transferReference || undefined,
        term: term === 'term1' ? 'Term 1' : 'Term 2',
      });
      showToast('Receipt added successfully!', 'success');
      onBack();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to add receipt. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-normal text-slate-800 mb-4">New Receipt</h1>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">

        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm">
          <span className="font-semibold text-[13px] text-slate-700">≡ Add Receipt</span>
        </div>

        <div className="border border-slate-300 p-6 space-y-6">

          {/* Student info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 text-[13px]">
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Student Name</span>
              <span className="text-slate-800 font-medium">{data.studentName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Program</span>
              <span className="text-slate-800 font-medium">{data.program}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Invoice No.</span>
              <span className="text-slate-800 font-medium font-mono text-xs">{data.invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Total Amount</span>
              <span className="text-slate-800 font-semibold">₹{data.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Amount Received</span>
              <span className="text-green-700 font-semibold">₹{data.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Balance Amount</span>
              <span className={`font-semibold ${data.balanceAmount > 0 ? 'text-red-600' : 'text-green-700'}`}>
                ₹{data.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Enter Receipt Amount *</span>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-[13px] border-slate-300 rounded-sm"
                placeholder="₹ 0.00"
              />
            </div>
            <div className="grid grid-cols-[160px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4">Confirm Receipt Amount *</span>
              <Input
                type="number"
                min="0"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                className="h-8 text-[13px] border-slate-300 rounded-sm"
                placeholder="₹ 0.00"
              />
            </div>
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-1">
              <span className="text-[12px] font-semibold text-slate-700">Receipt Date *</span>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="h-8 text-[13px] border-slate-300 rounded-sm w-[200px]"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[12px] font-semibold text-slate-700">Mode of Payment *</span>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-full bg-white">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="NEFT">NEFT / Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cheque fields: Bank Name, Branch Name, Cheque Number, Cheque Date */}
            {(paymentMode === 'CHEQUE') && (
              <>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Bank Name *</span>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm" placeholder="Bank name" />
                </div>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Branch Name *</span>
                  <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm" placeholder="Branch name" />
                </div>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Cheque Number</span>
                  <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm" placeholder="Cheque number" />
                </div>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Cheque Date</span>
                  <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm w-[200px]" />
                </div>
              </>
            )}

            {/* Online Transfer fields: Transaction ID, Reference */}
            {(paymentMode === 'ONLINE' || paymentMode === 'UPI' || paymentMode === 'NEFT') && (
              <>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Transaction ID / UTR Number *</span>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm" placeholder="Enter Transaction ID" />
                </div>
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-700">Payment Reference</span>
                  <Input value={transferReference} onChange={(e) => setTransferReference(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm" placeholder="Reference number" />
                </div>
              </>
            )}

            {/* Academic Term selector */}
            <div className="space-y-1 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">Select Academic Term *</span>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-[200px] bg-white">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white h-8 px-4 text-[13px] shadow-none rounded-sm font-semibold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Generate Receipt
            </Button>
            <Button onClick={onBack} className="bg-[#d9534f] hover:bg-[#c9302c] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold">
              Cancel
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── 4. OTHER RECEIPT VIEW ────────────────────────────────────────────────
function OtherReceiptView({ data, admissionId, onBack }: {
  data: AdmissionData;
  admissionId: string;
  onBack: () => void;
}) {
  const feeTypes = [
    "Admission Form",
    "Cheque Bounce Charge",
    "Transfer Charges",
    "Transport Fees",
    "Winter Uniform",
    "Events and Celebrations Fees"
  ];

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [confirmAmounts, setConfirmAmounts] = useState<Record<string, string>>({});
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [term, setTerm] = useState('term1');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const entries = feeTypes.filter((ft) => amounts[ft] && Number(amounts[ft]) > 0);
    if (entries.length === 0) {
      showToast('Please enter at least one receipt amount', 'error');
      return;
    }
    const mismatch = entries.find((ft) => amounts[ft] !== confirmAmounts[ft]);
    if (mismatch) {
      showToast(`Amount mismatch for "${mismatch}". Please confirm all amounts.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      for (const ft of entries) {
        await api.post('/fees/receipts', {
          admissionId,
          invoiceId: data.invoiceId || undefined,
          amount: Number(amounts[ft]),
          receiptDate,
          paymentMode,
          notes: `${ft} — ${term === 'term1' ? 'Term 1' : 'Term 2'}`,
        });
      }
      showToast('Other receipts added successfully!', 'success');
      onBack();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to add receipts. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-normal text-slate-800 mb-4">Other Receipt</h1>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">

        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm flex items-center gap-1">
          <span className="font-semibold text-[13px] text-slate-700">📝 Other Receipt — {data.studentName}</span>
        </div>

        <div className="border border-slate-300 p-6 space-y-6">

          <table className="w-full text-center text-[12px] border border-slate-300">
            <thead className="bg-[#f2f2f2]">
              <tr>
                <th className="p-3 border-b border-slate-300 font-semibold w-1/3">Fee Types</th>
                <th className="p-3 border-b border-slate-300 font-semibold w-1/3">Receipt Amount</th>
                <th className="p-3 border-b border-slate-300 font-semibold w-1/3">Confirm Receipt Amount</th>
              </tr>
            </thead>
            <tbody>
              {feeTypes.map((fee, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-b border-slate-300 text-slate-700">{fee}</td>
                  <td className="p-2 border-b border-slate-300">
                    <Input
                      type="number"
                      min="0"
                      value={amounts[fee] || ''}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [fee]: e.target.value }))}
                      className="h-7 text-[13px] border-slate-300 rounded-sm w-3/4 mx-auto"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2 border-b border-slate-300">
                    <Input
                      type="number"
                      min="0"
                      value={confirmAmounts[fee] || ''}
                      onChange={(e) => setConfirmAmounts((prev) => ({ ...prev, [fee]: e.target.value }))}
                      className="h-7 text-[13px] border-slate-300 rounded-sm w-3/4 mx-auto"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-slate-300">
            <div className="space-y-1">
              <span className="text-[12px] font-semibold text-slate-700">Receipt Date</span>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="h-8 text-[13px] border-slate-300 rounded-sm w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[12px] font-semibold text-slate-700">Mode of Payment</span>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-full max-w-lg bg-white">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-[12px] font-semibold text-slate-700">Select Academic Term</span>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-[200px] bg-white">
                  <SelectValue placeholder="Select Term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-4 text-[13px] shadow-none rounded-sm font-semibold"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Generate Receipt
            </Button>
            <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold">
              Cancel
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
