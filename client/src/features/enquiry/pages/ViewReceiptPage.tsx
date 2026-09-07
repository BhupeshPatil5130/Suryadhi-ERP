import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, FileText, Plus, Loader2, Receipt, ArrowLeft } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';

interface AdvanceReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: string;
  bankName?: string | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  notes?: string | null;
}

interface EnquiryData {
  id: string;
  enquirerName: string;
  studentFirstName?: string;
  studentLastName?: string;
  student?: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  program?: {
    name: string;
  };
}

export default function ViewReceiptPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [enquiry, setEnquiry] = useState<EnquiryData | null>(null);
  const [receipts, setReceipts] = useState<AdvanceReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [enquiryRes, receiptsRes] = await Promise.all([
          api.get(`/enquiries/${id}`),
          api.get(`/enquiries/${id}/advance-receipts`),
        ]);

        if (enquiryRes.data.success) {
          setEnquiry(enquiryRes.data.data);
        }

        if (receiptsRes.data.success) {
          setReceipts(receiptsRes.data.data || []);
        } else if (enquiryRes.data.data?.advanceReceipts) {
          setReceipts(enquiryRes.data.data.advanceReceipts);
        }
      } catch (err: any) {
        console.error('Failed to load enquiry receipts data', err);
        showToast('Could not load receipts data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const studentName = enquiry?.student
    ? `${enquiry.student.firstName} ${enquiry.student.middleName || ''} ${enquiry.student.lastName}`.trim()
    : enquiry?.studentFirstName
    ? `${enquiry.studentFirstName} ${enquiry.studentLastName || ''}`.trim()
    : enquiry?.enquirerName
    ? `Child of ${enquiry.enquirerName}`
    : 'N/A';

  const programName = enquiry?.program?.name || 'N/A';

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-slate-500">Loading receipts data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-slate-800">View Receipt</h1>
        <Button
          onClick={() => navigate('/enquiry')}
          variant="outline"
          className="h-8 text-xs flex items-center gap-1 border-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Enquiries
        </Button>
      </div>

      <Card className="border-slate-300 shadow-sm rounded-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-300 py-3 px-4">
          <CardTitle className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
            <Menu className="h-4 w-4" />
            View Advance Receipts
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 bg-[#f9f9f9]">
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-8 text-[13px] text-slate-800 px-8">
              <div className="flex gap-12">
                <span className="font-normal text-slate-600">Student Name</span>
                <span className="font-medium text-slate-900">{studentName}</span>
              </div>
              <div className="flex gap-6">
                <span className="font-normal text-slate-600">Program</span>
                <span className="font-medium text-slate-900">{programName}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-sm bg-white overflow-hidden">
              <div className="bg-gradient-to-b from-[#f9f9f9] to-[#ececec] border-b border-slate-300 py-2 px-3 flex justify-between items-center">
                <div className="font-bold text-[13px] text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Receipts
                </div>
                <Link to={`/enquiry/${id}/receipts/add`}>
                  <Button size="sm" className="bg-[#0056b3] hover:bg-[#004494] text-white h-7 text-xs px-3 shadow-none rounded-sm flex items-center gap-1 font-semibold">
                    <Plus className="h-3.5 w-3.5" />
                    Add Receipt
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#f5f5f5] text-slate-700 font-bold border-b border-slate-300 text-[13px]">
                    <tr>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Receipt Date</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Receipt Number</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Payment Mode</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Cheque / Bank Details</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Amount</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="h-24 bg-white text-center text-slate-500 text-xs border-b border-slate-200 py-6">
                          <Receipt className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                          No advance receipts recorded for this enquiry yet.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((r) => (
                        <tr key={r.id} className="bg-white border-b border-slate-200 hover:bg-slate-50 text-[13px]">
                          <td className="px-4 py-3 text-center border-r border-slate-200">
                            {r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 font-mono text-xs font-semibold text-slate-800">
                            {r.receiptNumber}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 capitalize text-slate-700">
                            {r.paymentMode?.toLowerCase().replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 text-xs text-slate-600">
                            {r.chequeNumber ? `Cheque No: ${r.chequeNumber}` : ''}
                            {r.bankName ? ` (${r.bankName})` : ''}
                            {!r.chequeNumber && !r.bankName ? '—' : ''}
                          </td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 font-semibold text-emerald-700">
                            ₹{Number(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs text-slate-500 italic">Saved</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-[#f2f2f2] border-t border-slate-300 p-4 px-12 mt-6 flex justify-between items-center">
            <Button 
              onClick={() => navigate(-1)} 
              className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold"
            >
              Back
            </Button>
            <Link to={`/enquiry/${id}/receipts/add`}>
              <Button 
                className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add New Advance Receipt
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
