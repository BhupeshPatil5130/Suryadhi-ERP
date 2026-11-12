import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Banknote, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/api/client';

export default function StudentForecastedRoyaltyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get('admissionId');

  const [studentInfo, setStudentInfo] = useState({
    name: 'Mahi Sachin Rathod',
    program: 'SUNOIA Senior',
    uin: 'SNK/3201/0052/2026',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (admissionId) {
      async function loadStudent() {
        setIsLoading(true);
        try {
          const res = await api.get(`/admissions/${admissionId}`);
          if (res.data?.success && res.data?.data) {
            const a = res.data.data;
            const s = a.student;
            setStudentInfo({
              name: s ? `${s.firstName} ${s.lastName}` : 'Student',
              program: (a.program?.name || 'SUNOIA Senior').replace(/euro/gi, 'SUNOIA'),
              uin: s?.uin || a.id,
            });
          }
        } catch (e) {
          // Keep defaults
        } finally {
          setIsLoading(false);
        }
      }
      loadStudent();
    }
  }, [admissionId]);

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4 font-sans text-slate-800">
      <h1 className="text-[22px] font-normal text-[#333] mb-4">Student Forecasted Royalty</h1>

      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">
        {/* Header grey bar */}
        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm flex items-center justify-between">
          <span className="font-semibold text-[13px] text-slate-700">≡ Student Forecasted Royalty</span>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Loading details...</span>
            </div>
          )}
        </div>

        <div className="border border-slate-300 p-6 min-h-[400px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
              <div className="flex gap-4">
                <span className="text-[13px] text-slate-700 w-[100px] text-right font-medium">Student Name:</span>
                <span className="text-[13px] text-slate-900 font-semibold">{studentInfo.name}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[13px] text-slate-700 w-[80px] text-right font-medium">Program:</span>
                <span className="text-[13px] text-slate-900">{studentInfo.program}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[13px] text-slate-700 w-[50px] text-right font-medium">UIN:</span>
                <span className="text-[13px] text-slate-900 font-mono">{studentInfo.uin}</span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-[#f2f2f2] px-3 py-2 border-b border-slate-300 flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-[13px] text-slate-700">Forecasted Details</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f2f2f2] border-b border-slate-300">
                    <th className="py-2.5 px-4 font-bold text-[13px] text-slate-700 text-center border-r border-slate-300 w-1/3">
                      Processed Month
                    </th>
                    <th className="py-2.5 px-4 font-bold text-[13px] text-slate-700 text-center border-r border-slate-300 w-1/3">
                      Forecasted Billed Flag
                    </th>
                    <th className="py-2.5 px-4 font-bold text-[13px] text-slate-700 text-center w-1/3">
                      Royalty Amount With GST
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[13px] text-slate-500 bg-[#f9f9f9]">
                      No records found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="pt-6">
            <Button
              onClick={() => navigate(-1)}
              className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-medium gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
