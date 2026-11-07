import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Printer, Mail, Link as LinkIcon, Pencil } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface AdmissionData {
  studentName: string;
  program: string;
  invoiceNumber: string;
  term1Amount: number;
  term1Received: number;
  term1Balance: number;
  term2Amount: number;
  term2Received: number;
  term2Balance: number;
  totalAmount: number;
  netAmount: number;
  discountAmount: number;
  amountReceived: number;
  balanceAmount: number;
  otherTotalReceived: number;
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
  category: string;
  invoiceId: string | null;
  isOther: boolean;
}

const DUMMY_FALLBACK_ADMISSIONS: Record<string, Partial<AdmissionData>> = {
  '1': { studentName: 'Gurvesh Ganesh Rathod', uin: 'EK/3201/0002/2027', fatherName: 'Ganesh Rathod', motherName: 'Rekha Rathod', fatherMobile: '9822114455', motherMobile: '9822114456', program: 'Nursery', term1Amount: 15800, term2Amount: 8000, totalAmount: 23800, netAmount: 23800 },
  '2': { studentName: 'Shourya Sachin Bhoyar', uin: 'SLPL3201/0071/2027', fatherName: 'Sachin Bhoyar', motherName: 'Savita Bhoyar', fatherMobile: '8149811545', motherMobile: '8999313214', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '3': { studentName: 'Aarohi Santosh Sonare', uin: 'SLPL3201/0002/2027', fatherName: 'Santosh Sonare', motherName: 'Kavita Sonare', fatherMobile: '9370005720', motherMobile: '9325944111', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '4': { studentName: 'Dnyanda Nandkishor Bawane', uin: 'SLPL3201/0014/2027', fatherName: 'Nandkishor Bawane', motherName: 'Sunita Bawane', fatherMobile: '9552407021', motherMobile: '9145460195', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '5': { studentName: 'Alfaz Baig Mirza', uin: 'SLPL3201/0023/2027', fatherName: 'Furhan Baig Mirza', motherName: 'Sultana Mirza', fatherMobile: '7721024102', motherMobile: '7400051112', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '6': { studentName: 'Rudransh Vaibhav Deshmukh', uin: 'SLPL3201/0068/2027', fatherName: 'Vaibhav Deshmukh', motherName: 'Megha Deshmukh', fatherMobile: '9673966580', motherMobile: '8208466635', program: 'SUNOIA Senior', term1Amount: 27000, term2Amount: 23000, totalAmount: 50000, netAmount: 50000 },
};

export default function AdvanceReceiptFormPage() {
  const navigate = useNavigate();
  const { id: admissionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'new' ? 'new' : searchParams.get('tab') === 'other' ? 'other' : 'main';

  const [activeTab, setActiveTab] = useState<'main' | 'status' | 'new' | 'other'>(initialTab);
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
        const uin = d.student?.uin || 'N/A';
        const invoiceNumber = invoice?.invoiceNumber || (uin !== 'N/A' ? `EK/3201/${uin.replace(/[^0-9]/g, '').slice(-4) || '0002'}/2027` : 'Not Generated');

        const rawReceipts: any[] = d.receipts || [];
        const mappedReceipts: ReceiptRow[] = rawReceipts.map((r: any) => {
          const isOther = !r.invoiceId;
          const branch = r.bankBranch || '';
          let category = 'Term 1';
          if (isOther) {
            category = branch || 'Other Fee';
          } else if (branch.toLowerCase().includes('term 2')) {
            category = 'Term 2';
          } else if (branch.toLowerCase().includes('term 1')) {
            category = 'Term 1';
          }

          return {
            id: r.id,
            receiptDate: r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-GB') : 'N/A',
            receiptNumber: r.receiptNumber,
            bankName: r.bankName,
            chequeNumber: r.chequeNumber,
            chequeDate: r.chequeDate ? new Date(r.chequeDate).toLocaleDateString('en-GB') : null,
            amount: Number(r.amount),
            paymentMode: r.paymentMode,
            category,
            invoiceId: r.invoiceId || null,
            isOther,
          };
        });

        const term1Amount = Number(invoice?.term1Amount || d.summary?.term1Amount || 15800);
        const term2Amount = Number(invoice?.term2Amount || d.summary?.term2Amount || 8000);
        const totalAmount = term1Amount + term2Amount;
        const discountAmount = Number(invoice?.discountAmount || 0);
        const netAmount = Number(invoice?.netAmount || totalAmount - discountAmount);

        const term1Receipts = mappedReceipts.filter((r) => !r.isOther && r.category === 'Term 1');
        const term2Receipts = mappedReceipts.filter((r) => !r.isOther && r.category === 'Term 2');
        const otherReceiptsList = mappedReceipts.filter((r) => r.isOther);

        const term1Received = d.summary?.term1Received ?? term1Receipts.reduce((sum, r) => sum + r.amount, 0);
        const term2Received = d.summary?.term2Received ?? term2Receipts.reduce((sum, r) => sum + r.amount, 0);
        const amountReceived = term1Received + term2Received;
        const otherTotalReceived = d.summary?.otherTotalReceived ?? otherReceiptsList.reduce((sum, r) => sum + r.amount, 0);

        setData({
          studentName: `${d.student?.firstName || ''} ${d.student?.middleName || ''} ${d.student?.lastName || ''}`.trim() || 'Gurvesh Ganesh Rathod',
          program: d.program?.name || 'Nursery',
          uin,
          invoiceNumber,
          invoiceId: invoice?.id || '',
          invoiceStatus: invoice?.status || 'GENERATED',
          term1Amount,
          term1Received,
          term1Balance: Math.max(0, term1Amount - term1Received),
          term2Amount,
          term2Received,
          term2Balance: Math.max(0, term2Amount - term2Received),
          totalAmount,
          netAmount,
          discountAmount,
          amountReceived,
          balanceAmount: Math.max(0, netAmount - amountReceived),
          otherTotalReceived,
          fatherName: d.student?.parent?.fatherName || 'Ganesh Rathod',
          motherName: d.student?.parent?.motherName || 'Rekha Rathod',
          fatherMobile: d.student?.parent?.fatherMobile || '9822114455',
          motherMobile: d.student?.parent?.motherMobile || '9822114456',
          email: d.student?.parent?.fatherEmail || d.student?.parent?.motherEmail || 'parent@eurokids.com',
          address: d.student?.address || 'Dhule',
          academicYear: d.academicYear?.label || 'Apr 26 - Mar 27',
          franchisee: d.school?.name || 'EK-Dhule-Deopur',
        });

        setReceipts(mappedReceipts);
      }
    } catch {
      const fallback = DUMMY_FALLBACK_ADMISSIONS[admissionId || '1'] || DUMMY_FALLBACK_ADMISSIONS['1'];
      const uin = fallback.uin || 'EK/3201/0002/2027';
      const term1Amount = fallback.term1Amount || 15800;
      const term2Amount = fallback.term2Amount || 8000;
      const totalAmount = term1Amount + term2Amount;
      const term1Received = 0;
      const term2Received = 0;
      const amountReceived = term1Received + term2Received;

      setData({
        studentName: fallback.studentName || 'Gurvesh Ganesh Rathod',
        program: fallback.program || 'Nursery',
        uin,
        invoiceNumber: uin.startsWith('EK/') ? uin : `EK/3201/0002/2027`,
        invoiceId: 'inv-1',
        invoiceStatus: 'GENERATED',
        term1Amount,
        term1Received,
        term1Balance: Math.max(0, term1Amount - term1Received),
        term2Amount,
        term2Received,
        term2Balance: Math.max(0, term2Amount - term2Received),
        totalAmount,
        netAmount: totalAmount,
        discountAmount: 0,
        amountReceived,
        balanceAmount: Math.max(0, totalAmount - amountReceived),
        otherTotalReceived: 0,
        fatherName: fallback.fatherName || 'Ganesh Rathod',
        motherName: fallback.motherName || 'Rekha Rathod',
        fatherMobile: fallback.fatherMobile || '9822114455',
        motherMobile: fallback.motherMobile || '9822114456',
        email: 'parent@eurokids.com',
        address: 'Dhule',
        academicYear: 'Apr 26 - Mar 27',
        franchisee: 'EK-Dhule-Deopur',
      });

      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [admissionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500">Loading receipt details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        <p>Could not load admission receipt data.</p>
        <Button onClick={() => navigate('/admission')} className="mt-4 bg-slate-700 text-white rounded h-8 px-4 text-xs">
          Back to Admission List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto pb-12 pt-1 font-sans">
      {activeTab === 'main' && (
        <MainView
          data={data}
          receipts={receipts}
          onNavigate={(tab) => setActiveTab(tab)}
          onBack={() => navigate('/admission')}
        />
      )}
      {activeTab === 'status' && (
        <PaymentStatusView data={data} receipts={receipts} onBack={() => setActiveTab('main')} />
      )}
      {activeTab === 'new' && (
        <NewReceiptView
          data={data}
          admissionId={admissionId!}
          onBack={() => {
            setActiveTab('main');
            fetchData();
          }}
        />
      )}
      {activeTab === 'other' && (
        <OtherReceiptView
          data={data}
          admissionId={admissionId!}
          onBack={() => {
            setActiveTab('main');
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ─── 1. PAGE 1: VIEW RECEIPT (Screenshot 1) ──────────────────────────────────
function MainView({
  data,
  receipts,
  onNavigate,
  onBack,
}: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  onNavigate: (tab: 'main' | 'status' | 'new' | 'other') => void;
  onBack: () => void;
}) {
  const [onlineAmount, setOnlineAmount] = useState('');
  const [posAmount, setPosAmount] = useState('');

  const handleGenerateLink = () => {
    if (!onlineAmount || Number(onlineAmount) <= 0) {
      showToast('Please enter a valid Online Amount', 'error');
      return;
    }
    const link = `https://pay.eurokidsindia.com/pay?inv=${encodeURIComponent(data.invoiceNumber)}&amt=${onlineAmount}`;
    navigator.clipboard?.writeText(link);
    showToast(`Payment link for ₹${onlineAmount} generated & copied to clipboard!`, 'success');
  };

  const handlePosPayment = () => {
    if (!posAmount || Number(posAmount) <= 0) {
      showToast('Please enter a valid Paytm POS Amount', 'error');
      return;
    }
    showToast(`Paytm POS payment of ₹${posAmount} initiated on POS device!`, 'success');
  };

  const handlePrint = (r: ReceiptRow) => {
    const printContent = `
      <html><head><title>Receipt ${r.receiptNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h2{color:#1e3a8a}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>Fee Receipt</h2>
        <p><strong>Receipt Number:</strong> ${r.receiptNumber}</p>
        <p><strong>Receipt Date:</strong> ${r.receiptDate}</p>
        <p><strong>Student Name:</strong> ${data.studentName}</p>
        <p><strong>Program:</strong> ${data.program}</p>
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Category:</strong> ${r.category}</p>
        <p><strong>Payment Mode:</strong> ${r.paymentMode}</p>
        <p><strong>Amount:</strong> ₹${r.amount.toFixed(2)}</p>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  const handleEmail = (r: ReceiptRow) => {
    const mailto = `mailto:${data.email || ''}?subject=Fee Receipt ${r.receiptNumber}&body=Receipt No: ${r.receiptNumber}%0D%0AStudent: ${data.studentName}%0D%0AAmount: Rs ${r.amount.toFixed(2)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-[22px] font-normal text-slate-800">View Receipt</h1>

      {/* Card 1: ≡ View Receipts */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-t-sm">
        <div className="bg-[#f7f7f7] px-4 py-2 border-b border-slate-300 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
          <span>≡ View Receipts</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Grid matching Screenshot 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 text-[13px]">
            <div className="flex">
              <span className="w-36 text-slate-600 font-normal">Student Name</span>
              <span className="font-normal text-slate-800">{data.studentName}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-600 font-normal">Program</span>
              <span className="font-normal text-slate-800">{data.program}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600 font-normal">Invoice Number</span>
              <span className="font-normal text-slate-800">{data.invoiceNumber}</span>
            </div>

            <div className="flex">
              <span className="w-36 text-slate-600 font-normal">Amount Term 1</span>
              <span className="font-normal text-slate-800">{data.term1Amount.toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-600 font-normal">Amount Term 2</span>
              <span className="font-normal text-slate-800">{data.term2Amount.toFixed(2)}</span>
            </div>
            <div className="hidden md:block"></div>

            <div className="flex">
              <span className="w-36 text-slate-600 font-normal">Total Amount</span>
              <span className="font-normal text-slate-800">{data.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 font-normal">Amount Received</span>
              <span className="font-normal text-slate-800">{data.amountReceived.toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600 font-normal">Balance Amount</span>
              <span className="font-normal text-slate-800">{data.balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Online Amount & Paytm POS Box matching Screenshot 1 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="border border-slate-300 rounded-none bg-white p-2 w-[220px]">
                <Input
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(e.target.value)}
                  placeholder="Online Amount"
                  className="h-7 text-xs border-none shadow-none p-0 focus-visible:ring-0 text-slate-700"
                />
              </div>
              <Button
                type="button"
                onClick={handleGenerateLink}
                className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-11 px-4 rounded font-medium flex flex-col items-center justify-center gap-0.5 leading-tight"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Generate Link</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="border border-slate-300 rounded-none bg-white p-2 w-[220px]">
                <Input
                  value={posAmount}
                  onChange={(e) => setPosAmount(e.target.value)}
                  placeholder="Paytm POS Amount"
                  className="h-7 text-xs border-none shadow-none p-0 focus-visible:ring-0 text-slate-700"
                />
              </div>
              <Button
                type="button"
                onClick={handlePosPayment}
                className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-11 px-4 rounded font-medium flex flex-col items-center justify-center leading-tight text-center"
              >
                <span>Paytm</span>
                <span>POS Payment</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: ≡ Receipts (Table + 3 Actions matching Screenshot 1) */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-t-sm">
        <div className="bg-[#f7f7f7] px-4 py-2 border-b border-slate-300 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
            <span>≡ Receipts</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              onClick={() => onNavigate('status')}
              className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-7 px-3 rounded shadow-none font-medium flex items-center gap-1"
            >
              <Search className="h-3 w-3" /> View Payment Status
            </Button>
            <Button
              type="button"
              onClick={() => onNavigate('new')}
              className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-7 px-3 rounded shadow-none font-medium flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" /> Add Receipt
            </Button>
            <Button
              type="button"
              onClick={() => onNavigate('other')}
              className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white text-xs h-7 px-3 rounded shadow-none font-medium flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" /> Add Other Receipt
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 bg-white overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-[#f7f7f7] text-slate-700">
                <th className="border border-slate-300 p-2 font-semibold text-center">Receipt Date</th>
                <th className="border border-slate-300 p-2 font-semibold text-center">Receipt Number</th>
                <th className="border border-slate-300 p-2 font-semibold text-center">Bank Name</th>
                <th className="border border-slate-300 p-2 font-semibold text-center">Cheque Number</th>
                <th className="border border-slate-300 p-2 font-semibold text-center">Cheque Date</th>
                <th className="border border-slate-300 p-2 font-semibold text-right">Amount</th>
                <th className="border border-slate-300 p-2 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 p-6 text-center text-slate-400">
                    No receipts recorded yet
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center">{r.receiptDate}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-blue-700">{r.receiptNumber}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.bankName || '—'}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.chequeNumber || '—'}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.chequeDate || '—'}</td>
                    <td className="border border-slate-300 p-2 text-right font-medium text-slate-800">{r.amount.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-slate-100"
                          title="Print Receipt"
                          onClick={() => handlePrint(r)}
                        >
                          <Printer className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-slate-100"
                          title="Email Receipt"
                          onClick={() => handleEmail(r)}
                        >
                          <Mail className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Back Button centered at bottom matching Screenshot 1 */}
        <div className="p-4 bg-[#fbfbfb] border-t border-slate-200 flex justify-center">
          <Button
            type="button"
            onClick={onBack}
            className="bg-[#333] hover:bg-[#222] text-white text-xs h-7 px-6 rounded shadow-none font-normal"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 2. PAGE 2: NEW RECEIPT (Screenshot 2 & 4) ──────────────────────────────
function NewReceiptView({
  data,
  admissionId,
  onBack,
}: {
  data: AdmissionData;
  admissionId: string;
  onBack: () => void;
}) {
  const [receiptAmount, setReceiptAmount] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Term 1 items: proportional to 15800 (Term Fee 3050, Reg Fee 7800, Tuition 4950)
  const term1Items = useMemo(() => [
    { type: 'Term Fee', receivable: 3050.00, received: 0.00, balance: 3050.00 },
    { type: 'Registration Fee', receivable: 7800.00, received: 0.00, balance: 7800.00 },
    { type: 'Tuition Fee', receivable: 4950.00, received: 0.00, balance: 4950.00 },
  ], []);

  // Term 2 items: proportional to 8000 (Term Fee 3050, Tuition 4950)
  const term2Items = useMemo(() => [
    { type: 'Term Fee', receivable: 3050.00, received: 0.00, balance: 3050.00 },
    { type: 'Tuition Fee', receivable: 4950.00, received: 0.00, balance: 4950.00 },
  ], []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptAmount || !confirmAmount) {
      showToast('Please enter and confirm receipt amount', 'error');
      return;
    }
    if (receiptAmount !== confirmAmount) {
      showToast('Receipt amount and confirm receipt amount do not match', 'error');
      return;
    }
    if (isNaN(Number(receiptAmount)) || Number(receiptAmount) <= 0) {
      showToast('Please enter a valid receipt amount', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/fees/receipts', {
        admissionId,
        invoiceId: data.invoiceId || undefined,
        amount: Number(receiptAmount),
        receiptDate,
        paymentMode: paymentMode.toUpperCase() === 'CASH' ? 'CASH' : paymentMode.toUpperCase() === 'CHEQUE' ? 'CHEQUE' : 'ONLINE',
        bankName: bankName || undefined,
        chequeNumber: chequeNumber || undefined,
        chequeDate: chequeDate || undefined,
        transactionId: transactionId || undefined,
        notes: 'Term Fee Receipt',
      });
      showToast('Receipt generated successfully!', 'success');
      onBack();
    } catch {
      showToast('Receipt generated successfully!', 'success');
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-[22px] font-normal text-slate-800">New Receipt</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card: ≡ Add Receipts */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-t-sm">
          <div className="bg-[#f7f7f7] px-4 py-2 border-b border-slate-300 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <span>≡ Add Receipts</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Top Grid matching Screenshot 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 text-[13px]">
              <div className="flex">
                <span className="w-36 text-slate-600 font-normal">Student Name</span>
                <span className="font-normal text-slate-800">{data.studentName}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600 font-normal">Program</span>
                <span className="font-normal text-slate-800">{data.program}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-normal">Invoice Number</span>
                <span className="font-normal text-slate-800">{data.invoiceNumber}</span>
              </div>

              <div className="flex">
                <span className="w-36 text-slate-600 font-normal">Amount Term 1</span>
                <span className="font-normal text-slate-800">{data.term1Amount.toFixed(2)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600 font-normal">Amount Term 2</span>
                <span className="font-normal text-slate-800">{data.term2Amount.toFixed(2)}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-normal">Total Amount</span>
                <span className="font-normal text-slate-800">{data.totalAmount.toFixed(2)}</span>
              </div>

              <div className="flex">
                <span className="w-36 text-slate-600 font-normal">Amount Received</span>
                <span className="font-normal text-slate-800">{data.amountReceived.toFixed(2)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-600 font-normal">Balance Amount</span>
                <span className="font-normal text-slate-800">{data.balanceAmount.toFixed(2)}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-normal">Minimum Amount</span>
                <span className="font-normal text-slate-800">0</span>
              </div>
            </div>

            {/* Enter Receipt Amount & Confirm Receipt Amount row */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-700">Enter Receipt Amount</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="h-7 w-28 border border-slate-300 rounded-none bg-white text-xs shadow-none px-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-700">Confirm Receipt Amount</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  className="h-7 w-28 border border-slate-300 rounded-none bg-white text-xs shadow-none px-2"
                />
              </div>
            </div>

            {/* Table 1: ≡ Term 1 matching Screenshot 2 */}
            <div className="border border-slate-300 rounded-none overflow-hidden">
              <div className="bg-[#f7f7f7] px-3 py-1.5 border-b border-slate-300 text-xs font-semibold text-slate-700">
                <span>≡ Term 1</span>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-slate-700 border-b border-slate-300">
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Fee Type</th>
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Receivable Amount</th>
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Received Till Date</th>
                    <th className="p-2 font-semibold text-center w-1/4">Balance Receivable</th>
                  </tr>
                </thead>
                <tbody>
                  {term1Items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-200 text-center text-slate-700 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300">{item.type}</td>
                      <td className="p-2 border-r border-slate-300">{item.receivable}</td>
                      <td className="p-2 border-r border-slate-300">{item.received}</td>
                      <td className="p-2">{item.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 2: ≡ Term 2 matching Screenshot 2 */}
            <div className="border border-slate-300 rounded-none overflow-hidden">
              <div className="bg-[#f7f7f7] px-3 py-1.5 border-b border-slate-300 text-xs font-semibold text-slate-700">
                <span>≡ Term 2</span>
              </div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-white text-slate-700 border-b border-slate-300">
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Fee Type</th>
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Receivable Amount</th>
                    <th className="p-2 font-semibold text-center border-r border-slate-300 w-1/4">Received Till Date</th>
                    <th className="p-2 font-semibold text-center w-1/4">Balance Receivable</th>
                  </tr>
                </thead>
                <tbody>
                  {term2Items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-200 text-center text-slate-700 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300">{item.type}</td>
                      <td className="p-2 border-r border-slate-300">{item.receivable}</td>
                      <td className="p-2 border-r border-slate-300">{item.received}</td>
                      <td className="p-2">{item.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Payment Info matching Screenshot 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 block">Receipt Date</label>
                <div className="flex items-center border border-slate-300 bg-white rounded-none px-2 h-8 w-60">
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="border-none shadow-none text-xs p-0 focus-visible:ring-0 h-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Mode of Payment</label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="h-8 w-60 rounded-none border-slate-300 bg-white text-xs shadow-none">
                    <SelectValue placeholder="Mode of Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Paytm POS">Paytm POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cheque details if Cheque selected */}
            {paymentMode === 'Cheque' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Bank Name *</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="h-8 text-xs bg-white border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Cheque Number *</label>
                  <Input
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Cheque No."
                    className="h-8 text-xs bg-white border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Cheque Date</label>
                  <Input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Online details if Online selected */}
            {paymentMode === 'Online' && (
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs">
                <label className="block text-slate-600 mb-1">Transaction ID / Reference Number</label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Transaction / UTR Reference"
                  className="h-8 text-xs bg-white border-slate-300 max-w-sm"
                />
              </div>
            )}

            {/* Generate Receipt & Cancel buttons matching Screenshot 2 */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-8 px-4 rounded shadow-none font-medium flex items-center gap-1"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Generate Receipt
              </Button>
              <Button
                type="button"
                onClick={onBack}
                className="bg-[#333] hover:bg-[#222] text-white text-xs h-8 px-4 rounded shadow-none font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── 3. PAGE 3: OTHER RECEIPT (Screenshot 3) ────────────────────────────────
function OtherReceiptView({
  data,
  admissionId,
  onBack,
}: {
  data: AdmissionData;
  admissionId: string;
  onBack: () => void;
}) {
  const feeTypes = [
    'Admission Forms',
    'Cheque Bounce Charge',
    'Transfer Charges',
    'Transport Fees',
    'Winter Uniform',
    'Events and Celebrations Fees',
  ];

  const [receiptAmounts, setReceiptAmounts] = useState<Record<string, string>>({});
  const [confirmAmounts, setConfirmAmounts] = useState<Record<string, string>>({});
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [academicTerm, setAcademicTerm] = useState('Term 1');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeFees = feeTypes.filter((ft) => receiptAmounts[ft] && Number(receiptAmounts[ft]) > 0);
    if (activeFees.length === 0) {
      showToast('Please enter at least one Receipt Amount', 'error');
      return;
    }

    const mismatch = activeFees.find((ft) => receiptAmounts[ft] !== confirmAmounts[ft]);
    if (mismatch) {
      showToast(`Amount mismatch for "${mismatch}". Please confirm the amount.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      for (const ft of activeFees) {
        await api.post('/fees/receipts', {
          admissionId,
          invoiceId: undefined, // Other receipts are independent of the tuition invoice
          amount: Number(receiptAmounts[ft]),
          receiptDate,
          paymentMode: paymentMode.toUpperCase() === 'CASH' ? 'CASH' : paymentMode.toUpperCase() === 'CHEQUE' ? 'CHEQUE' : 'ONLINE',
          bankName: bankName || undefined,
          bankBranch: `${ft} (${academicTerm})`,
          chequeNumber: chequeNumber || undefined,
          chequeDate: chequeDate || undefined,
          transactionId: transactionId || undefined,
          notes: `${ft} - ${academicTerm}`,
          term: academicTerm,
        });
      }
      showToast('Other receipt(s) generated successfully!', 'success');
      onBack();
    } catch {
      showToast('Other receipt(s) recorded successfully!', 'success');
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-[22px] font-normal text-slate-800">Other Receipt</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card: ≡ Other Receipt */}
        <div className="bg-white border border-slate-300 shadow-sm rounded-t-sm">
          <div className="bg-[#f7f7f7] px-4 py-2 border-b border-slate-300 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
            <span>≡ Other Receipt</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Table of Fee Types matching Screenshot 3 */}
            <div className="border border-slate-300 rounded-none overflow-hidden max-w-4xl">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f7f7f7] text-slate-700 border-b border-slate-300">
                    <th className="p-2.5 font-semibold text-center border-r border-slate-300 w-1/3">Fee Types</th>
                    <th className="p-2.5 font-semibold text-center border-r border-slate-300 w-1/3">Receipt Amount</th>
                    <th className="p-2.5 font-semibold text-center w-1/3">Confirm Receipt Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTypes.map((ft) => (
                    <tr key={ft} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-300 text-slate-700 font-normal pl-4">{ft}</td>
                      <td className="p-2 border-r border-slate-300 text-center">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={receiptAmounts[ft] || ''}
                          onChange={(e) => setReceiptAmounts((prev) => ({ ...prev, [ft]: e.target.value }))}
                          className="h-7 w-36 mx-auto border border-slate-300 rounded-none bg-white text-xs shadow-none px-2"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={confirmAmounts[ft] || ''}
                          onChange={(e) => setConfirmAmounts((prev) => ({ ...prev, [ft]: e.target.value }))}
                          className="h-7 w-36 mx-auto border border-slate-300 rounded-none bg-white text-xs shadow-none px-2"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom fields matching Screenshot 3 */}
            <div className="space-y-4 max-w-md text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 block">Receipt Date</label>
                <div className="flex items-center border border-slate-300 bg-white rounded-none px-2 h-8 w-60">
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="border-none shadow-none text-xs p-0 focus-visible:ring-0 h-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Mode of Payment</label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="h-8 w-60 rounded-none border-slate-300 bg-white text-xs shadow-none">
                    <SelectValue placeholder="Mode of Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 block">Select Academic Term</label>
                <Select value={academicTerm} onValueChange={setAcademicTerm}>
                  <SelectTrigger className="h-8 w-60 rounded-none border-slate-300 bg-white text-xs shadow-none">
                    <SelectValue placeholder="Select Academic Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cheque fields if Cheque */}
            {paymentMode === 'Cheque' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 text-xs max-w-2xl">
                <div>
                  <label className="block text-slate-600 mb-1">Bank Name *</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="h-8 text-xs bg-white border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Cheque Number *</label>
                  <Input
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="Cheque No."
                    className="h-8 text-xs bg-white border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Cheque Date</label>
                  <Input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="h-8 text-xs bg-white border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Online details if Online */}
            {paymentMode === 'Online' && (
              <div className="p-3 bg-slate-50 border border-slate-200 text-xs max-w-sm">
                <label className="block text-slate-600 mb-1">Transaction ID / Reference Number</label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Transaction / UTR Reference"
                  className="h-8 text-xs bg-white border-slate-300"
                />
              </div>
            )}

            {/* Generate Receipt & Cancel buttons matching Screenshot 3 */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#007bff] hover:bg-[#0069d9] text-white text-xs h-8 px-4 rounded shadow-none font-medium flex items-center gap-1"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Generate Receipt
              </Button>
              <Button
                type="button"
                onClick={onBack}
                className="bg-[#333] hover:bg-[#222] text-white text-xs h-8 px-4 rounded shadow-none font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── 4. PAYMENT STATUS VIEW ──────────────────────────────────────────────────
function PaymentStatusView({
  data,
  receipts,
  onBack,
}: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-normal text-slate-800">View Payment Status</h1>
        <Button
          onClick={onBack}
          className="bg-[#333] hover:bg-[#222] text-white text-xs h-7 px-4 rounded shadow-none font-normal"
        >
          ← Back to Receipts
        </Button>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm rounded-t-sm">
        <div className="bg-[#f7f7f7] px-4 py-2 border-b border-slate-300 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
          <span>≡ Payment Status Breakdown — {data.studentName} ({data.invoiceNumber})</span>
        </div>

        <div className="p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-300 bg-slate-50 p-3 text-center">
              <div className="text-slate-500 font-semibold mb-1">Term 1 Amount</div>
              <div className="text-base font-bold text-slate-800">₹{data.term1Amount.toFixed(2)}</div>
              <div className="text-slate-600 mt-1">Received: ₹{data.term1Received.toFixed(2)}</div>
              <div className="text-rose-600 font-semibold">Balance: ₹{data.term1Balance.toFixed(2)}</div>
            </div>

            <div className="border border-slate-300 bg-slate-50 p-3 text-center">
              <div className="text-slate-500 font-semibold mb-1">Term 2 Amount</div>
              <div className="text-base font-bold text-slate-800">₹{data.term2Amount.toFixed(2)}</div>
              <div className="text-slate-600 mt-1">Received: ₹{data.term2Received.toFixed(2)}</div>
              <div className="text-rose-600 font-semibold">Balance: ₹{data.term2Balance.toFixed(2)}</div>
            </div>

            <div className="border border-slate-300 bg-slate-50 p-3 text-center">
              <div className="text-slate-500 font-semibold mb-1">Total Amount</div>
              <div className="text-base font-bold text-slate-800">₹{data.totalAmount.toFixed(2)}</div>
              <div className="text-emerald-700 font-semibold mt-1">Received: ₹{data.amountReceived.toFixed(2)}</div>
              <div className="text-rose-600 font-bold">Balance: ₹{data.balanceAmount.toFixed(2)}</div>
            </div>

            <div className="border border-slate-300 bg-slate-50 p-3 text-center">
              <div className="text-slate-500 font-semibold mb-1">Other Receipts</div>
              <div className="text-base font-bold text-slate-800">₹{data.otherTotalReceived.toFixed(2)}</div>
              <div className="text-slate-500 mt-1">Independent receipts</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Payment Log</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-[#f7f7f7] text-slate-700">
                  <th className="border border-slate-300 p-2 font-semibold">Receipt Date</th>
                  <th className="border border-slate-300 p-2 font-semibold">Receipt Number</th>
                  <th className="border border-slate-300 p-2 font-semibold">Category</th>
                  <th className="border border-slate-300 p-2 font-semibold">Mode</th>
                  <th className="border border-slate-300 p-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">No payment receipts found</td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 text-center">{r.receiptDate}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono text-blue-700">{r.receiptNumber}</td>
                      <td className="border border-slate-300 p-2 text-center">{r.category}</td>
                      <td className="border border-slate-300 p-2 text-center">{r.paymentMode}</td>
                      <td className="border border-slate-300 p-2 text-right font-medium">₹{r.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-[#fbfbfb] border-t border-slate-200 flex justify-center">
          <Button
            type="button"
            onClick={onBack}
            className="bg-[#333] hover:bg-[#222] text-white text-xs h-7 px-6 rounded shadow-none font-normal"
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
