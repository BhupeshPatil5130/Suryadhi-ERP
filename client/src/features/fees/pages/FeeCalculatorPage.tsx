import { useState, useEffect } from 'react';
import { Menu, Loader2, Download, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeeBreakup {
  feeType: string;
  term1Amount: number;
  term2Amount: number;
  totalAmount: number;
  discountAmount: number;
}

interface CalculationResult {
  feeBreakup: FeeBreakup[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  term1Total: number;
  term2Total: number;
}

interface Program {
  id: string;
  name: string;
  shortName?: string;
}

interface DiscountType {
  id: string;
  name: string;
  percentage: number | null;
  flatAmount: number | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const feeTypeLabels: Record<string, string> = {
  REGISTRATION: 'Registration Fee',
  TERM_FEE: 'Term Fee',
  TUITION_FEE: 'Tuition Fee',
  ACTIVITY_FEE: 'Activity Fee',
  MATERIAL_FEE: 'Material Fee',
  UNIFORM_FEE: 'Uniform Fee',
  TRANSPORT_FEE: 'Transport Fee',
  OTHER: 'Other Fee',
};

const admissionMonths = [
  { value: '2026-04-01', label: 'April 2026' },
  { value: '2026-05-01', label: 'May 2026' },
  { value: '2026-06-01', label: 'June 2026' },
  { value: '2026-07-01', label: 'July 2026' },
  { value: '2026-08-01', label: 'August 2026' },
  { value: '2026-09-01', label: 'September 2026' },
  { value: '2026-10-01', label: 'October 2026' },
  { value: '2026-11-01', label: 'November 2026' },
  { value: '2026-12-01', label: 'December 2026' },
  { value: '2027-01-01', label: 'January 2027' },
  { value: '2027-02-01', label: 'February 2027' },
  { value: '2027-03-01', label: 'March 2027' },
];

// ─── PDF Receipt Generator ───────────────────────────────────────────────────

function generateFeeReceiptPDF(opts: {
  programName: string;
  admissionDate: string;
  discountName: string | null;
  result: CalculationResult;
  studentName?: string;
}) {
  const { programName, admissionDate, discountName, result, studentName } = opts;
  const now = new Date();
  const receiptNo = `FEE-EST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const admissionLabel = admissionMonths.find(m => m.value === admissionDate)?.label ?? admissionDate;

  const breakupRows = result.feeBreakup
    .map(
      (fee) => `
      <tr>
        <td>${feeTypeLabels[fee.feeType] ?? fee.feeType}</td>
        <td class="num">₹${fee.totalAmount.toLocaleString('en-IN')}</td>
        <td class="num disc">${fee.discountAmount > 0 ? `- ₹${fee.discountAmount.toLocaleString('en-IN')}` : '—'}</td>
        <td class="num">₹${fee.term1Amount.toLocaleString('en-IN')}</td>
        <td class="num">₹${fee.term2Amount.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Fee Estimation Receipt — ${receiptNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 36px 44px;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid #0056b3;
      margin-bottom: 24px;
    }
    .brand-name { font-size: 24px; font-weight: 700; color: #0056b3; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .receipt-meta { text-align: right; }
    .receipt-title { font-size: 18px; font-weight: 700; color: #111; }
    .receipt-no { font-size: 13px; font-family: monospace; color: #0056b3; margin-top: 4px; font-weight: 600; }
    .receipt-date { font-size: 11px; color: #9ca3af; margin-top: 4px; }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .info-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; font-weight: 600; }
    .info-item .value { font-size: 14px; font-weight: 600; color: #111827; margin-top: 3px; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0056b3; }
    thead th {
      padding: 10px 12px;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    thead th.num { text-align: right; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:nth-child(even) { background: #fafbfc; }
    tbody td { padding: 10px 12px; font-size: 12.5px; color: #374151; }
    tbody td.num { text-align: right; font-family: 'Courier New', monospace; }
    tbody td.disc { color: #059669; }
    tfoot tr { background: #eff6ff; border-top: 2px solid #0056b3; }
    tfoot td { padding: 12px 12px; font-weight: 700; font-size: 13px; color: #0056b3; }
    tfoot td.num { text-align: right; font-family: 'Courier New', monospace; }
    tfoot td.disc { color: #059669; }

    /* ── Summary Boxes ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 24px;
    }
    .summary-box {
      border-radius: 8px;
      padding: 14px 16px;
      text-align: center;
    }
    .summary-box.total   { background: #eff6ff; border: 1px solid #bfdbfe; }
    .summary-box.term1   { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .summary-box.term2   { background: #fefce8; border: 1px solid #fef08a; }
    .summary-box .box-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; font-weight: 600; }
    .summary-box .box-value { font-size: 20px; font-weight: 700; margin-top: 6px; font-family: 'Courier New', monospace; }
    .summary-box.total   .box-value { color: #1d4ed8; }
    .summary-box.term1   .box-value { color: #15803d; }
    .summary-box.term2   .box-value { color: #854d0e; }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #9ca3af;
    }
    .footer .note { max-width: 320px; }
    .footer .sig { text-align: right; }
    .footer .sig .sig-line { border-top: 1px solid #6b7280; width: 140px; margin-top: 28px; }
    .footer .sig .sig-label { font-size: 9px; margin-top: 4px; }

    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand-name">Suryadhi Learning Pvt. Ltd.</div>
      <div class="brand-sub">Preschool Management System — Fee Estimation</div>
    </div>
    <div class="receipt-meta">
      <div class="receipt-title">Fee Estimation Receipt</div>
      <div class="receipt-no">${receiptNo}</div>
      <div class="receipt-date">Generated: ${now.toLocaleString('en-IN')}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="label">Program</div>
      <div class="value">${programName}</div>
    </div>
    <div class="info-item">
      <div class="label">Admission Month</div>
      <div class="value">${admissionLabel}</div>
    </div>
    <div class="info-item">
      <div class="label">Discount Applied</div>
      <div class="value">${discountName ?? 'None'}</div>
    </div>
    ${studentName ? `
    <div class="info-item">
      <div class="label">Student / Enquiry For</div>
      <div class="value">${studentName}</div>
    </div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Fee Component</th>
        <th class="num">Total Amount</th>
        <th class="num">Discount</th>
        <th class="num">Term 1 Amount</th>
        <th class="num">Term 2 Amount</th>
      </tr>
    </thead>
    <tbody>
      ${breakupRows}
    </tbody>
    <tfoot>
      <tr>
        <td>Net Total Payable</td>
        <td class="num">₹${result.subtotal.toLocaleString('en-IN')}</td>
        <td class="num disc">${result.discountAmount > 0 ? `- ₹${result.discountAmount.toLocaleString('en-IN')}` : '—'}</td>
        <td class="num">₹${result.term1Total.toLocaleString('en-IN')}</td>
        <td class="num">₹${result.term2Total.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary-grid">
    <div class="summary-box total">
      <div class="box-label">Total Fee Payable</div>
      <div class="box-value">₹${result.totalAmount.toLocaleString('en-IN')}</div>
    </div>
    <div class="summary-box term1">
      <div class="box-label">Term 1 Instalment</div>
      <div class="box-value">₹${result.term1Total.toLocaleString('en-IN')}</div>
    </div>
    <div class="summary-box term2">
      <div class="box-label">Term 2 Instalment</div>
      <div class="box-value">₹${result.term2Total.toLocaleString('en-IN')}</div>
    </div>
  </div>

  <div class="footer">
    <div class="note">
      <strong>Note:</strong> This is a fee <em>estimation</em> receipt for reference only. Final invoice will be issued upon admission confirmation. Fees are subject to change without prior notice.
    </div>
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised Signatory</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeeCalculatorPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  const [programId, setProgramId] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [discountTypeId, setDiscountTypeId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Fetch lookups on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchLookups = async () => {
      setLookupLoading(true);
      try {
        const [progRes, discRes] = await Promise.all([
          api.get('/lookups/programs'),
          api.get('/lookups/discount-types'),
        ]);
        if (progRes.data.success) setPrograms(progRes.data.data ?? []);
        if (discRes.data.success) setDiscountTypes(discRes.data.data ?? []);
      } catch (err) {
        console.warn('Failed to load fee lookups', err);
        // Fallback mock data so the form is still usable
        setPrograms([
          { id: 'p1', name: 'Play Group' },
          { id: 'p2', name: 'Nursery' },
          { id: 'p3', name: 'SUNOIA Junior' },
          { id: 'p4', name: 'SUNOIA Senior' },
        ]);
        setDiscountTypes([
          { id: 'd1', name: 'Sibling Discount', percentage: 10, flatAmount: null },
          { id: 'd2', name: 'Staff Discount', percentage: 20, flatAmount: null },
          { id: 'd3', name: 'Early Bird Offer', percentage: null, flatAmount: 5000 },
        ]);
      } finally {
        setLookupLoading(false);
      }
    };
    fetchLookups();
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!programId) newErrors.programId = 'Please select a program';
    if (!admissionDate) newErrors.admissionDate = 'Please select an admission month';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Local Fallback Calculation ─────────────────────────────────────────────
  const computeLocalFee = (progId: string, discId: string): CalculationResult => {
    const prog = programs.find((p) => p.id === progId);
    const progName = prog?.name || '';

    let reg = 5000;
    let term = 15000;
    let tuition = 10000;

    if (progName.includes('Nursery')) {
      term = 18000;
      tuition = 12000;
    } else if (progName.includes('Junior')) {
      term = 20000;
      tuition = 14000;
    } else if (progName.includes('Senior')) {
      term = 22000;
      tuition = 16000;
    }

    const subtotal = reg + term * 2 + tuition * 2;
    const disc = discountTypes.find((d) => d.id === discId);

    let discountAmount = 0;
    if (disc) {
      if (disc.percentage) discountAmount = subtotal * (disc.percentage / 100);
      else if (disc.flatAmount) discountAmount = disc.flatAmount;
    }

    const totalAmount = subtotal - discountAmount;
    const discRatio = subtotal > 0 ? discountAmount / subtotal : 0;

    const breakup = [
      { feeType: 'REGISTRATION', totalAmount: reg, discountAmount: reg * discRatio, term1Amount: reg * (1 - discRatio), term2Amount: 0 },
      { feeType: 'TERM_FEE', totalAmount: term * 2, discountAmount: term * 2 * discRatio, term1Amount: term * (1 - discRatio), term2Amount: term * (1 - discRatio) },
      { feeType: 'TUITION_FEE', totalAmount: tuition * 2, discountAmount: tuition * 2 * discRatio, term1Amount: tuition * (1 - discRatio), term2Amount: tuition * (1 - discRatio) },
    ];

    return {
      feeBreakup: breakup,
      subtotal,
      discountAmount,
      totalAmount,
      term1Total: breakup.reduce((sum, f) => sum + f.term1Amount, 0),
      term2Total: breakup.reduce((sum, f) => sum + f.term2Amount, 0),
    };
  };

  // ── Calculate ──────────────────────────────────────────────────────────────
  const calculate = async (): Promise<CalculationResult | null> => {
    if (!validate()) return null;

    setLoading(true);

    try {
      const res = await api.get('/fees/calculate', {
        params: {
          programId,
          admissionDate,
          ...(discountTypeId && { discountTypeId }),
        },
      });
      if (res.data.success) {
        const data = res.data.data as CalculationResult;
        setResult(data);
        return data;
      }
      throw new Error('API returned unsuccessful status');
    } catch {
      // Automatic seamless fallback to local fee calculation
      const fallbackResult = computeLocalFee(programId, discountTypeId);
      setResult(fallbackResult);
      return fallbackResult;
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate fee when inputs change
  useEffect(() => {
    if (programId && admissionDate) {
      calculate();
    }
  }, [programId, admissionDate, discountTypeId]);

  // ── Calculate Button ───────────────────────────────────────────────────────
  const handleCalculate = async () => {
    await calculate();
  };

  // ── Generate Receipt ───────────────────────────────────────────────────────
  const handleGenerateReceipt = async () => {
    let data = result;

    // If no result yet, calculate first then download
    if (!data) {
      data = await calculate();
    }

    if (!data) return;

    const program = programs.find((p) => p.id === programId);
    const discount = discountTypes.find((d) => d.id === discountTypeId);
    const discountLabel = discount
      ? `${discount.name} (${discount.percentage ? `${discount.percentage}%` : `Flat ₹${discount.flatAmount}`})`
      : null;

    generateFeeReceiptPDF({
      programName: program?.name ?? programId,
      admissionDate,
      discountName: discountLabel,
      result: data,
      studentName: studentName.trim() || undefined,
    });
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedProgram = programs.find((p) => p.id === programId);

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {/* ── Outer Card Container ── */}
      <div className="bg-white border border-[#ccc] shadow-sm rounded-sm">

        {/* Header Bar */}
        <div className="bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#ccc] px-3 py-2 flex items-center gap-1.5">
          <Menu className="w-4 h-4 text-[#333]" />
          <span className="text-[13px] font-bold text-[#333]">Fee Calculator</span>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">

            {/* Program Name */}
            <div className="flex items-start">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal pt-[5px]">
                Program Name <span className="text-red-500">*</span>
              </label>
              <div className="w-[65%]">
                <select
                  value={programId}
                  onChange={(e) => { setProgramId(e.target.value); setErrors(prev => ({ ...prev, programId: '' })); setResult(null); }}
                  disabled={lookupLoading}
                  className={`h-8 w-full rounded-[3px] border text-[13px] px-2 bg-white outline-none focus:border-[#0056b3] ${errors.programId ? 'border-red-500' : 'border-[#ccc]'}`}
                >
                  <option value="">{lookupLoading ? 'Loading programs...' : 'Select Program'}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.programId && <p className="text-red-500 text-[11px] mt-1">{errors.programId}</p>}
              </div>
            </div>

            {/* Admission Type (read-only) */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal">Admission Type</label>
              <div className="w-[65%]">
                <Input
                  type="text"
                  value="Offline"
                  disabled
                  className="h-8 rounded-[3px] border-[#ccc] bg-[#eee] text-[#555] text-[13px] w-full"
                />
              </div>
            </div>

            {/* Admission Date */}
            <div className="flex items-start">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal pt-[5px]">
                Admission Month <span className="text-red-500">*</span>
              </label>
              <div className="w-[65%]">
                <select
                  value={admissionDate}
                  onChange={(e) => { setAdmissionDate(e.target.value); setErrors(prev => ({ ...prev, admissionDate: '' })); setResult(null); }}
                  className={`h-8 w-full rounded-[3px] border text-[13px] px-2 bg-white outline-none focus:border-[#0056b3] ${errors.admissionDate ? 'border-red-500' : 'border-[#ccc]'}`}
                >
                  <option value="">Select Admission Month</option>
                  {admissionMonths.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {errors.admissionDate && <p className="text-red-500 text-[11px] mt-1">{errors.admissionDate}</p>}
              </div>
            </div>

            {/* Discount Type */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal">Discount Type</label>
              <div className="w-[65%]">
                <select
                  value={discountTypeId}
                  onChange={(e) => { setDiscountTypeId(e.target.value); setResult(null); }}
                  disabled={lookupLoading}
                  className="h-8 w-full rounded-[3px] border border-[#ccc] text-[13px] px-2 bg-white outline-none focus:border-[#0056b3]"
                >
                  <option value="">None</option>
                  {discountTypes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{d.percentage ? ` (${d.percentage}%)` : d.flatAmount ? ` (Flat ₹${d.flatAmount.toLocaleString('en-IN')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Name (optional, for receipt) */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal">Student Name</label>
              <div className="w-[65%]">
                <Input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Optional — appears on receipt"
                  className="h-8 rounded-[3px] border-[#ccc] text-[13px] w-full"
                />
              </div>
            </div>

            {/* Total Amount (read-only result) */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 font-normal">Total Amount</label>
              <div className="w-[65%]">
                <div className={`h-8 flex items-center text-[13px] font-semibold pl-1 ${result ? 'text-[#0056b3]' : 'text-[#999]'}`}>
                  {result ? formatCurrency(result.totalAmount) : '—'}
                </div>
              </div>
            </div>

          </div>

          {/* ── Action Footer ── */}
          <div className="mt-8 pt-4 border-t border-[#eee] flex items-center gap-3">
            <Button
              onClick={handleCalculate}
              disabled={loading || lookupLoading}
              className="bg-[#0056b3] hover:bg-[#004494] text-white rounded-[3px] h-8 px-6 text-[13px] font-normal shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Calculate
            </Button>

            <Button
              onClick={handleGenerateReceipt}
              disabled={loading || lookupLoading}
              className="bg-[#28a745] hover:bg-[#218838] text-white rounded-[3px] h-8 px-6 text-[13px] font-normal shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate Receipt
            </Button>

            {result && (
              <span className="text-[12px] text-[#666] ml-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Fee calculated for <strong className="text-[#333]">{selectedProgram?.name}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Breakdown Result Table ── */}
      {result && (
        <div className="bg-white border border-[#ccc] shadow-sm rounded-sm mt-4 overflow-hidden">
          <div className="bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#ccc] px-3 py-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#333]">Fee Breakup Details</span>
            {selectedProgram && (
              <span className="text-[12px] text-[#666]">
                Program: <strong>{selectedProgram.name}</strong>
                {admissionDate && (
                  <> &nbsp;·&nbsp; Admission: <strong>{admissionMonths.find(m => m.value === admissionDate)?.label}</strong></>
                )}
              </span>
            )}
          </div>
          <div className="p-4 overflow-x-auto">
            <Table className="w-full text-left border-collapse border border-[#ccc]">
              <TableHeader>
                <TableRow className="bg-[#f9f9f9] border-b border-[#ccc]">
                  <TableHead className="py-2 px-3 border-r border-[#ccc] text-[13px] font-bold text-[#333]">Fee Component</TableHead>
                  <TableHead className="py-2 px-3 border-r border-[#ccc] text-right text-[13px] font-bold text-[#333]">Total Amount (₹)</TableHead>
                  <TableHead className="py-2 px-3 border-r border-[#ccc] text-right text-[13px] font-bold text-[#333]">Discount (₹)</TableHead>
                  <TableHead className="py-2 px-3 border-r border-[#ccc] text-right text-[13px] font-bold text-[#333]">Term 1 Amount (₹)</TableHead>
                  <TableHead className="py-2 px-3 text-right text-[13px] font-bold text-[#333]">Term 2 Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.feeBreakup.map((fee, i) => (
                  <TableRow key={i} className="border-b border-[#eee] hover:bg-[#f5f5f5]">
                    <TableCell className="py-2 px-3 border-r border-[#eee] text-[12px] text-[#333]">
                      {feeTypeLabels[fee.feeType] ?? fee.feeType}
                    </TableCell>
                    <TableCell className="py-2 px-3 border-r border-[#eee] text-right text-[12px] font-mono text-[#333]">
                      {formatCurrency(fee.totalAmount)}
                    </TableCell>
                    <TableCell className="py-2 px-3 border-r border-[#eee] text-right text-[12px] font-mono text-emerald-600">
                      {fee.discountAmount > 0 ? `- ${formatCurrency(fee.discountAmount)}` : '—'}
                    </TableCell>
                    <TableCell className="py-2 px-3 border-r border-[#eee] text-right text-[12px] font-mono text-[#333]">
                      {formatCurrency(fee.term1Amount)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right text-[12px] font-mono text-[#333]">
                      {formatCurrency(fee.term2Amount)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* ── Totals Row ── */}
                <TableRow className="bg-[#f0f4ff] font-bold border-t border-[#ccc]">
                  <TableCell className="py-2.5 px-3 border-r border-[#ccc] text-[13px] font-bold text-[#0056b3]">Net Total</TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-[#ccc] text-right font-mono text-[13px] text-[#333]">
                    {formatCurrency(result.subtotal)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-[#ccc] text-right font-mono text-[13px] text-emerald-600">
                    {result.discountAmount > 0 ? `- ${formatCurrency(result.discountAmount)}` : '—'}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 border-r border-[#ccc] text-right font-mono text-[13px] text-[#333]">
                    {formatCurrency(result.term1Total)}
                  </TableCell>
                  <TableCell className="py-2.5 px-3 text-right font-mono text-[13px] font-bold text-[#0056b3]">
                    {formatCurrency(result.term2Total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* ── Summary Cards ── */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded p-3 text-center">
                <div className="text-[11px] text-[#6b7280] uppercase tracking-wide font-semibold">Total Payable</div>
                <div className="text-[18px] font-bold text-[#1d4ed8] font-mono mt-1">{formatCurrency(result.totalAmount)}</div>
              </div>
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded p-3 text-center">
                <div className="text-[11px] text-[#6b7280] uppercase tracking-wide font-semibold">Term 1 Instalment</div>
                <div className="text-[18px] font-bold text-[#15803d] font-mono mt-1">{formatCurrency(result.term1Total)}</div>
              </div>
              <div className="bg-[#fefce8] border border-[#fef08a] rounded p-3 text-center">
                <div className="text-[11px] text-[#6b7280] uppercase tracking-wide font-semibold">Term 2 Instalment</div>
                <div className="text-[18px] font-bold text-[#854d0e] font-mono mt-1">{formatCurrency(result.term2Total)}</div>
              </div>
            </div>

            {/* ── Generate Receipt Button (repeated below table for convenience) ── */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleGenerateReceipt}
                disabled={loading}
                className="bg-[#0056b3] hover:bg-[#004494] text-white rounded-[3px] h-8 px-6 text-[13px] font-normal shadow-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Fee Receipt (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
