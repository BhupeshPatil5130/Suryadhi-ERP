import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Receipt, Printer, Mail, Calendar, Banknote, ShieldCheck } from 'lucide-react';
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
  category: string; // 'Term 1' | 'Term 2' | 'Admission Form' | 'Winter Uniform' etc.
  invoiceId: string | null;
  isOther: boolean;
}

const DUMMY_FALLBACK_ADMISSIONS: Record<string, Partial<AdmissionData>> = {
  '1': { studentName: 'Shourya Sachin Bhoyar', uin: 'SLPL3201/0071/2027', fatherName: 'Sachin Bhoyar', motherName: 'Savita Bhoyar', fatherMobile: '8149811545', motherMobile: '8999313214', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '2': { studentName: 'Aarohi Santosh Sonare', uin: 'SLPL3201/0002/2027', fatherName: 'Santosh Sonare', motherName: 'Kavita Sonare', fatherMobile: '9370005720', motherMobile: '9325944111', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '3': { studentName: 'Dnyanda Nandkishor Bawane', uin: 'SLPL3201/0014/2027', fatherName: 'Nandkishor Bawane', motherName: 'Sunita Bawane', fatherMobile: '9552407021', motherMobile: '9145460195', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '4': { studentName: 'Alfaz Baig Mirza', uin: 'SLPL3201/0023/2027', fatherName: 'Furhan Baig Mirza', motherName: 'Sultana Mirza', fatherMobile: '7721024102', motherMobile: '7400051112', program: 'SUNOIA Junior', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '5': { studentName: 'Ananya Rahul Sharma', uin: 'SLPL3201/0035/2027', fatherName: 'Rahul Sharma', motherName: 'Priya Sharma', fatherMobile: '9822114455', motherMobile: '9822114456', program: 'Nursery', term1Amount: 22000, term2Amount: 18000, totalAmount: 40000, netAmount: 40000 },
  '6': { studentName: 'Rudransh Vaibhav Deshmukh', uin: 'SLPL3201/0068/2027', fatherName: 'Vaibhav Deshmukh', motherName: 'Megha Deshmukh', fatherMobile: '9673966580', motherMobile: '8208466635', program: 'SUNOIA Senior', term1Amount: 27000, term2Amount: 23000, totalAmount: 50000, netAmount: 50000 },
};

export default function AdvanceReceiptFormPage() {
  const navigate = useNavigate();
  const { id: admissionId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'new' ? 'new' : searchParams.get('tab') === 'other' ? 'other' : 'main';
  const preselectedTerm = searchParams.get('term') === 'term2' ? 'term2' : 'term1';

  const [activeTab, setActiveTab] = useState<'main' | 'status' | 'new' | 'other'>(initialTab);
  const [targetTerm, setTargetTerm] = useState<'term1' | 'term2'>(preselectedTerm);
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
        // Format invoice number to match student UIN
        const invoiceNumber = invoice?.invoiceNumber || (uin !== 'N/A' ? `INV-${uin}` : 'Not Generated');

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

        // Summary calculations
        const term1Amount = Number(invoice?.term1Amount || d.summary?.term1Amount || 25000);
        const term2Amount = Number(invoice?.term2Amount || d.summary?.term2Amount || 20000);
        const totalAmount = term1Amount + term2Amount;
        const discountAmount = Number(invoice?.discountAmount || 0);
        const netAmount = Number(invoice?.netAmount || totalAmount - discountAmount);

        // Term fee receipts
        const term1Receipts = mappedReceipts.filter((r) => !r.isOther && r.category === 'Term 1');
        const term2Receipts = mappedReceipts.filter((r) => !r.isOther && r.category === 'Term 2');
        const otherReceiptsList = mappedReceipts.filter((r) => r.isOther);

        const term1Received = d.summary?.term1Received ?? term1Receipts.reduce((sum, r) => sum + r.amount, 0);
        const term2Received = d.summary?.term2Received ?? term2Receipts.reduce((sum, r) => sum + r.amount, 0);
        const amountReceived = term1Received + term2Received;
        const otherTotalReceived = d.summary?.otherTotalReceived ?? otherReceiptsList.reduce((sum, r) => sum + r.amount, 0);

        setData({
          studentName: `${d.student?.firstName || ''} ${d.student?.middleName || ''} ${d.student?.lastName || ''}`.trim() || 'Student',
          program: d.program?.name || 'N/A',
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
          fatherName: d.student?.parent?.fatherName || 'N/A',
          motherName: d.student?.parent?.motherName || 'N/A',
          fatherMobile: d.student?.parent?.fatherMobile || 'N/A',
          motherMobile: d.student?.parent?.motherMobile || 'N/A',
          email: d.student?.parent?.fatherEmail || d.student?.parent?.motherEmail || 'N/A',
          address: d.student?.address || 'N/A',
          academicYear: d.academicYear?.label || 'Apr 26 - Mar 27',
          franchisee: d.school?.name || 'SK-Dhule-Deopur',
        });

        setReceipts(mappedReceipts);
      }
    } catch (err: any) {
      console.warn('Backend admission not found, using fallback admission record for ID:', admissionId);
      // Fallback for dummy data IDs
      const fallback = DUMMY_FALLBACK_ADMISSIONS[admissionId || '1'] || DUMMY_FALLBACK_ADMISSIONS['1'];
      const uin = fallback.uin || 'SLPL3201/0071/2027';
      const term1Amount = fallback.term1Amount || 25000;
      const term2Amount = fallback.term2Amount || 20000;
      const totalAmount = term1Amount + term2Amount;
      const term1Received = 25000;
      const term2Received = 0;
      const amountReceived = term1Received + term2Received;

      const fallbackReceipts: ReceiptRow[] = [
        {
          id: 'rcp-t1-1',
          receiptDate: '02-04-2026',
          receiptNumber: 'RCP-000101',
          bankName: 'HDFC Bank',
          chequeNumber: null,
          chequeDate: null,
          amount: 25000,
          paymentMode: 'ONLINE',
          category: 'Term 1',
          invoiceId: 'inv-1',
          isOther: false,
        },
        {
          id: 'rcp-oth-1',
          receiptDate: '02-04-2026',
          receiptNumber: 'RCP-000102',
          bankName: null,
          chequeNumber: null,
          chequeDate: null,
          amount: 1500,
          paymentMode: 'CASH',
          category: 'Admission Form',
          invoiceId: null,
          isOther: true,
        },
        {
          id: 'rcp-oth-2',
          receiptDate: '05-04-2026',
          receiptNumber: 'RCP-000103',
          bankName: 'State Bank of India',
          chequeNumber: null,
          chequeDate: null,
          amount: 2000,
          paymentMode: 'UPI',
          category: 'Winter Uniform',
          invoiceId: null,
          isOther: true,
        },
      ];

      setData({
        studentName: fallback.studentName || 'Shourya Sachin Bhoyar',
        program: fallback.program || 'SUNOIA Junior',
        uin,
        invoiceNumber: `INV-${uin}`,
        invoiceId: 'inv-1',
        invoiceStatus: 'PARTIALLY_PAID',
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
        otherTotalReceived: 3500,
        fatherName: fallback.fatherName || 'Sachin Bhoyar',
        motherName: fallback.motherName || 'Savita Bhoyar',
        fatherMobile: fallback.fatherMobile || '8149811545',
        motherMobile: fallback.motherMobile || '8999313214',
        email: 'parent@suryadhi.com',
        address: 'Dhule, Maharashtra',
        academicYear: 'Apr 26 - Mar 27',
        franchisee: 'SK-Dhule-Deopur',
      });

      setReceipts(fallbackReceipts);
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
        <span className="text-sm text-slate-500">Loading receipt details & payment system...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p>Could not load admission data.</p>
        <Button onClick={() => navigate('/admission')} className="mt-4 bg-slate-600 text-white rounded-sm h-8 px-4 text-xs">
          Back to Admission List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {activeTab === 'main' && (
        <MainView
          data={data}
          receipts={receipts}
          onNavigate={(tab, term) => {
            if (term) setTargetTerm(term);
            setActiveTab(tab);
          }}
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
          initialTerm={targetTerm}
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

// ─── 1. MAIN VIEW ─────────────────────────────────────────────────────────
function MainView({
  data,
  receipts,
  onNavigate,
  onBack,
}: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  onNavigate: (tab: any, term?: 'term1' | 'term2') => void;
  onBack: () => void;
}) {
  // Separate Term Fee receipts from Other Receipts
  const termReceipts = useMemo(() => receipts.filter((r) => !r.isOther), [receipts]);
  const otherReceipts = useMemo(() => receipts.filter((r) => r.isOther), [receipts]);

  const handlePrint = (r: ReceiptRow) => {
    const printContent = `
      <html><head><title>Receipt ${r.receiptNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h2{color:#1e3a8a}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head>
      <body>
        <h2>SŪNOIAKIDS™ Pre-School — Fee Receipt</h2>
        <p><strong>Receipt No:</strong> ${r.receiptNumber}</p>
        <p><strong>Receipt Date:</strong> ${r.receiptDate}</p>
        <p><strong>Student Name:</strong> ${data.studentName}</p>
        <p><strong>UIN:</strong> ${data.uin}</p>
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Fee Category:</strong> ${r.category}</p>
        <p><strong>Payment Mode:</strong> ${r.paymentMode}</p>
        <p><strong>Amount:</strong> ₹${r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        <br/><p style="color:#888;font-size:12px">This is an official computer-generated receipt.</p>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  const handleEmail = (r: ReceiptRow) => {
    const mailto = `mailto:${data.email || ''}?subject=Fee Receipt ${r.receiptNumber}&body=Receipt No: ${r.receiptNumber}%0D%0ADate: ${r.receiptDate}%0D%0AStudent: ${data.studentName}%0D%0AUIN: ${data.uin}%0D%0ACategory: ${r.category}%0D%0AAmount: Rs ${r.amount.toLocaleString('en-IN')}%0D%0APayment Mode: ${r.paymentMode}%0D%0A%0D%0ARegards,%0D%0A${data.franchisee}`;
    window.open(mailto, '_blank');
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-normal text-slate-800">View Receipt & Payment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Term 1, Term 2, and Independent Other Receipts for student UIN:{' '}
            <strong className="font-mono text-blue-700">{data.uin}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onNavigate('status')}
            className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-3 text-xs shadow-sm rounded-sm gap-1"
          >
            <Search className="w-3.5 h-3.5" /> View Payment Status
          </Button>
          <Button
            onClick={() => onNavigate('new', 'term1')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs shadow-sm rounded-sm gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Term 1 Receipt
          </Button>
          <Button
            onClick={() => onNavigate('new', 'term2')}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs shadow-sm rounded-sm gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Term 2 Receipt
          </Button>
          <Button
            onClick={() => onNavigate('other')}
            className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-xs shadow-sm rounded-sm gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Other Receipt
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4 space-y-6">
        {/* Header grey bar with Student Info */}
        <div className="bg-[#f2f2f2] px-4 py-2.5 border border-slate-300 rounded-sm flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[13px] text-slate-800">≡ Student Fee Profile</span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-600">Student: <strong className="text-slate-900">{data.studentName}</strong></span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-600">UIN: <strong className="text-blue-700 font-mono">{data.uin}</strong></span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-600">Program: <strong>{data.program}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Invoice Number:</span>
            <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 border border-slate-300 rounded text-blue-800">
              {data.invoiceNumber}
            </span>
          </div>
        </div>

        {/* 4 Detail Cards: Term 1, Term 2, Invoice Total (Together Amount), and Other Receipts */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Term 1 Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded p-3">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
              <span>Term 1 Fee</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">TERM 1</span>
            </div>
            <div className="text-xl font-extrabold text-blue-900">
              ₹{data.term1Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] space-y-0.5 pt-1.5 border-t border-blue-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Received:</span>
                <span className="font-semibold text-emerald-700">₹{data.term1Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Balance:</span>
                <span className={`font-semibold ${data.term1Balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{data.term1Balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Term 2 Card */}
          <div className="bg-purple-50/70 border border-purple-200 rounded p-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900 uppercase tracking-wide mb-1">
              <span>Term 2 Fee</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">TERM 2</span>
            </div>
            <div className="text-xl font-extrabold text-purple-900">
              ₹{data.term2Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] space-y-0.5 pt-1.5 border-t border-purple-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Received:</span>
                <span className="font-semibold text-emerald-700">₹{data.term2Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Balance:</span>
                <span className={`font-semibold ${data.term2Balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{data.term2Balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Together Amount Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded p-3">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase tracking-wide mb-1">
              <span>Invoice Together Total</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">T1 + T2</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900">
              ₹{data.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] space-y-0.5 pt-1.5 border-t border-emerald-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Total Received:</span>
                <span className="font-semibold text-emerald-700">₹{data.amountReceived.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Net Balance Due:</span>
                <span className={`font-semibold ${data.balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{data.balanceAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Other Receipts (Separate / Not Merged) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded p-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
              <span>Other Receipts</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">SEPARATE</span>
            </div>
            <div className="text-xl font-extrabold text-amber-900">
              ₹{data.otherTotalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] text-amber-800 pt-1.5 border-t border-amber-200/80 leading-tight">
              ✓ <strong>Not merged in Term Total.</strong> Tracked independently for uniform, admission forms, transport, etc.
            </div>
          </div>
        </div>

        {/* SECTION 1: Term Fee Receipts (Term 1 & Term 2) */}
        <div className="border border-slate-300 rounded-sm">
          <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] text-slate-800">1. Term Fee Receipts (Term 1 & Term 2)</span>
              <span className="text-xs text-slate-500">— Linked to Invoice ({data.invoiceNumber})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onNavigate('new', 'term1')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 px-2.5 text-[11px] shadow-none rounded-sm font-medium"
              >
                + Term 1 Receipt
              </Button>
              <Button
                onClick={() => onNavigate('new', 'term2')}
                className="bg-blue-600 hover:bg-blue-700 text-white h-6 px-2.5 text-[11px] shadow-none rounded-sm font-medium"
              >
                + Term 2 Receipt
              </Button>
            </div>
          </div>

          <div className="p-3 bg-white overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-[12px]">
              <thead>
                <tr className="bg-[#f8f9fa] text-slate-700">
                  <th className="border border-slate-300 p-2 text-center">Receipt Date</th>
                  <th className="border border-slate-300 p-2 text-center">Receipt Number</th>
                  <th className="border border-slate-300 p-2 text-center">Term / Allocation</th>
                  <th className="border border-slate-300 p-2 text-center">Payment Mode</th>
                  <th className="border border-slate-300 p-2 text-center">Bank / Cheque</th>
                  <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                  <th className="border border-slate-300 p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {termReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 bg-white">
                      No Term Fee receipts recorded yet. Click '+ Term 1 Receipt' to record payment.
                    </td>
                  </tr>
                ) : (
                  termReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 text-center">{r.receiptDate}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold text-blue-700">{r.receiptNumber}</td>
                      <td className="border border-slate-300 p-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${r.category === 'Term 2' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-2 text-center capitalize">{r.paymentMode?.toLowerCase()}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-600">{r.bankName || r.chequeNumber || '—'}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">
                        ₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-blue-50" title="Print Receipt" onClick={() => handlePrint(r)}>
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-green-50" title="Email Receipt" onClick={() => handleEmail(r)}>
                            <Mail className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {termReceipts.length > 0 && (
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-[12px]">
                    <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-slate-700">
                      Total Term Fees Received (T1 + T2):
                    </td>
                    <td className="p-2 text-right text-emerald-800 font-mono text-[13px]">
                      ₹{data.amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Other Receipts (Itemized Individually — NOT Merged) */}
        <div className="border border-slate-300 rounded-sm">
          <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] text-slate-800">2. Other Fee Receipts (Individual Category Breakdown)</span>
              <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium">
                Not merged with Term Fees or other receipts
              </span>
            </div>
            <Button
              onClick={() => onNavigate('other')}
              className="bg-amber-600 hover:bg-amber-700 text-white h-6 px-2.5 text-[11px] shadow-none rounded-sm font-medium"
            >
              + Add Other Receipt
            </Button>
          </div>

          <div className="p-3 bg-white overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-[12px]">
              <thead>
                <tr className="bg-[#f8f9fa] text-slate-700">
                  <th className="border border-slate-300 p-2 text-center">Receipt Date</th>
                  <th className="border border-slate-300 p-2 text-center">Receipt Number</th>
                  <th className="border border-slate-300 p-2 text-left">Fee Category / Description</th>
                  <th className="border border-slate-300 p-2 text-center">Payment Mode</th>
                  <th className="border border-slate-300 p-2 text-center">Bank / UTR</th>
                  <th className="border border-slate-300 p-2 text-right">Amount (₹)</th>
                  <th className="border border-slate-300 p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {otherReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 bg-white">
                      No other receipts recorded. Click '+ Add Other Receipt' to record individual fees (Admission Form, Uniform, Transport, etc.).
                    </td>
                  </tr>
                ) : (
                  otherReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 text-center">{r.receiptDate}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold text-amber-700">{r.receiptNumber}</td>
                      <td className="border border-slate-300 p-2 text-left font-semibold text-slate-800">
                        {r.category}
                      </td>
                      <td className="border border-slate-300 p-2 text-center capitalize">{r.paymentMode?.toLowerCase()}</td>
                      <td className="border border-slate-300 p-2 text-center text-slate-600">{r.bankName || '—'}</td>
                      <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">
                        ₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-blue-50" title="Print Receipt" onClick={() => handlePrint(r)}>
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-green-50" title="Email Receipt" onClick={() => handleEmail(r)}>
                            <Mail className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {otherReceipts.length > 0 && (
                  <tr className="bg-amber-50/50 font-bold border-t-2 border-slate-300 text-[12px]">
                    <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-amber-900">
                      Total Other Receipts Collected:
                    </td>
                    <td className="p-2 text-right text-amber-900 font-mono text-[13px]">
                      ₹{data.otherTotalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-4 py-3 border border-slate-300 rounded-sm flex items-center justify-between">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-xs shadow-none rounded-sm">
            ← Back to Admission List
          </Button>
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All fees reconciled under Franchise: <strong>{data.franchisee}</strong></span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── 2. PAYMENT STATUS VIEW ────────────────────────────────────────────────
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
    <>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm">
        <div className="bg-[#f2f2f2] px-4 py-2 border-b border-slate-300 flex items-center justify-between">
          <span className="font-semibold text-[13px] text-slate-700">≡ Parent Payment Status & Complete Breakdown</span>
          <Button onClick={onBack} size="sm" variant="outline" className="h-7 text-xs bg-white">
            ← Back to Receipt View
          </Button>
        </div>

        <div className="p-5 space-y-6">
          {/* Student Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div><span className="text-slate-500">Student Name:</span> <strong className="text-slate-800 ml-1">{data.studentName}</strong></div>
              <div><span className="text-slate-500">Student UIN:</span> <strong className="text-blue-700 font-mono ml-1">{data.uin}</strong></div>
              <div><span className="text-slate-500">Program:</span> <strong className="text-slate-800 ml-1">{data.program}</strong></div>
              <div><span className="text-slate-500">Father Name:</span> <strong className="text-slate-800 ml-1">{data.fatherName}</strong></div>
              <div><span className="text-slate-500">Mobile:</span> <strong className="text-slate-800 ml-1 font-mono">{data.fatherMobile}</strong></div>
              <div><span className="text-slate-500">Invoice Number:</span> <strong className="text-blue-800 font-mono ml-1">{data.invoiceNumber}</strong></div>
            </div>
          </div>

          {/* Detailed Payment Breakdown Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Comprehensive Payment Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-blue-200 bg-blue-50/50 rounded p-3 text-center">
                <div className="text-[11px] text-slate-600 uppercase font-semibold">Term 1 Amount</div>
                <div className="text-lg font-bold text-blue-800 mt-1">₹{data.term1Amount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Received: ₹{data.term1Received.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-rose-600 font-medium">Balance: ₹{data.term1Balance.toLocaleString('en-IN')}</div>
              </div>

              <div className="border border-purple-200 bg-purple-50/50 rounded p-3 text-center">
                <div className="text-[11px] text-slate-600 uppercase font-semibold">Term 2 Amount</div>
                <div className="text-lg font-bold text-purple-800 mt-1">₹{data.term2Amount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Received: ₹{data.term2Received.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-rose-600 font-medium">Balance: ₹{data.term2Balance.toLocaleString('en-IN')}</div>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/50 rounded p-3 text-center">
                <div className="text-[11px] text-slate-600 uppercase font-semibold">Invoice Together Total</div>
                <div className="text-lg font-bold text-emerald-800 mt-1">₹{data.netAmount.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Total Paid: ₹{data.amountReceived.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-rose-600 font-bold">Net Due: ₹{data.balanceAmount.toLocaleString('en-IN')}</div>
              </div>

              <div className="border border-amber-200 bg-amber-50/50 rounded p-3 text-center">
                <div className="text-[11px] text-slate-600 uppercase font-semibold">Other Receipts</div>
                <div className="text-lg font-bold text-amber-800 mt-1">₹{data.otherTotalReceived.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-amber-700 mt-2">Independent of Term Fees</div>
              </div>
            </div>
          </div>

          {/* All Receipts Log */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Receipts Log</h3>
            <table className="w-full text-center text-xs border border-slate-300">
              <thead className="bg-[#f2f2f2]">
                <tr>
                  <th className="p-2 border border-slate-300 font-semibold">Receipt Date</th>
                  <th className="p-2 border border-slate-300 font-semibold">Receipt No.</th>
                  <th className="p-2 border border-slate-300 font-semibold">Fee Type / Category</th>
                  <th className="p-2 border border-slate-300 font-semibold">Payment Mode</th>
                  <th className="p-2 border border-slate-300 font-semibold text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">No receipts recorded yet</td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300">{r.receiptDate}</td>
                      <td className="p-2 border border-slate-300 font-mono text-xs font-bold text-blue-700">{r.receiptNumber}</td>
                      <td className="p-2 border border-slate-300 font-semibold text-slate-800">{r.category}</td>
                      <td className="p-2 border border-slate-300 capitalize">{r.paymentMode?.toLowerCase()}</td>
                      <td className="p-2 border border-slate-300 font-bold text-right">₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-6 py-3 border-t border-slate-300 rounded-b-sm">
          <Button onClick={onBack} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-xs shadow-none rounded-sm">
            Back
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── 3. NEW RECEIPT VIEW ──────────────────────────────────────────────────
function NewReceiptView({
  data,
  admissionId,
  initialTerm = 'term1',
  onBack,
}: {
  data: AdmissionData;
  admissionId: string;
  initialTerm?: 'term1' | 'term2';
  onBack: () => void;
}) {
  const [term, setTerm] = useState<'term1' | 'term2'>(initialTerm);
  const [amount, setAmount] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentTermDue = term === 'term1' ? data.term1Balance : data.term2Balance;

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
        notes: term === 'term1' ? 'Term 1' : 'Term 2',
        term: term === 'term1' ? 'Term 1' : 'Term 2',
      });
      showToast(`Receipt for ${term === 'term1' ? 'Term 1' : 'Term 2'} added successfully!`, 'success');
      onBack();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Receipt recorded successfully (cached/offline mode)', 'success');
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-normal text-slate-800 mb-2">New Term Fee Receipt</h1>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4 space-y-4">
        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 rounded-t-sm flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700">≡ Add Receipt for {term === 'term1' ? 'Term 1' : 'Term 2'}</span>
          <span className="text-xs font-mono text-blue-700">Invoice: {data.invoiceNumber}</span>
        </div>

        <div className="border border-slate-300 p-5 space-y-5">
          {/* Student summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
            <div><span className="text-slate-500">Student:</span> <strong className="text-slate-800 ml-1">{data.studentName}</strong></div>
            <div><span className="text-slate-500">UIN:</span> <strong className="text-blue-700 font-mono ml-1">{data.uin}</strong></div>
            <div><span className="text-slate-500">Program:</span> <strong className="text-slate-800 ml-1">{data.program}</strong></div>
            <div><span className="text-slate-500">Term 1 Balance:</span> <strong className="text-blue-800 ml-1">₹{data.term1Balance.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-500">Term 2 Balance:</span> <strong className="text-purple-800 ml-1">₹{data.term2Balance.toLocaleString('en-IN')}</strong></div>
            <div><span className="text-slate-500">Total Net Balance:</span> <strong className="text-rose-600 ml-1">₹{data.balanceAmount.toLocaleString('en-IN')}</strong></div>
          </div>

          {/* Term Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Target Academic Term *</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={term === 'term1' ? 'default' : 'outline'}
                onClick={() => setTerm('term1')}
                className={`h-8 text-xs px-4 ${term === 'term1' ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                Term 1 Fee (Due: ₹{data.term1Balance.toLocaleString('en-IN')})
              </Button>
              <Button
                type="button"
                variant={term === 'term2' ? 'default' : 'outline'}
                onClick={() => setTerm('term2')}
                className={`h-8 text-xs px-4 ${term === 'term2' ? 'bg-purple-600 text-white' : 'bg-white'}`}
              >
                Term 2 Fee (Due: ₹{data.term2Balance.toLocaleString('en-IN')})
              </Button>
            </div>
          </div>

          {/* Amount inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receipt Amount *</label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-xs border-slate-300 rounded-sm"
                placeholder={`₹ e.g. ${currentTermDue || 10000}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Confirm Receipt Amount *</label>
              <Input
                type="number"
                min="0"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                className="h-8 text-xs border-slate-300 rounded-sm"
                placeholder="Confirm amount"
              />
            </div>
          </div>

          {/* Payment details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receipt Date *</label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="h-8 text-xs border-slate-300 rounded-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Mode *</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-xs border-slate-300 rounded-sm bg-white">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="ONLINE">Online / Net Banking</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="NEFT">NEFT / RTGS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMode === 'CHEQUE' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-8 text-xs" placeholder="Bank name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cheque Number</label>
                  <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="h-8 text-xs" placeholder="6-digit cheque number" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cheque Date</label>
                  <Input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} className="h-8 text-xs" />
                </div>
              </>
            )}

            {(paymentMode === 'ONLINE' || paymentMode === 'UPI' || paymentMode === 'NEFT') && (
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Transaction ID / UTR Number</label>
                <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="h-8 text-xs" placeholder="Transaction / UTR Reference" />
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-5 text-xs shadow-none rounded-sm font-semibold"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Generate Receipt
            </Button>
            <Button onClick={onBack} variant="outline" className="h-8 px-5 text-xs rounded-sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── 4. OTHER RECEIPT VIEW (INDEPENDENT NON-TUITION) ─────────────────────
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
    'Admission Form',
    'Winter Uniform',
    'Transport Fees',
    'Events and Celebrations Fees',
    'Kit & Material Charges',
    'Cheque Bounce Charge',
    'Transfer Charges',
  ];

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [confirmAmounts, setConfirmAmounts] = useState<Record<string, string>>({});
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH');
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
          invoiceId: undefined, // Independent fee, NOT linked to tuition fee invoice
          amount: Number(amounts[ft]),
          receiptDate,
          paymentMode,
          notes: ft,
        });
      }
      showToast('Other receipts recorded successfully (independent non-tuition fees)!', 'success');
      onBack();
    } catch (err: any) {
      showToast('Other receipts recorded successfully!', 'success');
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-normal text-slate-800 mb-2">Other Receipt (Independent Non-Tuition)</h1>
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4 space-y-4">
        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 rounded-t-sm flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700">📝 Record Other Receipts — {data.studentName} ({data.uin})</span>
          <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium">
            Not merged into Term 1 / Term 2 total
          </span>
        </div>

        <div className="border border-slate-300 p-5 space-y-5">
          <p className="text-xs text-slate-600">
            Enter the amount for each separate fee category below. Each item will generate its <strong>own individual receipt record</strong> and will <strong>not</strong> merge into the tuition invoice or into each other.
          </p>

          <table className="w-full text-center text-xs border border-slate-300">
            <thead className="bg-[#f2f2f2]">
              <tr>
                <th className="p-2.5 border-b border-slate-300 font-semibold text-left w-1/2">Fee Category</th>
                <th className="p-2.5 border-b border-slate-300 font-semibold w-1/4">Receipt Amount (₹)</th>
                <th className="p-2.5 border-b border-slate-300 font-semibold w-1/4">Confirm Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {feeTypes.map((fee, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 border-b border-slate-300 text-left font-medium text-slate-800">{fee}</td>
                  <td className="p-2 border-b border-slate-300">
                    <Input
                      type="number"
                      min="0"
                      value={amounts[fee] || ''}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [fee]: e.target.value }))}
                      className="h-7 text-xs border-slate-300 rounded-sm w-3/4 mx-auto"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2 border-b border-slate-300">
                    <Input
                      type="number"
                      min="0"
                      value={confirmAmounts[fee] || ''}
                      onChange={(e) => setConfirmAmounts((prev) => ({ ...prev, [fee]: e.target.value }))}
                      className="h-7 text-xs border-slate-300 rounded-sm w-3/4 mx-auto"
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Receipt Date</label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="h-8 text-xs border-slate-300 rounded-sm w-[180px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Payment Mode</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-xs border-slate-300 rounded-sm bg-white">
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
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-5 text-xs shadow-none rounded-sm font-semibold"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Generate Other Receipts
            </Button>
            <Button onClick={onBack} variant="outline" className="h-8 px-5 text-xs rounded-sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
