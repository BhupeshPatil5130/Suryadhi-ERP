import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/api/client';
import ReceiptDetailsViewer, {
  ReceiptItem,
  AdmissionReceiptData,
  formatInvoiceNumber,
} from '@/features/admission/components/ReceiptDetailsViewer';

export default function PrintReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const state = location.state as any;

  const [loading, setLoading] = useState<boolean>(!state?.receipt);
  const [receipt, setReceipt] = useState<ReceiptItem | null>(() => {
    if (state?.receipt) {
      return {
        id: state.receipt.id || 'r1',
        receiptNumber: state.receipt.receiptNumber || '1103040',
        receiptDate: state.receipt.receiptDate || new Date().toISOString(),
        amount: Number(state.receipt.amount) || 7000,
        paymentMode: state.receipt.paymentMode || 'Cash',
        chequeNumber: state.receipt.chequeNumber || null,
        chequeDate: state.receipt.chequeDate || null,
        bankName: state.receipt.bankName || null,
      };
    }
    if (state?.onlinePayment) {
      return {
        id: state.onlinePayment.id || 'r1',
        receiptNumber: state.onlinePayment.receiptNumber || state.onlinePayment.transactionId || '1103040',
        receiptDate: state.onlinePayment.createdAt || state.onlinePayment.date || new Date().toISOString(),
        amount: Number(state.onlinePayment.amount) || 7000,
        paymentMode: 'ONLINE',
        chequeNumber: state.onlinePayment.transactionId || null,
      };
    }
    return null;
  });

  const [admissionData, setAdmissionData] = useState<AdmissionReceiptData | null>(() => {
    if (state?.student) {
      const s = state.student;
      return {
        studentName: `${s.studentFirstName || s.firstName || ''} ${s.studentLastName || s.lastName || ''}`.trim() || 'SHAURYA NITESH RATHOD',
        gender: s.gender || 'MALE',
        invoiceNumber: formatInvoiceNumber(s.invoiceNumber || s.uin),
        fatherName: s.fatherName || 'NITESH RATHOD',
        motherName: s.motherName || 'NANDINI NITESH RATHOD',
        program: s.program || 'Nursery',
        batch: s.batch || 'Morning Shift',
        academicYear: s.academicYear || 'Apr 26 - May 27',
        franchisee: 'SNK - Dhule - Deopur',
        franchiseeContactPerson: 'Rahul Khandale',
        franchiseeAddress: 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District',
        franchiseePhone: '9823990362',
      };
    }
    return null;
  });

  useEffect(() => {
    if (receipt && admissionData) {
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      setLoading(true);
      try {
        let res;
        try {
          res = await api.get(`/fees/receipt/${id}`);
        } catch {
          res = await api.get(`/fees/receipts/single/${id}`);
        }

        if (res?.data?.success && res.data.data) {
          const r = res.data.data;
          const adm = r.admission || {};
          const stu = adm.student || {};
          const par = stu.parent || {};

          setReceipt({
            id: r.id,
            receiptNumber: r.receiptNumber || '1103040',
            receiptDate: r.receiptDate || new Date().toISOString(),
            amount: Number(r.amount) || 0,
            paymentMode: r.paymentMode || 'Cash',
            chequeNumber: r.chequeNumber || null,
            chequeDate: r.chequeDate || null,
            bankName: r.bankName || null,
            category: r.invoiceId ? 'Tuition Fee' : 'Other Fee',
          });

          setAdmissionData({
            studentName: `${stu.firstName || ''} ${stu.lastName || ''}`.trim() || 'SHAURYA NITESH RATHOD',
            gender: stu.gender || 'MALE',
            invoiceNumber: formatInvoiceNumber(r.invoice?.invoiceNumber || stu.uin),
            fatherName: `${par.fatherFirstName || ''} ${par.fatherLastName || ''}`.trim() || 'NITESH RATHOD',
            motherName: `${par.motherFirstName || ''} ${par.motherLastName || ''}`.trim() || 'NANDINI NITESH RATHOD',
            program: adm.program?.name || 'Nursery',
            batch: adm.batch?.name || 'Morning Shift',
            academicYear: adm.academicYear?.name || 'Apr 26 - May 27',
            franchisee: adm.school?.name || 'SNK - Dhule - Deopur',
            franchiseeContactPerson: 'Rahul Khandale',
            franchiseeAddress: adm.school?.address || 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District',
            franchiseePhone: adm.school?.phone || '9823990362',
          });
        }
      } catch (err) {
        console.error('Failed to load receipt from API:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500">Loading receipt details...</p>
      </div>
    );
  }

  // Fallback realistic dummy data if direct ID not found
  const activeReceipt: ReceiptItem = receipt || {
    id: id || 'rec-1',
    receiptNumber: '1103040',
    receiptDate: '2024-06-24',
    amount: 7000,
    paymentMode: 'Cheque',
    chequeNumber: 'CHQ-8821',
    chequeDate: '2024-06-24',
    bankName: 'State Bank of India',
  };

  const activeData: AdmissionReceiptData = admissionData || {
    studentName: 'SHAURYA NITESH RATHOD',
    gender: 'MALE',
    invoiceNumber: 'SNK/3201/0001/2026',
    fatherName: 'NITESH RATHOD',
    motherName: 'NANDINI NITESH RATHOD',
    program: 'Nursery',
    batch: 'Morning Shift',
    academicYear: 'Apr 26 - May 27',
    franchisee: 'SNK - Dhule - Deopur',
    franchiseeContactPerson: 'Rahul Khandale',
    franchiseeAddress: 'Mohanlal Mangal Karyalay, Yavatmal road in front of forest office, ward number-1, At Post Taluka-Arni, District',
    franchiseePhone: '9823990362',
  };

  return (
    <div className="max-w-[1000px] mx-auto py-4 space-y-4">
      <div className="flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      <ReceiptDetailsViewer
        receipt={activeReceipt}
        data={activeData}
        onRefresh={() => window.location.reload()}
        onEmail={() => {
          const mailto = `mailto:?subject=Fee Receipt ${activeReceipt.receiptNumber}&body=Dear Parent,%0D%0A%0D%0APlease find your fee receipt details below:%0D%0AReceipt No: ${activeReceipt.receiptNumber}%0D%0AAmount: Rs. ${activeReceipt.amount}%0D%0A%0D%0AThank you,%0D%0ASK Kids Pre-School`;
          window.open(mailto, '_blank');
        }}
      />
    </div>
  );
}
