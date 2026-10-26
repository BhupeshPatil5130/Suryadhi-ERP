import { useState } from 'react';
import { Menu, Calculator, RotateCcw, FileText, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/lib/toast';

interface FeeStructure {
  registration: number;
  term1TermFee: number;
  term2TermFee: number;
  term1Tuition: number;
  term2Tuition: number;
}

const PROGRAM_FEE_MAP: Record<string, FeeStructure> = {
  'Play Group': {
    registration: 6950,
    term1TermFee: 2950,
    term2TermFee: 2950,
    term1Tuition: 4750,
    term2Tuition: 4750,
  },
  'Nursery': {
    registration: 7200,
    term1TermFee: 3200,
    term2TermFee: 3200,
    term1Tuition: 5200,
    term2Tuition: 5200,
  },
  'Sunoia Junior': {
    registration: 7500,
    term1TermFee: 3500,
    term2TermFee: 3500,
    term1Tuition: 5600,
    term2Tuition: 5600,
  },
  'Sunoia Senior': {
    registration: 7800,
    term1TermFee: 3800,
    term2TermFee: 3800,
    term1Tuition: 6000,
    term2Tuition: 6000,
  },
};

const ADMISSION_PERIODS = [
  'Apr. 26 to Mar. 27',
  'Aug. 26 to Sep. 26',
  'Oct. 26 to Jan 27',
  'Jan. 27 to Mar. 27',
];

const DISCOUNTS = [
  { id: 'none', label: 'None (0%)', rate: 0 },
  { id: 'sibling', label: 'Sibling Discount (10%)', rate: 0.10 },
  { id: 'staff', label: 'Staff Child Discount (20%)', rate: 0.20 },
  { id: 'early', label: 'Early Bird Concession (₹1,500 Flat)', rate: 0, flat: 1500 },
];

export default function FeeCalculatorPage() {
  const [programName, setProgramName] = useState<string>('Play Group');
  const [admissionType] = useState<string>('offline');
  const [admissionDate, setAdmissionDate] = useState<string>('Apr. 26 to Mar. 27');
  const [discountId, setDiscountId] = useState<string>('none');
  const [calculated, setCalculated] = useState<boolean>(true);

  const currentFee = PROGRAM_FEE_MAP[programName] || PROGRAM_FEE_MAP['Play Group'];
  const discountObj = DISCOUNTS.find((d) => d.id === discountId) || DISCOUNTS[0];

  // Base calculations
  const regFee = currentFee.registration;
  const term1Term = currentFee.term1TermFee;
  const term2Term = currentFee.term2TermFee;
  const totalTerm = term1Term + term2Term;

  const term1Tuition = currentFee.term1Tuition;
  const term2Tuition = currentFee.term2Tuition;
  const totalTuition = term1Tuition + term2Tuition;

  const term1Total = regFee + term1Term + term1Tuition;
  const term2Total = term2Term + term2Tuition;
  const grossTotal = term1Total + term2Total;

  // Discount
  let discountAmount = 0;
  if (discountObj.flat) {
    discountAmount = discountObj.flat;
  } else if (discountObj.rate > 0) {
    discountAmount = Math.round(grossTotal * discountObj.rate);
  }
  const netTotal = grossTotal - discountAmount;

  const handleCalculate = () => {
    setCalculated(true);
    showToast(`Calculated fee for ${programName}: ₹${netTotal.toLocaleString('en-IN')}`, 'success');
  };

  const handleReset = () => {
    setProgramName('Play Group');
    setAdmissionDate('Apr. 26 to Mar. 27');
    setDiscountId('none');
    setCalculated(true);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 pt-2 space-y-6">
      {/* ── Main Tool Card ── */}
      <div className="bg-white border border-[#ccc] shadow-sm rounded-sm">
        {/* Header Bar */}
        <div className="bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#ccc] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4 text-[#333]" />
            <span className="text-sm font-bold text-[#333]">Fee Calculator</span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Franchisee: <span className="text-blue-700 font-bold">Sk-Dhule-Deopur</span> | Academic Year: <span className="text-slate-800 font-bold">Apr 26 - Mar 27</span>
          </span>
        </div>

        {/* Calculator Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
            {/* 1. Program Name */}
            <div className="flex items-center">
              <label className="w-[35%] text-xs text-slate-700 text-right pr-4 font-semibold">
                1. Program Name <span className="text-red-500">*</span>
              </label>
              <div className="w-[65%]">
                <select
                  value={programName}
                  onChange={(e) => {
                    setProgramName(e.target.value);
                    setCalculated(true);
                  }}
                  className="h-8 w-full rounded border border-slate-300 text-xs px-2.5 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  <option value="Play Group">Play Group</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Sunoia Junior">Sunoia Junior</option>
                  <option value="Sunoia Senior">Sunoia Senior</option>
                </select>
              </div>
            </div>

            {/* 2. Admission Type (offline) */}
            <div className="flex items-center">
              <label className="w-[35%] text-xs text-slate-700 text-right pr-4 font-semibold">
                2. Admission Type
              </label>
              <div className="w-[65%]">
                <input
                  type="text"
                  value={admissionType}
                  disabled
                  className="h-8 w-full rounded border border-slate-200 bg-slate-100 text-slate-700 text-xs px-2.5 capitalize font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* 3. Admission Date */}
            <div className="flex items-center">
              <label className="w-[35%] text-xs text-slate-700 text-right pr-4 font-semibold">
                3. Admission Date <span className="text-red-500">*</span>
              </label>
              <div className="w-[65%]">
                <select
                  value={admissionDate}
                  onChange={(e) => {
                    setAdmissionDate(e.target.value);
                    setCalculated(true);
                  }}
                  className="h-8 w-full rounded border border-slate-300 text-xs px-2.5 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  {ADMISSION_PERIODS.map((period) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Discount */}
            <div className="flex items-center">
              <label className="w-[35%] text-xs text-slate-700 text-right pr-4 font-semibold">
                4. Discount
              </label>
              <div className="w-[65%]">
                <select
                  value={discountId}
                  onChange={(e) => {
                    setDiscountId(e.target.value);
                    setCalculated(true);
                  }}
                  className="h-8 w-full rounded border border-slate-300 text-xs px-2.5 bg-white outline-none focus:border-blue-600 font-medium"
                >
                  {DISCOUNTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Note: Student Name box erased as per Requirement 5: "Erase the box of student name – Total Update" */}
          </div>

          {/* Action Button Row */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCalculate}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-6 text-xs font-semibold rounded shadow-sm flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                Calculator Button
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="h-8 px-4 text-xs font-medium rounded border-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Net Estimated Fee:</span>
              <span className="text-base font-black text-blue-700 font-mono">
                ₹{netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fee Breakup Tables (Section 22) ── */}
      {calculated && (
        <div className="space-y-6">
          {/* Table 1: Fee Breakup */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xs md:text-sm font-bold text-slate-800">
                  Fee Breakup Franchisee: <span className="text-blue-700 font-extrabold">Sk-Dhule-Deopur</span> | Academic year: <span className="font-extrabold">Apr 26 - Mar 27</span> | Program: <span className="text-emerald-700 font-extrabold">{programName}</span>
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-800 border-none font-mono text-[11px]">
                  Term 1: Apr–Sep | Term 2: Oct–Mar
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f0f4f8] text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Fees</th>
                    <th className="px-4 py-2.5 text-right">Term 1 Invoice Amount</th>
                    <th className="px-4 py-2.5 text-right">Term 2 Invoice Amount</th>
                    <th className="px-4 py-2.5 text-right">Total Invoice Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">Registration Fee</td>
                    <td className="px-4 py-2.5 text-right font-mono">{regFee.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{regFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">Term Fee</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term1Term.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term2Term.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{totalTerm.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">Tuition Fee</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term1Tuition.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term2Tuition.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{totalTuition.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td className="px-4 py-2.5 uppercase tracking-wider text-blue-800">Total amount</td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-800">{term1Total.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-800">{term2Total.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-800 font-black text-sm">{grossTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Table 2: Fee Calculator: (Fee Breakup Installments) */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
              <CardTitle className="text-xs md:text-sm font-bold text-slate-800">
                Fee Calculator: (Fee Breakup Installments)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f0f4f8] text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Particular</th>
                    <th className="px-4 py-2.5 text-right">Registration Fee</th>
                    <th className="px-4 py-2.5 text-right">Term Fee</th>
                    <th className="px-4 py-2.5 text-right">Tuition Fee</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">First Installment</td>
                    <td className="px-4 py-2.5 text-right font-mono">{regFee.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term1Term.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term1Tuition.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{term1Total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">Second Installment</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term2Term.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{term2Tuition.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">{term2Total.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td className="px-4 py-2.5 uppercase tracking-wider text-emerald-800">Total</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-800">{regFee.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-800">{totalTerm.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-800">{totalTuition.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-800 font-black text-sm">{grossTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Table 3: Period-wise Installment Matrix */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200 py-3 px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xs md:text-sm font-bold text-slate-800">
                  Admission Period Fee Matrix (Installment Breakup)
                </CardTitle>
                <span className="text-[11px] font-semibold text-slate-500 italic">
                  First Term - April to September, Second Term - October To March
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f0f4f8] text-slate-700 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Particular</th>
                    <th className="px-3 py-2.5 text-right">Inst. 1 Reg</th>
                    <th className="px-3 py-2.5 text-right">Inst. 1 Term</th>
                    <th className="px-3 py-2.5 text-right">Inst. 1 Tuition</th>
                    <th className="px-3 py-2.5 text-right">Inst. 2 Reg</th>
                    <th className="px-3 py-2.5 text-right">Inst. 2 Term</th>
                    <th className="px-3 py-2.5 text-right">Inst. 2 Tuition</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className={admissionDate === 'Apr. 26 to Mar. 27' ? 'bg-blue-50/70 font-semibold' : ''}>
                    <td className="px-4 py-2.5 text-slate-800">Apr. 26 to Mar. 27</td>
                    <td className="px-3 py-2.5 text-right font-mono">6950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">4750.00</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">4750.00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">22350.00</td>
                  </tr>
                  <tr className={admissionDate === 'Aug. 26 to Sep. 26' ? 'bg-blue-50/70 font-semibold' : ''}>
                    <td className="px-4 py-2.5 text-slate-800">Aug. 26 to Sep. 26</td>
                    <td className="px-3 py-2.5 text-right font-mono">6950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2375.00</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">4750.00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">19975.00</td>
                  </tr>
                  <tr className={admissionDate === 'Oct. 26 to Jan 27' ? 'bg-blue-50/70 font-semibold' : ''}>
                    <td className="px-4 py-2.5 text-slate-800">Oct. 26 to Jan 27</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono">6950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">4750.00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">14650.00</td>
                  </tr>
                  <tr className={admissionDate === 'Jan. 27 to Mar. 27' ? 'bg-blue-50/70 font-semibold' : ''}>
                    <td className="px-4 py-2.5 text-slate-800">Jan. 27 to Mar. 27</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">-</td>
                    <td className="px-3 py-2.5 text-right font-mono">6950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2950.00</td>
                    <td className="px-3 py-2.5 text-right font-mono">2375.00</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">12275.00</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Academic Terms Note */}
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
            <span className="font-bold text-slate-800">Term Schedule: </span>
            <span>First Term - April to September, Second Term - October To March. All fee calculations are based on approved rate cards for Suryadhi Learning Pvt. Ltd.</span>
          </div>
        </div>
      )}
    </div>
  );
}
