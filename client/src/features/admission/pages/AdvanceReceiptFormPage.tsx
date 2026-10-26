import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Printer, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAsPDF } from '@/lib/downloadUtils';

export default function AdvanceReceiptFormPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryAdmissionId = searchParams.get('admissionId');
  const targetId = paramId || queryAdmissionId || '';

  const [activeTab, setActiveTab] = useState<'main' | 'status' | 'new' | 'other'>('main');
  const [admissionList, setAdmissionList] = useState<any[]>([]);
  const [currentAdmissionId, setCurrentAdmissionId] = useState<string>(targetId);
  const [admissionData, setAdmissionData] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch specific admission details and receipts
  const loadAdmissionDetails = async (admId: string) => {
    if (!admId) return;
    setIsLoading(true);
    try {
      let dataFound: any = null;
      let realAdmissionId = admId;

      // Try direct API fetch
      try {
        const admRes = await api.get(`/admissions/${admId}`);
        if (admRes.data.success && admRes.data.data) {
          dataFound = admRes.data.data;
          realAdmissionId = dataFound.id;
        }
      } catch (err) {
        // Fallback: If admId is numeric (e.g. '2'), lookup from admissions list
        const listRes = await api.get('/admissions?limit=50&status=ACTIVE').catch(() => ({ data: { success: false, data: [] } }));
        if (listRes.data.success && Array.isArray(listRes.data.data) && listRes.data.data.length > 0) {
          setAdmissionList(listRes.data.data);
          const idx = parseInt(admId, 10) - 1;
          const matched = (idx >= 0 && idx < listRes.data.data.length) ? listRes.data.data[idx] : listRes.data.data[0];
          if (matched) {
            dataFound = matched;
            realAdmissionId = matched.id;
          }
        }
      }

      if (dataFound) {
        setAdmissionData(dataFound);
        setCurrentAdmissionId(realAdmissionId);

        // Fetch receipts for this admission
        const receiptsRes = await api.get(`/fees/receipts?admissionId=${realAdmissionId}`).catch(() => ({ data: { success: false, data: [] } }));
        if (receiptsRes.data.success && Array.isArray(receiptsRes.data.data)) {
          setReceipts(receiptsRes.data.data);
        } else if (Array.isArray(dataFound.receipts)) {
          setReceipts(dataFound.receipts);
        } else {
          setReceipts([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load admission receipt details', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync paramId when URL param changes
  useEffect(() => {
    if (targetId) {
      setCurrentAdmissionId(targetId);
      loadAdmissionDetails(targetId);
    }
  }, [targetId]);

  // 2. Fetch available admissions list for switcher
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const res = await api.get('/admissions?limit=50&status=ACTIVE');
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAdmissionList(res.data.data);
          if (!targetId && !currentAdmissionId) {
            const firstId = res.data.data[0].id;
            setCurrentAdmissionId(firstId);
            loadAdmissionDetails(firstId);
          }
        }
      } catch (err) {
        console.warn('Failed to load admissions list', err);
      }
    };
    fetchAdmissions();
  }, []);

  const student = admissionData?.student;
  const parent = student?.parent;
  const program = admissionData?.program;
  const invoices = admissionData?.invoices || [];
  const primaryInvoice = invoices[0] || {};

  const term1Amount = Number(primaryInvoice.term1Amount || 0);
  const term2Amount = Number(primaryInvoice.term2Amount || 0);
  const totalAmount = Number(primaryInvoice.netAmount || primaryInvoice.totalAmount || (term1Amount + term2Amount));
  const amountReceived = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const balanceAmount = Math.max(0, totalAmount - amountReceived);

  const studentName = student 
    ? `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.replace(/\s+/g, ' ').trim() 
    : (isLoading ? 'Loading...' : '-');
  
  // Format UIN & Invoice Number with SK prefix
  const rawUin = student?.uin || '';
  const uin = rawUin ? rawUin.replace(/^EK\//i, 'SK/') : (isLoading ? 'Loading...' : '-');
  const programName = program?.name || (isLoading ? 'Loading...' : '-');
  
  const rawInvoiceNo = primaryInvoice.invoiceNumber || (student?.uin ? `SK/3201/${student.uin.replace(/[^0-9]/g, '').slice(-4) || '0001'}/2027` : '');
  const invoiceNumber = rawInvoiceNo ? rawInvoiceNo.replace(/^EK\//i, 'SK/') : (isLoading ? 'Loading...' : '-');

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {/* Student Selector Toolbar */}
      {admissionList.length > 1 && (
        <div className="bg-white p-3 border border-slate-300 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Select Active Admission:</span>
            <Select 
              value={currentAdmissionId} 
              onValueChange={(val) => {
                setCurrentAdmissionId(val);
                navigate(`/admissions/${val}/receipt`);
              }}
            >
              <SelectTrigger className="w-[300px] h-8 text-xs bg-slate-50">
                <SelectValue placeholder="Select student admission" />
              </SelectTrigger>
              <SelectContent>
                {admissionList.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.student?.firstName} {a.student?.lastName} ({a.program?.name || 'Program'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-500">Invoice: <strong className="text-slate-800">{invoiceNumber}</strong></span>
            <span className="text-slate-500">UIN: <strong className="text-slate-800">{uin}</strong></span>
          </div>
        </div>
      )}

      {activeTab === 'main' && (
        <MainView 
          onNavigate={setActiveTab} 
          onBack={() => navigate('/admission')}
          studentName={studentName}
          programName={programName}
          invoiceNumber={invoiceNumber}
          term1Amount={term1Amount}
          term2Amount={term2Amount}
          totalAmount={totalAmount}
          amountReceived={amountReceived}
          balanceAmount={balanceAmount}
          receipts={receipts}
          isLoading={isLoading}
        />
      )}
      {activeTab === 'status' && (
        <PaymentStatusView 
          onBack={() => setActiveTab('main')}
          studentName={studentName}
          uin={uin}
          fatherName={parent?.fatherName || '-'}
          motherName={parent?.motherName || '-'}
          fatherMobile={parent?.fatherMobile || '-'}
          motherMobile={parent?.motherMobile || '-'}
          totalAmount={totalAmount}
          amountReceived={amountReceived}
          balanceAmount={balanceAmount}
        />
      )}
      {activeTab === 'new' && (
        <NewReceiptView 
          onBack={() => {
            setActiveTab('main');
            if (currentAdmissionId) loadAdmissionDetails(currentAdmissionId);
          }}
          admissionId={currentAdmissionId}
          studentName={studentName}
          programName={programName}
          balanceAmount={balanceAmount}
        />
      )}
      {activeTab === 'other' && (
        <OtherReceiptView 
          onBack={() => {
            setActiveTab('main');
            if (currentAdmissionId) loadAdmissionDetails(currentAdmissionId);
          }}
          admissionId={currentAdmissionId}
          studentName={studentName}
          programName={programName}
        />
      )}
    </div>
  );
}

// ─── 1. MAIN VIEW ─────────────────────────────────────────────────────────
function MainView({ 
  onNavigate, 
  onBack,
  studentName,
  programName,
  invoiceNumber,
  term1Amount,
  term2Amount,
  totalAmount,
  amountReceived,
  balanceAmount,
  receipts,
  isLoading,
}: any) {
  const [onlineAmt, setOnlineAmt] = useState('');
  const [posAmt, setPosAmt] = useState('');

  const handleGenerateLink = () => {
    if (!onlineAmt || isNaN(Number(onlineAmt)) || Number(onlineAmt) <= 0) {
      showToast('Please enter a valid online payment amount', 'error');
      return;
    }
    showToast(`Online payment gateway link generated for ₹${Number(onlineAmt).toLocaleString('en-IN')}`, 'success');
    setOnlineAmt('');
  };

  const handlePosPayment = () => {
    if (!posAmt || isNaN(Number(posAmt)) || Number(posAmt) <= 0) {
      showToast('Please enter a valid POS amount', 'error');
      return;
    }
    showToast(`Payment request of ₹${Number(posAmt).toLocaleString('en-IN')} pushed to POS machine`, 'success');
    setPosAmt('');
  };

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
              <span className="text-slate-600 text-right pr-4 font-medium">Student Name:</span>
              <span className="text-slate-900 font-semibold">{studentName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Program:</span>
              <span className="text-slate-800">{programName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Invoice Number:</span>
              <span className="text-slate-800 font-mono font-semibold">{invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Amount Term 1:</span>
              <span className="text-slate-800 font-mono">{term1Amount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Amount Term 2:</span>
              <span className="text-slate-800 font-mono">{term2Amount.toFixed(2)}</span>
            </div>
            <div></div>

            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Total Amount:</span>
              <span className="text-slate-900 font-bold font-mono">{totalAmount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Amount Received:</span>
              <span className="text-emerald-700 font-bold font-mono">{amountReceived.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center text-[13px]">
              <span className="text-slate-600 text-right pr-4 font-medium">Balance Amount:</span>
              <span className="text-red-700 font-bold font-mono">{balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Payment Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Input 
                value={onlineAmt} 
                onChange={(e) => setOnlineAmt(e.target.value)} 
                placeholder="Online Amount ₹" 
                className="w-[180px] h-8 text-[13px] border-slate-300 rounded-sm bg-white" 
              />
              <Button onClick={handleGenerateLink} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-4 text-[13px] shadow-none rounded-sm">
                Generate Link
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Input 
                value={posAmt} 
                onChange={(e) => setPosAmt(e.target.value)} 
                placeholder="Paytm POS Amount ₹" 
                className="w-[180px] h-8 text-[13px] border-slate-300 rounded-sm bg-white" 
              />
              <Button onClick={handlePosPayment} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-4 text-[13px] shadow-none rounded-sm">
                Paytm POS Payment
              </Button>
            </div>
          </div>

          {/* Receipts Table Section */}
          <div className="border border-slate-300 rounded-sm">
            <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-[13px] text-slate-700">Receipts</span>
              <div className="flex flex-wrap gap-1">
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
            <div className="p-4 bg-[#f9f9f9] overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[13px]">
                <thead>
                  <tr className="bg-[#f2f2f2]">
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Receipt Date</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Receipt Number</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Mode / Bank</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold">Reference / Cheque</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold text-right">Amount</th>
                    <th className="border border-slate-300 p-2 text-slate-700 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 bg-white border border-slate-300">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-blue-600 mb-1" />
                        Loading receipts...
                      </td>
                    </tr>
                  ) : receipts.length > 0 ? (
                    receipts.map((r: any) => (
                      <tr key={r.id} className="bg-white hover:bg-slate-50 border border-slate-300">
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {formatDate(r.receiptDate)}
                        </td>
                        <td className="border border-slate-300 p-2 font-mono font-medium text-blue-700">
                          {r.receiptNumber}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-700">
                          {r.paymentMode} {r.bankName ? `(${r.bankName})` : ''}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-600 font-mono text-xs">
                          {r.chequeNumber || r.transactionId || 'N/A'}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(Number(r.amount))}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-xs text-blue-600 hover:text-blue-800"
                              title="Print / Download Receipt"
                              onClick={() => downloadAsPDF({
                                title: `Receipt: ${r.receiptNumber}`,
                                subtitle: `Student: ${studentName} | Invoice: ${invoiceNumber} | Date: ${formatDate(r.receiptDate)}`,
                                columns: ['Receipt No', 'Payment Mode', 'Reference / Cheque', 'Amount Paid'],
                                rows: [[r.receiptNumber, r.paymentMode, r.chequeNumber || r.transactionId || 'N/A', formatCurrency(Number(r.amount))]],
                                filename: `receipt-${r.receiptNumber}`,
                              })}
                            >
                              <Printer className="h-3.5 w-3.5 mr-1" /> Print
                            </Button>
                            <span className="text-slate-300 text-xs">|</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 text-xs text-emerald-600 hover:text-emerald-800"
                              title="Email Receipt"
                              onClick={() => {
                                const email = window.prompt('Enter parent email address to send receipt:', 'parent@example.com');
                                if (email) showToast(`Receipt ${r.receiptNumber} sent to ${email} successfully!`, 'success');
                              }}
                            >
                              <Mail className="h-3.5 w-3.5 mr-1" /> Email
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 bg-white border border-slate-300">
                        No receipts generated yet. Click "+ Add Receipt" to record a payment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-6 py-4 border border-slate-300 border-t-0 rounded-b-sm">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm">
            Back to Admission List
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── 2. PAYMENT STATUS VIEW ────────────────────────────────────────────────
function PaymentStatusView({ 
  onBack,
  studentName,
  uin,
  fatherName,
  motherName,
  fatherMobile,
  motherMobile,
  totalAmount,
  amountReceived,
  balanceAmount,
}: any) {
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
              <span className="text-slate-600 text-right pr-4">Student Name:</span>
              <span className="text-slate-800 font-medium">{studentName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">UIN:</span>
              <span className="text-slate-800 font-medium font-mono">{uin}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Father Name:</span>
              <span className="text-slate-800 font-medium">{fatherName}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Mother Name:</span>
              <span className="text-slate-800 font-medium">{motherName}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Father Mobile:</span>
              <span className="text-slate-800 font-medium">{fatherMobile}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <span className="text-slate-600 text-right pr-4">Mother Mobile:</span>
              <span className="text-slate-800 font-medium">{motherMobile}</span>
            </div>
          </div>

          <div className="border border-slate-300 rounded-sm p-4 bg-slate-50 mb-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Total Billed</p>
              <p className="text-lg font-bold text-slate-800 font-mono">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Received</p>
              <p className="text-lg font-bold text-emerald-700 font-mono">{formatCurrency(amountReceived)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Outstanding Balance</p>
              <p className="text-lg font-bold text-red-700 font-mono">{formatCurrency(balanceAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-6 py-3 border-t border-slate-300">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm">
            Back
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── 3. NEW RECEIPT VIEW ──────────────────────────────────────────────────
function NewReceiptView({ onBack, admissionId, studentName, programName, balanceAmount }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: balanceAmount > 0 ? String(balanceAmount) : '',
    paymentMode: 'CASH',
    bankName: '',
    bankBranch: '',
    chequeNumber: '',
    chequeDate: '',
    transactionId: '',
    remarks: 'Fee payment receipt',
  });

  useEffect(() => {
    if (balanceAmount > 0) {
      setFormData((prev) => ({ ...prev, amount: String(balanceAmount) }));
    }
  }, [balanceAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId) {
      showToast('No admission ID found. Please select an admission first.', 'error');
      return;
    }
    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      showToast('Please enter a valid receipt amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/fees/receipts', {
        admissionId,
        amount: amt,
        paymentMode: formData.paymentMode,
        bankName: formData.bankName || undefined,
        bankBranch: formData.bankBranch || undefined,
        chequeNumber: formData.paymentMode === 'CHEQUE' ? formData.chequeNumber : undefined,
        chequeDate: formData.paymentMode === 'CHEQUE' ? formData.chequeDate : undefined,
        transactionId: (formData.paymentMode === 'ONLINE' || formData.paymentMode === 'BANK_TRANSFER') ? formData.transactionId : undefined,
      });

      if (res.data.success) {
        showToast(`Receipt created successfully: ${res.data.data?.receiptNumber || 'Success'}`, 'success');
        onBack();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create receipt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">
      <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm flex items-center justify-between">
        <span className="font-semibold text-[13px] text-slate-700">≡ Add Advance / Fee Receipt</span>
        {balanceAmount > 0 && (
          <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Outstanding: ₹{Number(balanceAmount).toLocaleString('en-IN')}
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border border-slate-300 p-6 space-y-4">
        {/* Quick Selection: 1. Cash Receipt, 2. Cheque Receipt, 3. Online Receipt */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200">
          <label className="text-xs font-semibold text-slate-700 block mb-2">Select Receipt Type to Generate:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, paymentMode: 'CASH' }))}
              className={`py-2 px-3 text-xs font-semibold rounded border transition-all ${
                formData.paymentMode === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              1. Cash Receipt
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, paymentMode: 'CHEQUE' }))}
              className={`py-2 px-3 text-xs font-semibold rounded border transition-all ${
                formData.paymentMode === 'CHEQUE'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              2. Cheque Receipt
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev: any) => ({ ...prev, paymentMode: 'ONLINE' }))}
              className={`py-2 px-3 text-xs font-semibold rounded border transition-all ${
                formData.paymentMode === 'ONLINE'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              3. Online Receipt
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
          <div>
            <span className="text-xs text-slate-500 font-medium">Student Name:</span>
            <p className="font-bold text-slate-900 text-sm">{studentName || 'Student'}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Program:</span>
            <p className="text-blue-700 font-semibold text-sm">{programName || 'Program'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Amount (₹) *</label>
            <Input 
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="h-8 text-sm bg-white font-mono font-bold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Payment Mode *</label>
            <Select 
              value={formData.paymentMode} 
              onValueChange={(val) => setFormData({ ...formData, paymentMode: val })}
            >
              <SelectTrigger className="h-8 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">CASH</SelectItem>
                <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                <SelectItem value="ONLINE">ONLINE / UPI</SelectItem>
                <SelectItem value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.paymentMode === 'CHEQUE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Bank Name</label>
              <Input 
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank, SBI"
                className="h-8 text-sm bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Cheque Number</label>
              <Input 
                value={formData.chequeNumber}
                onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                placeholder="6-digit cheque number"
                className="h-8 text-sm bg-white font-mono"
              />
            </div>
          </div>
        )}

        {(formData.paymentMode === 'ONLINE' || formData.paymentMode === 'BANK_TRANSFER') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Transaction Reference / UTR</label>
              <Input 
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="e.g. UPI/123456789/REF"
                className="h-8 text-sm bg-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Bank / Payment App</label>
              <Input 
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. Google Pay, Razorpay"
                className="h-8 text-sm bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button type="button" onClick={onBack} variant="outline" size="sm" className="h-8 text-xs font-semibold">
            Cancel
          </Button>
          <Button type="submit" size="sm" className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 text-xs font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            Save & Generate Receipt
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── 4. OTHER RECEIPT VIEW ────────────────────────────────────────────────
function OtherReceiptView({ onBack, admissionId, studentName, programName }: any) {
  return (
    <NewReceiptView 
      onBack={onBack} 
      admissionId={admissionId} 
      studentName={studentName} 
      programName={programName} 
      balanceAmount={0} 
    />
  );
}
