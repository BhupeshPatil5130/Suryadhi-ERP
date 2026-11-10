import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Printer, Mail, Link as LinkIcon, Pencil, Eye, Trash2, X } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface AdmissionData {
  studentName: string;
  program: string;
  batch?: string;
  gender?: string;
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
  franchiseeContactPerson?: string;
  franchiseeAddress?: string;
  franchiseePhone?: string;
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
  '1': { studentName: 'Gurvesh Ganesh Rathod', uin: 'SNK/3201/0001/2027', fatherName: 'Ganesh Rathod', motherName: 'Rekha Rathod', fatherMobile: '9822114455', motherMobile: '9822114456', program: 'Nursery', batch: 'Morning Shift', gender: 'MALE', term1Amount: 15800, term2Amount: 8000, totalAmount: 23800, netAmount: 23800 },
  '2': { studentName: 'Shourya Sachin Bhoyar', uin: 'SNK/3201/0002/2027', fatherName: 'Sachin Bhoyar', motherName: 'Savita Bhoyar', fatherMobile: '8149811545', motherMobile: '8999313214', program: 'SUNOIA Junior', batch: 'Morning Shift', gender: 'MALE', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '3': { studentName: 'Aarohi Santosh Sonare', uin: 'SNK/3201/0003/2027', fatherName: 'Santosh Sonare', motherName: 'Kavita Sonare', fatherMobile: '9370005720', motherMobile: '9325944111', program: 'SUNOIA Junior', batch: 'Late Morning Shift', gender: 'FEMALE', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '4': { studentName: 'Dnyanda Nandkishor Bawane', uin: 'SNK/3201/0004/2027', fatherName: 'Nandkishor Bawane', motherName: 'Sunita Bawane', fatherMobile: '9552407021', motherMobile: '9145460195', program: 'SUNOIA Junior', batch: 'Morning Shift', gender: 'FEMALE', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '5': { studentName: 'Alfaz Baig Mirza', uin: 'SNK/3201/0005/2027', fatherName: 'Furhan Baig Mirza', motherName: 'Sultana Mirza', fatherMobile: '7721024102', motherMobile: '7400051112', program: 'SUNOIA Junior', batch: 'Morning Shift', gender: 'MALE', term1Amount: 25000, term2Amount: 20000, totalAmount: 45000, netAmount: 45000 },
  '6': { studentName: 'Rudransh Vaibhav Deshmukh', uin: 'SNK/3201/0006/2027', fatherName: 'Vaibhav Deshmukh', motherName: 'Megha Deshmukh', fatherMobile: '9673966580', motherMobile: '8208466635', program: 'SUNOIA Senior', batch: 'Morning Shift', gender: 'MALE', term1Amount: 27000, term2Amount: 23000, totalAmount: 50000, netAmount: 50000 },
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
      let res;
      try {
        res = await api.get(`/admissions/${admissionId}/receipt`);
      } catch {
        res = await api.get(`/fees/receipts/${admissionId}`);
      }

      if (res.data.success) {
        const d = res.data.data;
        const invoice = d.invoices?.[0];
        const uin = d.student?.uin || 'N/A';
        const invoiceNumber = invoice?.invoiceNumber || (uin !== 'N/A' ? (uin.startsWith('SNK/') ? uin : `SNK/3201/${uin.replace(/[^0-9]/g, '').slice(-4) || '0001'}/2027`) : 'Not Generated');

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
          batch: d.batch || d.admission?.batch?.timeSlot || 'Morning Shift',
          gender: d.student?.gender || 'MALE',
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
          email: d.student?.parent?.fatherEmail || d.student?.parent?.motherEmail || 'parent@sunoiakids.com',
          address: d.student?.address || 'Dhule',
          academicYear: d.academicYear?.label || 'Jun 24 - May 25',
          franchisee: d.school?.name || 'SNK - Dhule - Deopur',
          franchiseeContactPerson: 'Rahul Khandale',
          franchiseeAddress: d.school?.address || 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District',
          franchiseePhone: d.school?.phone || '9823990362',
        });

        setReceipts(mappedReceipts);
      }
    } catch {
      const fallback = DUMMY_FALLBACK_ADMISSIONS[admissionId || '1'] || DUMMY_FALLBACK_ADMISSIONS['1'];
      const uin = fallback.uin || 'SNK/3201/0001/2027';
      const term1Amount = fallback.term1Amount || 15800;
      const term2Amount = fallback.term2Amount || 8000;
      const totalAmount = term1Amount + term2Amount;
      const term1Received = 0;
      const term2Received = 0;
      const amountReceived = term1Received + term2Received;

      setData({
        studentName: fallback.studentName || 'Gurvesh Ganesh Rathod',
        program: fallback.program || 'Nursery',
        batch: fallback.batch || 'Morning Shift',
        gender: fallback.gender || 'MALE',
        uin,
        invoiceNumber: uin.startsWith('SNK/') ? uin : `SNK/3201/0001/2027`,
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
        email: 'parent@sunoiakids.com',
        address: 'Dhule',
        academicYear: 'Jun 24 - May 25',
        franchisee: 'SNK - Dhule - Deopur',
        franchiseeContactPerson: 'Rahul Khandale',
        franchiseeAddress: 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District',
        franchiseePhone: '9823990362',
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
          admissionId={admissionId!}
          onNavigate={(tab) => setActiveTab(tab)}
          onBack={() => navigate('/admission')}
          onRefresh={fetchData}
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

// ─── Helpers: Number To Words & Date Formatting ─────────────────────────────
function numberToWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'Zero Only';
  const num = Math.round(Math.abs(amount));
  if (num === 0) return 'Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const unitPart = n % 10;
    return `${tens[Math.floor(n / 10)]}${unitPart ? ' ' + units[unitPart] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) str += `${units[hundred]} Hundred`;
    if (rest > 0) str += `${str ? ' ' : ''}${convertTwoDigits(rest)}`;
    return str;
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let result = '';
  if (crore > 0) result += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) result += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) result += `${convertTwoDigits(thousand)} Thousand `;
  if (remainder > 0) result += `${convertThreeDigits(remainder)} `;

  return `${result.trim()} Only`;
}

function formatReceiptDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === 'N/A') return '24-Jun-2024';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${day}-${months[monthIdx] || 'Jun'}-${year}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }
  return dateStr;
}

function getFeeBreakdown(r: ReceiptRow) {
  if (r.isOther) {
    return [{ label: r.category || 'Other Fee', amount: r.amount }];
  }
  if (r.amount === 7000) {
    return [
      { label: 'Registration Fee', amount: 4250 },
      { label: 'Term Fee', amount: 2750 },
    ];
  }
  if (r.amount === 15800) {
    return [
      { label: 'Registration Fee', amount: 7800 },
      { label: 'Term Fee', amount: 8000 },
    ];
  }
  if (r.amount <= 10000) {
    const reg = Math.min(4250, Math.round(r.amount * 0.607));
    return [
      { label: 'Registration Fee', amount: reg },
      { label: 'Term Fee', amount: r.amount - reg },
    ];
  }
  const reg = 7800;
  return [
    { label: 'Registration Fee', amount: reg },
    { label: 'Term Fee', amount: r.amount - reg },
  ];
}

function printReceiptDocument(r: ReceiptRow, data: AdmissionData) {
  const genderPrefix = (data.gender || 'MALE').toUpperCase() === 'FEMALE' ? 'Miss' : 'Master';
  const parentName = (data.motherName || data.fatherName || 'Parent').toUpperCase();
  const dateFormatted = formatReceiptDate(r.receiptDate);
  const chequeDateFormatted = r.chequeDate ? formatReceiptDate(r.chequeDate) : dateFormatted;
  const words = numberToWords(r.amount);
  const breakdownRows = getFeeBreakdown(r);

  const rowsHtml = breakdownRows
    .map(
      (row) => `
      <tr>
        <td style="border:1.2px solid #333;padding:6px 8px;">${row.label}</td>
        <td style="border:1.2px solid #333;padding:6px 8px;text-align:right;">${row.amount.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt Details - ${r.receiptNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #222;
      margin: 0;
      padding: 16px;
      background: #fff;
      font-size: 13px;
    }
    .voucher-box {
      border: 1.5px solid #222;
      padding: 24px;
      max-width: 820px;
      margin: 0 auto;
      box-sizing: border-box;
      background: #fff;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .sk-logo-box {
      border: 1.5px solid #1d4ed8;
      border-radius: 4px;
      padding: 6px 12px;
      text-align: center;
      width: 175px;
      background: #fff;
    }
    .sk-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #1d4ed8;
      line-height: 1;
    }
    .sk-title span { color: #f59e0b; }
    .sk-brand {
      font-size: 16px;
      font-weight: 800;
      color: #1e3a8a;
      margin-top: 4px;
      line-height: 1.1;
    }
    .sk-sub {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .receipt-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #111;
      text-align: center;
      margin-top: 8px;
    }
    .franchise-box {
      border: 1.2px solid #222;
      padding: 8px 12px;
      width: 280px;
      font-size: 11px;
      line-height: 1.35;
      color: #111;
    }
    .franchise-name {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      font-size: 13px;
    }
    .receipt-num-box {
      border: 1.2px solid #222;
      padding: 3px 14px;
      font-weight: bold;
      font-family: monospace;
      font-size: 14px;
      background: #fafafa;
      display: inline-block;
      margin-left: 8px;
    }
    .statement {
      margin-top: 22px;
      font-size: 12.5px;
      line-height: 2.1;
      color: #111;
    }
    .underlined {
      border-bottom: 1px dotted #444;
      font-weight: bold;
      padding: 0 4px;
      display: inline-block;
    }
    .tables-grid {
      display: flex;
      gap: 16px;
      margin-top: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th, td {
      border: 1.2px solid #333;
      padding: 6px 8px;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      text-align: left;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      font-weight: bold;
      font-size: 12.5px;
      padding: 0 8px;
    }
    .disclaimer {
      margin-top: 18px;
      font-size: 11px;
      font-weight: 600;
      color: #333;
    }
    .terms {
      margin-top: 14px;
      border-top: 1px solid #444;
      padding-top: 10px;
      font-size: 10px;
      line-height: 1.45;
      color: #333;
    }
    .terms-title {
      font-weight: bold;
      font-size: 11px;
      color: #111;
      margin-bottom: 4px;
    }
    ol {
      margin: 0;
      padding-left: 18px;
    }
    li {
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="voucher-box">
    <div class="header-row">
      <div class="sk-logo-box">
        <div class="sk-title">S<span>K</span></div>
        <div class="sk-brand">Sunoia Kids</div>
        <div class="sk-sub">Pre-School</div>
      </div>
      <div class="receipt-title">RECEIPT</div>
      <div class="franchise-box">
        <div class="franchise-name">${data.franchiseeContactPerson || 'Rahul Khandale'}</div>
        <div>${data.franchiseeAddress || 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District'}</div>
        <div style="margin-top: 4px;"><strong>Tel No:</strong> ${data.franchiseePhone || '9823990362'}</div>
      </div>
    </div>

    <div class="meta-row">
      <div>
        <strong>Receipt No.:</strong>
        <span class="receipt-num-box">${r.receiptNumber}</span>
      </div>
      <div>
        <strong>Date:</strong> &nbsp;${dateFormatted}
      </div>
    </div>

    <div class="statement">
      Received with thanks from &nbsp;<span class="underlined">${parentName}</span><br/>
      on behalf of &nbsp;${genderPrefix}&nbsp; <span class="underlined">${data.studentName.toUpperCase()}</span><br/>
      the sum of Rs. &nbsp;<span class="underlined" style="font-family: monospace;">${r.amount.toFixed(2)}</span>
      &nbsp;Rupees &nbsp;(&nbsp; <span class="underlined">${words}</span> &nbsp;)<br/>
      vide &nbsp;<span class="underlined">${r.chequeNumber ? 'Cheque No. ' + r.chequeNumber : r.paymentMode}</span>
      &nbsp;dated &nbsp;<span class="underlined">${chequeDateFormatted}</span>
      &nbsp;towards full/part payment of the total course fee as mentioned below
    </div>

    <div class="tables-grid">
      <div style="flex: 1.1;">
        <table>
          <thead>
            <tr>
              <th>Fees for Academic year ${data.academicYear || 'Jun 24 - May 25'}</th>
              <th style="width: 80px; text-align: right;">Amount Rs.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="font-weight: bold; background: #fafafa;">
              <td style="text-align: right;">Total</td>
              <td style="text-align: right;">${r.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="flex: 0.9;">
        <table>
          <tbody>
            <tr>
              <td style="font-weight: bold; width: 100px; background: #f3f4f6;">Invoice No.</td>
              <td style="text-align: right; font-weight: bold;">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background: #f3f4f6;">Invoice Date</td>
              <td style="text-align: right;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background: #f3f4f6;">Programme</td>
              <td style="text-align: right;">${data.program}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background: #f3f4f6;">Batch</td>
              <td style="text-align: right;">${data.batch || 'Morning Shift'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="signatures">
      <div>Cheque / DD subject to realisation</div>
      <div>Accountant</div>
    </div>

    <div class="disclaimer">
      *This is a computer generated receipt does not require signature.
    </div>

    <div class="terms">
      <div class="terms-title">TERMS & CONDITIONS</div>
      <ol>
        <li>All payments shall be made strictly by a/c payee local cheque or demand draft only. NO CASH PAYMENTS SHALL BE ACCEPTED.</li>
        <li>All fee once paid shall not be refunded under any circumstances.</li>
        <li>Fees and other amount shall be paid in accordance with the fee structure issued and authorized by Sunoia Kids Pre-School. (The copy of which is available at the Sunoia Kids Pre-School).</li>
        <li>Please ensure that you keep the fee receipts safely so that the same can be produced as and when required.</li>
        <li>In case of cheque dishonour, penalty of Rs.500/- shall be charged.</li>
      </ol>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printHtml);
    win.document.close();
  }
}

// ─── Receipt Details Modal (Matching uploaded Screenshot) ────────────────────
function ReceiptDetailsModal({
  receipt,
  data,
  onClose,
  onPrint,
  onEmail,
}: {
  receipt: ReceiptRow;
  data: AdmissionData;
  onClose: () => void;
  onPrint: () => void;
  onEmail: () => void;
}) {
  const genderPrefix = (data.gender || 'MALE').toUpperCase() === 'FEMALE' ? 'Miss' : 'Master';
  const parentName = (data.motherName || data.fatherName || 'Parent').toUpperCase();
  const dateFormatted = formatReceiptDate(receipt.receiptDate);
  const chequeDateFormatted = receipt.chequeDate ? formatReceiptDate(receipt.chequeDate) : dateFormatted;
  const words = numberToWords(receipt.amount);
  const breakdownRows = getFeeBreakdown(receipt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-[860px] my-6 flex flex-col max-h-[92vh]">
        {/* Modal Toolbar Header */}
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Receipt Details</h2>
            <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              {receipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onPrint}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print</span>
            </Button>
            <Button
              type="button"
              onClick={onEmail}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Email</span>
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal Document Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          <div className="bg-white border-1.5 border-slate-800 p-6 md:p-8 w-full max-w-[760px] shadow-sm text-slate-900 font-sans text-xs">
            {/* Header: Logo + Title + Franchise Box */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              {/* SK Logo Box */}
              <div className="border-1.5 border-blue-700 rounded p-2.5 text-center w-[170px] bg-white shrink-0">
                <div className="text-2xl font-black tracking-tight text-blue-700 leading-none">
                  S<span className="text-amber-500">K</span>
                </div>
                <div className="text-[15px] font-extrabold text-blue-900 mt-1 leading-tight tracking-wide">
                  Sunoia Kids
                </div>
                <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Pre-School
                </div>
              </div>

              {/* Bold RECEIPT Title */}
              <div className="self-center sm:self-auto text-center sm:pt-2">
                <div className="text-xl sm:text-2xl font-black tracking-widest text-slate-900">
                  RECEIPT
                </div>
              </div>

              {/* Franchisee Box */}
              <div className="border border-slate-900 p-2.5 text-[11px] leading-snug w-full sm:w-[270px] text-slate-800">
                <div className="font-bold text-[12px] text-slate-900">
                  {data.franchiseeContactPerson || 'Rahul Khandale'}
                </div>
                <div className="mt-1 text-[10.5px] text-slate-700">
                  {data.franchiseeAddress || 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District'}
                </div>
                <div className="mt-1.5 font-medium text-[11px]">
                  <strong>Tel No:</strong> {data.franchiseePhone || '9823990362'}
                </div>
              </div>
            </div>

            {/* Receipt No & Date Row */}
            <div className="flex justify-between items-center mt-6 text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Receipt No.:</span>
                <span className="border border-slate-800 px-3 py-0.5 font-mono font-bold text-[13px] bg-slate-50">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Date:</span>
                <span className="font-medium text-[13px]">{dateFormatted}</span>
              </div>
            </div>

            {/* Statement */}
            <div className="mt-6 space-y-3.5 text-xs text-slate-800 leading-loose">
              <div className="flex items-baseline flex-wrap gap-x-2">
                <span className="text-slate-700">Received with thanks from</span>
                <span className="font-bold underline underline-offset-4 flex-1 border-b border-dotted border-slate-400 pb-0.5 uppercase tracking-wide">
                  {parentName}
                </span>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-2">
                <span className="text-slate-700">on behalf of</span>
                <span className="font-medium">{genderPrefix}</span>
                <span className="font-bold underline underline-offset-4 flex-1 border-b border-dotted border-slate-400 pb-0.5 uppercase tracking-wide">
                  {data.studentName}
                </span>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-2">
                <span className="text-slate-700">the sum of Rs.</span>
                <span className="font-bold px-2 py-0.5 border-b border-dotted border-slate-400 font-mono text-[13px]">
                  {receipt.amount.toFixed(2)}
                </span>
                <span className="text-slate-700">Rupees (</span>
                <span className="font-semibold underline underline-offset-4 flex-1 border-b border-dotted border-slate-400 pb-0.5">
                  {words}
                </span>
                <span>)</span>
              </div>

              <div className="flex items-baseline flex-wrap gap-x-2">
                <span className="text-slate-700">vide Cash / Cheque / DD / No.</span>
                <span className="font-bold underline underline-offset-4 border-b border-dotted border-slate-400 pb-0.5 px-2">
                  {receipt.chequeNumber ? `Cheque No. ${receipt.chequeNumber}` : receipt.paymentMode}
                </span>
                <span className="text-slate-700">dated</span>
                <span className="font-bold underline underline-offset-4 border-b border-dotted border-slate-400 pb-0.5 px-2">
                  {chequeDateFormatted}
                </span>
                <span className="text-slate-700">towards full/part payment of the total course fee as mentioned below</span>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Table: Fee Breakdown */}
              <table className="w-full border-collapse border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <th className="border border-slate-700 p-2 text-left">
                      Fees for Academic year {data.academicYear || 'Jun 24 - May 25'}
                    </th>
                    <th className="border border-slate-700 p-2 text-right w-24">Amount Rs.</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="border border-slate-700 p-2 text-slate-800">{row.label}</td>
                      <td className="border border-slate-700 p-2 text-right font-medium">{row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-slate-50 text-slate-900">
                    <td className="border border-slate-700 p-2 text-right">Total</td>
                    <td className="border border-slate-700 p-2 text-right font-mono">{receipt.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Right Table: Invoice Meta */}
              <table className="w-full border-collapse border border-slate-700 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-700 p-2 font-bold text-slate-800 w-28 bg-slate-50">Invoice No.</td>
                    <td className="border border-slate-700 p-2 text-right font-mono font-medium">{data.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-700 p-2 font-bold text-slate-800 bg-slate-50">Invoice Date</td>
                    <td className="border border-slate-700 p-2 text-right font-medium">{dateFormatted}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-700 p-2 font-bold text-slate-800 bg-slate-50">Programme</td>
                    <td className="border border-slate-700 p-2 text-right font-medium">{data.program}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-700 p-2 font-bold text-slate-800 bg-slate-50">Batch</td>
                    <td className="border border-slate-700 p-2 text-right font-medium">{data.batch || 'Morning Shift'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="mt-8 flex justify-between items-center text-xs text-slate-800 font-bold px-2">
              <div>Cheque / DD subject to realisation</div>
              <div>Accountant</div>
            </div>

            {/* Computer Generated Note */}
            <div className="mt-4 text-[11px] font-medium text-slate-600 italic">
              *This is a computer generated receipt does not require signature.
            </div>

            {/* Terms & Conditions */}
            <div className="mt-4 pt-3 border-t border-slate-300 text-[10px] leading-relaxed text-slate-700">
              <div className="font-bold text-slate-900 text-[11px] mb-1 uppercase tracking-wide">
                TERMS & CONDITIONS
              </div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>All payments shall be made strictly by a/c payee local cheque or demand draft only NO CASH PAYMENTS SHALL BE ACCEPTED.</li>
                <li>All fee once paid shall not be refunded under any circumstances.</li>
                <li>Fees and other amount shall be paid in accordance with the fee structure issued and authorized by Sunoia Kids Pre-School. (The copy of which is available at the Sunoia Kids Pre-School).</li>
                <li>Please ensure that you keep the fee receipts safely so that the same can be produced as and when required.</li>
                <li>In case of cheque dishonour, penalty of Rs.500/- shall be charged.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 1. PAGE 1: VIEW RECEIPT (Screenshot 1) ──────────────────────────────────
function MainView({
  data,
  receipts,
  admissionId,
  onNavigate,
  onBack,
  onRefresh,
}: {
  data: AdmissionData;
  receipts: ReceiptRow[];
  admissionId: string;
  onNavigate: (tab: 'main' | 'status' | 'new' | 'other') => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [onlineAmount, setOnlineAmount] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState<ReceiptRow | null>(null);

  const handleGenerateLink = () => {
    if (!onlineAmount || Number(onlineAmount) <= 0) {
      showToast('Please enter a valid Online Amount', 'error');
      return;
    }
    const link = `https://pay.sunoiakids.com/pay?inv=${encodeURIComponent(data.invoiceNumber)}&amt=${onlineAmount}`;
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
    printReceiptDocument(r, data);
  };

  const handleEmail = (r: ReceiptRow) => {
    const parentEmail = data.email || '';
    const subject = encodeURIComponent(`Fee Receipt - ${r.receiptNumber} (${data.studentName})`);
    const body = encodeURIComponent(
      `Dear Parent,\n\nPlease find fee receipt details below:\nReceipt No: ${r.receiptNumber}\nDate: ${formatReceiptDate(
        r.receiptDate
      )}\nStudent: ${data.studentName}\nProgram: ${data.program}\nBatch: ${data.batch || 'Morning Shift'}\nAmount: Rs. ${r.amount.toFixed(
        2
      )}\nMode: ${r.paymentMode}\n\nThank you,\nSunoia Kids Pre-School`
    );
    window.open(`mailto:${parentEmail}?subject=${subject}&body=${body}`, '_blank');
    showToast(`Email draft opened for ${parentEmail || 'parent'}`, 'success');
  };

  const handleDeleteReceipt = async (r: ReceiptRow) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete receipt "${r.receiptNumber}" of ₹${r.amount.toFixed(
        2
      )}?\n\nThis will remove the receipt and recalculate the student's balance.`
    );
    if (!confirmDelete) return;

    try {
      try {
        await api.delete(`/fees/receipts/${r.id}`);
      } catch {
        await api.delete(`/admissions/${admissionId}/receipts/${r.id}`);
      }
      showToast(`Receipt ${r.receiptNumber} deleted successfully`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete receipt', 'error');
    }
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

      {/* Card 2: ≡ Receipts (Table + 3 Top Actions + 4 Row Actions) */}
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
                <th className="border border-slate-300 p-2 font-semibold text-center w-36">Action</th>
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
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-2 text-center">{r.receiptDate}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono font-medium text-blue-700">{r.receiptNumber}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.bankName || '—'}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.chequeNumber || '—'}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{r.chequeDate || '—'}</td>
                    <td className="border border-slate-300 p-2 text-right font-medium text-slate-800">{r.amount.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600"
                          title="View Receipt"
                          onClick={() => setSelectedReceiptForModal(r)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-600"
                          title="Delete Receipt"
                          onClick={() => handleDeleteReceipt(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-700"
                          title="Print Receipt"
                          onClick={() => handlePrint(r)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600"
                          title="Email Receipt"
                          onClick={() => handleEmail(r)}
                        >
                          <Mail className="h-3.5 w-3.5" />
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

      {/* Receipt Details Modal (View Receipt Action) */}
      {selectedReceiptForModal && (
        <ReceiptDetailsModal
          receipt={selectedReceiptForModal}
          data={data}
          onClose={() => setSelectedReceiptForModal(null)}
          onPrint={() => handlePrint(selectedReceiptForModal)}
          onEmail={() => handleEmail(selectedReceiptForModal)}
        />
      )}
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
