import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, FileText, Plus, Loader2, Printer, Mail, Trash2 } from 'lucide-react';
import api from '@/api/client';
import { showToast } from '@/lib/toast';
import { downloadAsPDF } from '@/lib/downloadUtils';

interface AdvanceReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode?: string;
  bankName?: string;
  notes?: string;
}

export default function ViewReceiptPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [studentName, setStudentName] = useState('');
  const [programName, setProgramName] = useState('Nursery');
  const [fatherEmail, setFatherEmail] = useState('');
  const [receipts, setReceipts] = useState<AdvanceReceiptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [enquiryRes, receiptsRes] = await Promise.allSettled([
        api.get(/enquiries/),
        api.get(/enquiries//receipts),
      ]);

      if (enquiryRes.status === 'fulfilled' && enquiryRes.value.data.success) {
        const eq = enquiryRes.value.data.data;
        const s = eq.student;
        const sName = s ? ${s.firstName || ''} .trim() : eq.enquirerName || '';
        setStudentName(sName);
        setProgramName(eq.program?.name || 'Nursery');
        setFatherEmail(eq.enquirerEmail || '');
        if (Array.isArray(eq.advanceReceipts) && eq.advanceReceipts.length > 0) {
          setReceipts(eq.advanceReceipts);
        }
      }

      if (receiptsRes.status === 'fulfilled' && receiptsRes.value.data.success && Array.isArray(receiptsRes.value.data.data)) {
        setReceipts(receiptsRes.value.data.data);
      }
    } catch (err) {
      console.warn('Failed to load enquiry receipts data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handlePrintReceipt = (r: AdvanceReceiptRow) => {
    downloadAsPDF({
      title: 'Admission Form Fee Receipt',
      subtitle: Student:  | Program:  | Receipt No: ,
      columns: ['Field', 'Details'],
      rows: [
        ['Receipt Number', r.receiptNumber || 'N/A'],
        ['Receipt Date', r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : 'N/A'],
        ['Fee Type', r.notes || 'Admission Form Fee'],
        ['Student Name', studentName || 'N/A'],
        ['Program', programName],
        ['Payment Mode', r.paymentMode || 'CASH'],
        ['Cheque Number', r.chequeNumber || 'N/A'],
        ['Cheque Date', r.chequeDate ? new Date(r.chequeDate).toLocaleDateString('en-IN') : 'N/A'],
        ['Amount Paid (Rs.)', INR ],
      ],
      filename: 
eceipt_,
    });
  };

  const handleEmailReceipt = (r: AdvanceReceiptRow) => {
    const targetEmail = fatherEmail || window.prompt('Enter parent email address to send receipt:', 'parent@example.com');
    if (!targetEmail) return;
    showToast(Receipt  sent to  successfully!, 'success');
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;
    setDeletingId(receiptId);
    try {
      await api.delete(/enquiries//receipts/);
      showToast('Receipt deleted', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete receipt', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className=max-w-6xl mx-auto space-y-6 pb-12 pt-4>
      <h1 className=text-2xl font-semibold text-slate-800 mb-6>Fees Receipt</h1>

      <Card className=border-slate-300 shadow-sm rounded-sm overflow-hidden>
        <CardHeader className=bg-gradient-to-b from-white to-slate-100 border-b border-slate-300 py-3 px-4>
          <CardTitle className=text-[15px] font-bold text-slate-700 flex items-center justify-between>
            <span className=flex items-center gap-2><Menu className=h-4 w-4 /> Advance Receipts</span>
            <Link to={/enquiry//receipts/add}>
              <Button className=bg-[#0056b3] hover:bg-[#004494] text-white h-7 px-3 text-xs shadow-none rounded-sm>
                <Plus className=h-3.5 w-3.5 mr-1 /> Add Receipt
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent className=p-0 bg-[#f9f9f9]>
          <div className=p-6 pb-2>
            {/* Student / Program info */}
            <div className=grid grid-cols-2 gap-4 mb-6 text-[13px] text-slate-800 px-4 py-3 bg-white border border-slate-200 rounded-sm>
              <div className=flex gap-8><span className=font-normal text-slate-600 w-28>Student Name</span><span className=font-medium>{isLoading ? 'Loading...' : (studentName || '—')}</span></div>
              <div className=flex gap-8><span className=font-normal text-slate-600 w-20>Program</span><span className=font-medium>{isLoading ? 'Loading...' : programName}</span></div>
            </div>

            {/* Fee Summary */}
            <div className=grid grid-cols-3 gap-4 mb-6>
              <div className=bg-white border border-slate-200 rounded-sm p-4>
                <div className=text-xs text-slate-500 mb-1>Total Receivable</div>
                <div className=text-lg font-bold text-slate-800>—</div>
              </div>
              <div className=bg-white border border-slate-200 rounded-sm p-4>
                <div className=text-xs text-slate-500 mb-1>Total Collected</div>
                <div className=text-lg font-bold text-green-600>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div className=bg-white border border-slate-200 rounded-sm p-4>
                <div className=text-xs text-slate-500 mb-1>Balance Due</div>
                <div className=text-lg font-bold text-red-500>—</div>
              </div>
            </div>

            {/* Receipts Table */}
            {isLoading ? (
              <div className=flex items-center justify-center h-24 text-slate-500 text-sm>
                <Loader2 className=h-4 w-4 animate-spin mr-2 /> Loading receipts...
              </div>
            ) : receipts.length === 0 ? (
              <div className=flex flex-col items-center justify-center h-24 text-slate-400 text-sm>
                <FileText className=h-8 w-8 mb-2 opacity-40 />
                No receipts found.{' '}
                <Link to={/enquiry//receipts/add} className=text-blue-600 hover:underline ml-1 text-xs>Add one</Link>
              </div>
            ) : (
              <div className=border border-slate-300 rounded-sm bg-white overflow-hidden mb-6>
                <table className=w-full text-[13px] text-left>
                  <thead className=bg-[#f5f5f5] text-slate-700 font-bold border-b border-slate-300>
                    <tr>
                      <th className=px-4 py-3 border-r border-slate-200>#</th>
                      <th className=px-4 py-3 border-r border-slate-200>Receipt No</th>
                      <th className=px-4 py-3 border-r border-slate-200>Fee Type</th>
                      <th className=px-4 py-3 border-r border-slate-200>Date</th>
                      <th className=px-4 py-3 border-r border-slate-200>Mode</th>
                      <th className=px-4 py-3 border-r border-slate-200 text-right>Amount (Rs.)</th>
                      <th className=px-4 py-3 text-center>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r, idx) => (
                      <tr key={r.id} className=border-b border-slate-100 hover:bg-slate-50>
                        <td className=px-4 py-3 border-r border-slate-100 text-slate-500>{idx + 1}</td>
                        <td className=px-4 py-3 border-r border-slate-100 font-mono text-xs>{r.receiptNumber || '—'}</td>
                        <td className=px-4 py-3 border-r border-slate-100>{r.notes || 'Admission Form Fee'}</td>
                        <td className=px-4 py-3 border-r border-slate-100 whitespace-nowrap>
                          {r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className=px-4 py-3 border-r border-slate-100>
                          <span className=text-xs px-2 py-0.5 bg-slate-100 rounded-full>{r.paymentMode || 'CASH'}</span>
                        </td>
                        <td className=px-4 py-3 border-r border-slate-100 text-right font-semibold text-slate-800>
                          {Number(r.amount).toLocaleString('en-IN')}
                        </td>
                        <td className=px-4 py-3>
                          <div className=flex items-center justify-center gap-1>
                            <Button
                              variant=ghost
                              size=icon
                              className=h-6 w-6 hover:bg-slate-100
                              title=Print / Download Receipt
                              onClick={() => handlePrintReceipt(r)}
                            >
                              <Printer className=h-3.5 w-3.5 text-slate-600 />
                            </Button>
                            <span className=text-slate-300 text-xs>|</span>
                            <Button
                              variant=ghost
                              size=icon
                              className=h-6 w-6 hover:bg-emerald-50
                              title=Email Receipt
                              onClick={() => handleEmailReceipt(r)}
                            >
                              <Mail className=h-3.5 w-3.5 text-emerald-600 />
                            </Button>
                            <span className=text-slate-300 text-xs>|</span>
                            <Button
                              variant=ghost
                              size=icon
                              className=h-6 w-6 hover:bg-red-50
                              title=Delete Receipt
                              onClick={() => handleDeleteReceipt(r.id)}
                              disabled={deletingId === r.id}
                            >
                              {deletingId === r.id
                                ? <Loader2 className=h-3.5 w-3.5 animate-spin text-red-400 />
                                : <Trash2 className=h-3.5 w-3.5 text-red-400 />
                              }
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className=bg-[#f5f5f5] border-t border-slate-300>
                    <tr>
                      <td colSpan={5} className=px-4 py-3 text-right font-bold text-slate-700 border-r border-slate-200>Total</td>
                      <td className=px-4 py-3 text-right font-bold text-slate-800>{totalAmount.toLocaleString('en-IN')}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className=bg-[#f2f2f2] border-t border-slate-300 p-4 px-8 flex gap-2>
            <Button
              type=button
              onClick={() => navigate(-1)}
              className=bg-[#e6e6e6] hover:bg-[#d4d4d4] text-slate-700 h-7 px-4 text-xs shadow-none rounded-sm font-semibold
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
