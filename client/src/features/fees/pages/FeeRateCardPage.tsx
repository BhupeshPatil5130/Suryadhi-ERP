import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiDownload } from '@/lib/downloadUtils';

interface FeeStructure {
  program: string;
  regFee: number;
  termFee: number;
  tuitionFee: number;
  homeSunnyAppFee: number;
  uniforms: number;
  total: number;
}

const APPROVED_FEE_RATES: FeeStructure[] = [
  { program: 'Play Group', regFee: 6950, termFee: 5500, tuitionFee: 9500, homeSunnyAppFee: 5900, uniforms: 0, total: 27850 },
  { program: 'Nursery', regFee: 7500, termFee: 6000, tuitionFee: 11000, homeSunnyAppFee: 6500, uniforms: 0, total: 31000 },
  { program: 'Sunoia Junior', regFee: 8000, termFee: 6500, tuitionFee: 12500, homeSunnyAppFee: 7000, uniforms: 1500, total: 35500 },
  { program: 'Sunoia Senior', regFee: 8500, termFee: 7000, tuitionFee: 14000, homeSunnyAppFee: 7500, uniforms: 1500, total: 38500 },
];

export default function FeeRateCardPage() {
  const [rates] = useState<FeeStructure[]>(APPROVED_FEE_RATES);
  const franchisee = 'SNK - Dhule - Deopur';
  const feeYear = 'Apr 26 - Mar 27';

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[24px] font-normal text-[#333]">Approved Fee Card</h1>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
            <span><strong>Franchisee:</strong> {franchisee}</span>
            <span>•</span>
            <span><strong>Approved Fee Card:</strong> {feeYear}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-sm">
            <CheckCircle className="w-3.5 h-3.5" /> Approved Fee Card
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-white"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" /> Print Card
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-white"
            onClick={() => apiDownload(
              'approved-fee-card',
              {},
              rates.map(r => ({
                'Program': r.program,
                'Registration Fee': r.regFee,
                'Term Fee': r.termFee,
                'Tuition Fee': r.tuitionFee,
                'HomeSunny App Fee': r.homeSunnyAppFee,
                ...(r.uniforms > 0 ? { 'Uniforms': r.uniforms } : {}),
                'Total': r.total,
              })),
              'approved-fee-card'
            )}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rates.map((r, idx) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
          return (
            <Card key={r.program} className="shadow-sm border-slate-200">
              <CardContent className="p-4 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{r.program}</div>
                <div className="text-2xl font-bold text-slate-800">{formatCurrency(r.total)}</div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Reg: {formatCurrency(r.regFee)}</span>
                  <span>Term: {formatCurrency(r.termFee)}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Tuition: {formatCurrency(r.tuitionFee)}</span>
                  <span>HomeSunny: {formatCurrency(r.homeSunnyAppFee)}</span>
                </div>
                {r.uniforms > 0 && (
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Uniforms: {formatCurrency(r.uniforms)}</span>
                  </div>
                )}
                <div className="mt-2 h-1 w-full rounded" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tables */}
      <div className="bg-white border border-[#ccc] shadow-sm rounded-sm space-y-6 p-4">
        <div className="bg-[#f2f2f2] px-4 py-2.5 border-b border-[#ccc] -mx-4 -mt-4 mb-2 flex items-center justify-between">
          <span className="font-semibold text-[13px] text-slate-700">
            ≡ Approved Fee Card {feeYear} — Franchisee: {franchisee}
          </span>
        </div>

        {/* 1. Play Group & Nursery: Completely remove the Uniforms column */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Play Group & Nursery
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#ccc] text-[13px]">
              <thead>
                <tr className="bg-[#f9f9f9]">
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333]">Program</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Registration Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Term Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Tuition Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">HomeSunny App Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rates.filter(r => r.uniforms === 0).map((row) => (
                  <tr key={row.program} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-[#ccc] font-semibold text-slate-800">{row.program}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.regFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.termFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.tuitionFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.homeSunnyAppFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono font-bold text-[#0056b3]">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Sunoia Junior & Sunoia Senior: Column name "Uniforms" without bracketed text */}
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Sunoia Junior & Sunoia Senior
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#ccc] text-[13px]">
              <thead>
                <tr className="bg-[#f9f9f9]">
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333]">Program</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Registration Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Term Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Tuition Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">HomeSunny App Fee</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Uniforms</th>
                  <th className="p-2.5 border border-[#ccc] font-bold text-[#333] text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rates.filter(r => r.uniforms > 0).map((row) => (
                  <tr key={row.program} className="hover:bg-slate-50">
                    <td className="p-2.5 border border-[#ccc] font-semibold text-slate-800">{row.program}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.regFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.termFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.tuitionFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono">{formatCurrency(row.homeSunnyAppFee)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono font-medium">{formatCurrency(row.uniforms)}</td>
                    <td className="p-2.5 border border-[#ccc] text-right font-mono font-bold text-[#0056b3]">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Please Note 7 Items */}
      <div className="bg-slate-50 border border-slate-300 rounded-sm p-5 space-y-3">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Info className="w-4 h-4 text-blue-600" /> Please Note:
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 leading-relaxed pl-1">
          <li>The Fee Payment has to be done on <strong>Half Yearly basis only</strong>.</li>
          <li>Every child is eligible for a <strong>Welcome Kit</strong>.</li>
          <li>All payments of gross fee collection to be made by cross a/c payee <strong>Cheque / Demand Draft only</strong>.</li>
          <li>Cheque for the Total Fee to be drawn in favour of <strong>&ldquo;SURYADHI&rdquo;</strong>.</li>
          <li>Taxes as applicable.</li>
          <li>Cheque bounced Charges <strong>Rs 500</strong> for every cheque return.</li>
          <li><strong>No refund of fees</strong>.</li>
        </ol>
        <div className="pt-2 text-[11px] text-slate-500 font-medium">
          Suryadhi Learning Pvt. Ltd.
        </div>
      </div>
    </div>
  );
}
