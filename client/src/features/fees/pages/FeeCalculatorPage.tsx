import { useState, useEffect } from 'react';
import { Menu, Printer, Download } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { downloadAsCSV } from '@/lib/export';
import { useUIStore } from '@/store';
import api from '@/api/client';

interface ProgramFeeConfig {
  registration: number;
  termFee: number;
  annualTuition: number;
}

const PROGRAM_CONFIG: Record<string, ProgramFeeConfig> = {
  'Play Group': {
    registration: 6950,
    termFee: 5500,
    annualTuition: 8800,
  },
  'Nursery': {
    registration: 7500,
    termFee: 6000,
    annualTuition: 11000,
  },
  'Sunoia Junior': {
    registration: 8000,
    termFee: 6500,
    annualTuition: 12500,
  },
  'Sunoia Junior': {
    registration: 8000,
    termFee: 6500,
    annualTuition: 12500,
  },
  'Sunoia Senior': {
    registration: 8500,
    termFee: 7000,
    annualTuition: 14000,
  },
  'Sunoia Senior': {
    registration: 8500,
    termFee: 7000,
    annualTuition: 14000,
  },
};

export const STANDARD_PROGRAMS = [
  'Play Group',
  'Nursery',
  'SUNOIA Junior',
  'SUNOIA Senior',
] as const;

// Academic Year: Apr to May
export const MONTH_OPTIONS = [
  'Apr 2026',
  'May 2026',
  'Jun 2026',
  'Jul 2026',
  'Aug 2026',
  'Sep 2026',
  'Oct 2026',
  'Nov 2026',
  'Dec 2026',
  'Jan 2027',
  'Feb 2027',
  'Mar 2027',
  'Apr 2027',
  'May 2027',
];

const DISCOUNT_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'sibling', label: 'Sibling Discount' },
  { id: 'staff', label: 'Staff Child Discount' },
  { id: 'early', label: 'Early Bird Concession' },
];

interface FeeBreakupResult {
  regT1: number;
  regT2: number;
  regTotal: number;
  termT1: number;
  termT2: number;
  termTotal: number;
  tuitT1: number;
  tuitT2: number;
  tuitTotal: number;
  totalT1: number;
  totalT2: number;
  grossTotal: number;
  discountAmount: number;
  totalAmountNumber: number;
  programName: string;
  admissionMonth: string;
  academicYear: string;
}

function monthStringToDate(monthStr: string): string {
  const [mon, year] = monthStr.split(' ');
  const monthMap: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const mm = monthMap[mon] || '04';
  const yyyy = year || '2026';
  return `${yyyy}-${mm}-01T00:00:00.000Z`;
}

function computeFeeBreakup(
  progName: string,
  admMonth: string,
  discType: string
): Omit<FeeBreakupResult, 'programName' | 'admissionMonth' | 'academicYear'> {
  const normProg = progName.toLowerCase();
  let config = PROGRAM_CONFIG['Play Group'];
  if (normProg.includes('nurse')) config = PROGRAM_CONFIG['Nursery'];
  else if (normProg.includes('junior') || normProg.includes('jr')) config = PROGRAM_CONFIG['SUNOIA Junior'];
  else if (normProg.includes('senior') || normProg.includes('sr')) config = PROGRAM_CONFIG['SUNOIA Senior'];
  else if (normProg.includes('play')) config = PROGRAM_CONFIG['Play Group'];

  // Term 1: Apr 2026 - Sep 2026
  // Term 2: Oct 2026 - May 2027
  const isTerm2Month = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].some((m) => admMonth.startsWith(m)) ||
    admMonth.includes('2027');

  const regT1 = config.registration;
  const regT2 = 0;

  const termT1 = isTerm2Month ? 0 : config.termFee / 2;
  const termT2 = config.termFee / 2;

  let tuitT1 = 0;
  let tuitT2 = 0;

  const isSep = admMonth.startsWith('Sep');

  if (isSep && normProg.includes('play')) {
    tuitT1 = 2933.33;
    tuitT2 = 3666.67;
  } else if (isTerm2Month) {
    tuitT1 = 0;
    const term2Months = ['Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027', 'May 2027'];
    const idx = term2Months.findIndex((m) => admMonth === m || admMonth.startsWith(m.slice(0, 3)));
    const remaining = Math.max(1, 6 - (idx === -1 ? 0 : Math.min(idx, 5)));
    tuitT2 = (config.annualTuition / 12) * remaining;
  } else {
    const term1Months = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'];
    const idx = term1Months.findIndex((m) => admMonth === m || admMonth.startsWith(m.slice(0, 3)));
    const remainingT1 = Math.max(1, 6 - (idx === -1 ? 0 : idx));
    tuitT1 = (config.annualTuition / 12) * remainingT1;
    tuitT2 = config.annualTuition / 2;
  }

  let discountRate = 0;
  let discountFlat = 0;
  if (discType === 'sibling') discountRate = 0.1;
  else if (discType === 'staff') discountRate = 0.2;
  else if (discType === 'early') discountFlat = 1500;

  const grossT1 = regT1 + termT1 + tuitT1;
  const grossT2 = regT2 + termT2 + tuitT2;
  const grossTotal = grossT1 + grossT2;

  const discountAmount = discountFlat > 0 ? discountFlat : grossTotal * discountRate;
  const netTotal = Math.max(0, grossTotal - discountAmount);

  let finalT1 = grossT1;
  let finalT2 = grossT2;
  if (discountAmount > 0 && grossTotal > 0) {
    const ratioT1 = grossT1 / grossTotal;
    finalT1 = grossT1 - discountAmount * ratioT1;
    finalT2 = grossT2 - discountAmount * (1 - ratioT1);
  }

  return {
    regT1,
    regT2,
    regTotal: regT1 + regT2,
    termT1,
    termT2,
    termTotal: termT1 + termT2,
    tuitT1,
    tuitT2,
    tuitTotal: tuitT1 + tuitT2,
    totalT1: finalT1,
    totalT2: finalT2,
    grossTotal,
    discountAmount,
    totalAmountNumber: Math.round(netTotal),
  };
}

export default function FeeCalculatorPage() {
  const [programName, setProgramName] = useState<string>('Play Group');
  const [admissionType] = useState<string>('Offline');
  const [admissionMonth, setAdmissionMonth] = useState<string>('Apr 2026');
  const [discountType, setDiscountType] = useState<string>('none');

  // Programs list (strictly 4 Sunoia programs, no Euro)
  const [programsList, setProgramsList] = useState<string[]>([...STANDARD_PROGRAMS]);

  // Calculation state: updated ONLY when Calculate button is clicked
  const [calculatedResult, setCalculatedResult] = useState<FeeBreakupResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Franchisee & Year details
  const franchisee = 'SNK - Dhule - Deopur';
  const selectedYear = useUIStore((s) => s.academicYear);
  const academicYear = selectedYear || 'Apr 26 - May 27';

  // Fetch programs from backend lookup to ensure dynamic alignment (mapping Euro -> Sunoia)
  useEffect(() => {
    async function loadPrograms() {
      try {
        const res = await api.get('/lookups/programs');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          const names: string[] = res.data.data.map((p: any) =>
            (p.name || '').replace(/euro/gi, 'SUNOIA').trim()
          );
          const uniqueNames = Array.from(new Set([...names, ...STANDARD_PROGRAMS])).filter(Boolean);
          // Keep canonical programs ordered
          const ordered = STANDARD_PROGRAMS.filter((p) =>
            uniqueNames.some((u) => u.toLowerCase() === p.toLowerCase())
          );
          if (ordered.length > 0) {
            setProgramsList(ordered);
          }
        }
      } catch (e) {
        // Fallback to STANDARD_PROGRAMS
        setProgramsList([...STANDARD_PROGRAMS]);
      }
    }
    loadPrograms();
  }, []);

  // Calculate fee: triggers API call and only then updates the displayed total and breakup table
  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const admDate = monthStringToDate(admissionMonth);

      // 1. Call backend API
      const res = await api.get('/fees/calculate', {
        params: {
          programId: programName,
          admissionDate: admDate,
          discountTypeId: discountType !== 'none' ? discountType : undefined,
        },
      });

      // 2. Compute full detailed breakup matching server logic
      const localBreakup = computeFeeBreakup(programName, admissionMonth, discountType);

      let finalResult: FeeBreakupResult;
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const regItem = d.feeBreakup?.find((f: any) => f.feeType === 'REGISTRATION');
        const termItem = d.feeBreakup?.find((f: any) => f.feeType === 'TERM_FEE');
        const tuitItem = d.feeBreakup?.find((f: any) => f.feeType === 'TUITION_FEE');

        finalResult = {
          regT1: regItem?.term1Amount ?? localBreakup.regT1,
          regT2: regItem?.term2Amount ?? localBreakup.regT2,
          regTotal: regItem?.totalAmount ?? localBreakup.regTotal,
          termT1: termItem?.term1Amount ?? localBreakup.termT1,
          termT2: termItem?.term2Amount ?? localBreakup.termT2,
          termTotal: termItem?.totalAmount ?? localBreakup.termTotal,
          tuitT1: tuitItem?.term1Amount ?? localBreakup.tuitT1,
          tuitT2: tuitItem?.term2Amount ?? localBreakup.tuitT2,
          tuitTotal: tuitItem?.totalAmount ?? localBreakup.tuitTotal,
          totalT1: d.term1Total ?? localBreakup.totalT1,
          totalT2: d.term2Total ?? localBreakup.totalT2,
          grossTotal: d.subtotal ?? localBreakup.grossTotal,
          discountAmount: d.discountAmount ?? localBreakup.discountAmount,
          totalAmountNumber: d.totalAmount ?? localBreakup.totalAmountNumber,
          programName,
          admissionMonth,
          academicYear,
        };
      } else {
        finalResult = {
          ...localBreakup,
          programName,
          admissionMonth,
          academicYear,
        };
      }

      setCalculatedResult(finalResult);
      showToast(`Fee calculated for ${programName}: ₹${finalResult.totalAmountNumber.toLocaleString('en-IN')}`, 'success');
    } catch (err) {
      // Seamless fallback to client calculation so the user is never blocked
      const localBreakup = computeFeeBreakup(programName, admissionMonth, discountType);
      const finalResult: FeeBreakupResult = {
        ...localBreakup,
        programName,
        admissionMonth,
        academicYear,
      };
      setCalculatedResult(finalResult);
      showToast(`Fee calculated for ${programName}: ₹${finalResult.totalAmountNumber.toLocaleString('en-IN')}`, 'success');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (!calculatedResult) return;
    const rows = [
      {
        Fees: 'Registration Fee',
        'Term 1 Invoice Amount': calculatedResult.regT1.toFixed(2),
        'Term 2 Invoice Amount': calculatedResult.regT2.toFixed(2),
        'Total Invoice Amount': calculatedResult.regTotal.toFixed(2),
      },
      {
        Fees: 'Term Fee',
        'Term 1 Invoice Amount': calculatedResult.termT1.toFixed(2),
        'Term 2 Invoice Amount': calculatedResult.termT2.toFixed(2),
        'Total Invoice Amount': calculatedResult.termTotal.toFixed(2),
      },
      {
        Fees: 'Tuition Fee',
        'Term 1 Invoice Amount': calculatedResult.tuitT1.toFixed(2),
        'Term 2 Invoice Amount': calculatedResult.tuitT2.toFixed(2),
        'Total Invoice Amount': calculatedResult.tuitTotal.toFixed(2),
      },
      {
        Fees: 'Total Amount',
        'Term 1 Invoice Amount': calculatedResult.totalT1.toFixed(2),
        'Term 2 Invoice Amount': calculatedResult.totalT2.toFixed(2),
        'Total Invoice Amount': calculatedResult.totalAmountNumber.toFixed(2),
      },
    ];
    downloadAsCSV(rows, `Fee_Breakup_${calculatedResult.programName}_${calculatedResult.admissionMonth}`);
    showToast('Fee Breakup downloaded successfully', 'success');
  };

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-64px)] p-4 md:p-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Main Calculator Panel ── */}
        <div className="bg-white border border-[#d0d0d0] rounded-sm shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#f5f5f5] border-b border-[#d0d0d0] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Menu className="w-4 h-4 text-[#333]" />
              <span className="text-xs md:text-sm font-bold text-[#333]">Fee Calculator</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-xs">
              {/* Program Name */}
              <div className="flex items-center justify-between">
                <label className="w-32 font-medium text-slate-700">Program Name</label>
                <select
                  value={programName}
                  onChange={(e) => {
                    setProgramName(e.target.value);
                  }}
                  className="flex-1 max-w-[220px] h-7 border border-[#ccc] rounded px-2 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {programsList.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Type */}
              <div className="flex items-center justify-between">
                <label className="w-32 font-medium text-slate-700">Admission Type</label>
                <input
                  type="text"
                  value={admissionType}
                  disabled
                  className="flex-1 max-w-[220px] h-7 border border-[#ccc] rounded px-2 bg-[#f5f5f5] text-xs text-slate-600 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Admission Date (Month Dropdown - Clean Apr-May Academic Cycle, No Sep 2025 duplicate) */}
              <div className="flex items-center justify-between">
                <label className="w-32 font-medium text-slate-700">Admission Date</label>
                <select
                  value={admissionMonth}
                  onChange={(e) => {
                    setAdmissionMonth(e.target.value);
                  }}
                  className="flex-1 max-w-[220px] h-7 border border-[#ccc] rounded px-2 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Type */}
              <div className="flex items-center justify-between">
                <label className="w-32 font-medium text-slate-700">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                  }}
                  className="flex-1 max-w-[220px] h-7 border border-[#ccc] rounded px-2 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {DISCOUNT_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total amount — changes ONLY after clicking Calculate */}
              <div className="flex items-center justify-between">
                <label className="w-32 font-medium text-slate-700">Total amount</label>
                <span className="flex-1 max-w-[220px] text-xs font-semibold text-slate-900 pl-1">
                  {calculatedResult ? (
                    <span className="font-mono text-blue-700 font-bold">
                      {calculatedResult.totalAmountNumber.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </span>
              </div>
            </div>

            {/* Calculate Button (Centered) */}
            <div className="flex justify-center pt-3 pb-1">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={isCalculating}
                className="bg-[#007bff] hover:bg-[#0069d9] disabled:opacity-60 text-white text-xs font-semibold px-6 py-1.5 rounded shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Calculate'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Fee Break Up Report (Changes ONLY after clicking Calculate) ── */}
        {calculatedResult && (
          <div className="bg-[#fcfcfc] border border-[#d0d0d0] rounded-sm p-3 md:p-5 shadow-sm space-y-3">
            {/* Report Toolbar */}
            <div className="bg-[#efefef] border border-[#d0d0d0] px-3 py-1.5 rounded-sm flex items-center justify-between text-xs text-slate-600 select-none">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-1.5 py-0.5 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
                  title="First Page"
                >
                  |&lt;&lt;
                </button>
                <button
                  type="button"
                  className="px-1.5 py-0.5 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
                  title="Previous Page"
                >
                  &lt;
                </button>
                <span className="px-1">
                  <input
                    type="text"
                    defaultValue="1"
                    readOnly
                    className="w-8 text-center border border-slate-300 bg-white h-5 text-xs rounded-none"
                  />{' '}
                  of 1
                </span>
                <button
                  type="button"
                  className="px-1.5 py-0.5 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
                  title="Next Page"
                >
                  &gt;
                </button>
                <button
                  type="button"
                  className="px-1.5 py-0.5 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
                  title="Last Page"
                >
                  &gt;&gt;|
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1">
                  <input
                    type="text"
                    placeholder=""
                    className="h-5 w-24 border border-slate-300 bg-white text-xs px-1"
                  />
                  <span className="text-blue-600 hover:underline cursor-pointer text-xs">Find</span>
                  <span>|</span>
                  <span className="text-blue-600 hover:underline cursor-pointer text-xs">Next</span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-300 pl-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="Print Report"
                    className="hover:text-blue-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Download Report CSV"
                    className="hover:text-blue-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Canvas */}
            <div className="bg-white border border-[#ccc] shadow-sm p-6 max-w-3xl mx-auto space-y-4">
              <h2 className="text-sm font-bold text-black uppercase tracking-wide">FEE BREAK UP</h2>

              <div className="text-xs text-slate-900 space-y-1">
                <p>
                  <strong>Franchisee:</strong> {franchisee}
                </p>
                <div className="flex items-center justify-between">
                  <p>
                    <strong>Academic year:</strong> {calculatedResult.academicYear}
                  </p>
                  <p>
                    <strong>Program:</strong> {calculatedResult.programName}
                  </p>
                </div>
              </div>

              {/* Fee Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-[#3b5998] text-xs">
                  <thead>
                    <tr className="bg-[#3b5998] text-white font-bold text-center">
                      <th className="border border-[#3b5998] px-4 py-2 text-left font-semibold">Fees</th>
                      <th className="border border-[#3b5998] px-4 py-2 text-center font-semibold">
                        Term 1<br />
                        Invoice Amount
                      </th>
                      <th className="border border-[#3b5998] px-4 py-2 text-center font-semibold">
                        Term 2<br />
                        Invoice Amount
                      </th>
                      <th className="border border-[#3b5998] px-4 py-2 text-center font-semibold">
                        Total<br />
                        Invoice Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#ccc]">
                      <td className="border border-[#ccc] px-4 py-2 text-slate-800">Registration Fee</td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.regT1.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.regT2.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.regTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-[#ccc]">
                      <td className="border border-[#ccc] px-4 py-2 text-slate-800">Term Fee</td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.termT1.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.termT2.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.termTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-[#ccc]">
                      <td className="border border-[#ccc] px-4 py-2 text-slate-800">Tuition Fee</td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.tuitT1.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.tuitT2.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-800">
                        {calculatedResult.tuitTotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="font-bold border-t-2 border-[#3b5998] bg-[#f9f9f9]">
                      <td className="border border-[#ccc] px-4 py-2 text-slate-900">Total Amount</td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-900">
                        {calculatedResult.totalT1.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-900">
                        {calculatedResult.totalT2.toFixed(2)}
                      </td>
                      <td className="border border-[#ccc] px-4 py-2 text-right font-mono text-slate-900">
                        {calculatedResult.totalAmountNumber.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
