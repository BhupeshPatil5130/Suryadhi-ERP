import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ArrowLeft, Loader2, Save, User, CalendarDays, UserSquare2, Info, Printer, Mail, CheckCircle2, X } from 'lucide-react';
import api from '@/api/client';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showToast } from '@/lib/toast';

const enquiryFormSchema = z.object({
  enquirerMobile: z.string().min(10, 'Valid mobile number required'),
  enquirerName: z.string().min(1, 'Enquirer name is required'),
  enquirerEmail: z.string().email('Valid email required').or(z.literal('')),
  enquirerAddress: z.string().min(1, 'Address is required'),
  studentFirstName: z.string().min(1, 'First name is required'),
  studentMiddleName: z.string().optional(),
  studentLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['BOY', 'GIRL']),
  programId: z.string().min(1, 'Program is required'),
  hasSibling: z.boolean(),
  isTrialClass: z.boolean(),
  mediaSourceId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

type EnquiryFormData = z.infer<typeof enquiryFormSchema>;

export default function CreateEnquiryPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [mediaSources, setMediaSources] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Trial Class Receipt Popup State ────────────────────────
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [createdEnquiry, setCreatedEnquiry] = useState<any>(null);
  const [savedFormData, setSavedFormData] = useState<EnquiryFormData | null>(null);
  const [formFeeAmount, setFormFeeAmount] = useState('500');
  const [receiptPaymentMode, setReceiptPaymentMode] = useState('CASH');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptBankName, setReceiptBankName] = useState('');
  const [receiptChequeNumber, setReceiptChequeNumber] = useState('');
  const [receiptChequeDate, setReceiptChequeDate] = useState('');
  const [receiptTransactionId, setReceiptTransactionId] = useState('');
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      hasSibling: false,
      isTrialClass: false,
      gender: 'BOY',
    },
  });

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [progRes, yearRes, sourceRes] = await Promise.all([
          api.get('/lookups/programs'),
          api.get('/lookups/academic-years'),
          api.get('/lookups/media-sources')
        ]);
        
        if (progRes.data.success) setPrograms(progRes.data.data);
        if (yearRes.data.success) {
          setAcademicYears(yearRes.data.data);
          const current = yearRes.data.data.find((y: any) => y.isCurrent);
          if (current) setValue('academicYearId', current.id);
        }
        if (sourceRes.data.success) setMediaSources(sourceRes.data.data);
      } catch (error) {
        console.warn('Failed to fetch lookups, falling back to dummy data', error);
        setPrograms([
          { id: '1', name: 'Play Group' },
          { id: '2', name: 'Nursery' },
          { id: '3', name: 'SUNOIA Junior' },
          { id: '4', name: 'SUNOIA Senior' }
        ]);
        setAcademicYears([
          { id: '1', label: 'Apr 26 - Mar 27', isCurrent: true }
        ]);
        setMediaSources([
          { id: '1', name: 'Walk-in' },
          { id: '2', name: 'Website' },
          { id: '3', name: 'Referral' },
          { id: '4', name: 'Social Media' }
        ]);
        setValue('academicYearId', '1');
      }
    };
    
    fetchLookups();
  }, [setValue]);

  const onSubmit = async (data: EnquiryFormData) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/enquiries', data);
      if (data.isTrialClass) {
        setCreatedEnquiry(res.data.data);
        setSavedFormData(data);
        setReceiptModalOpen(true);
        showToast('Enquiry saved! Please generate the Admission Form Fee receipt.', 'success');
      } else {
        showToast('Enquiry saved successfully!', 'success');
        navigate('/enquiry');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create enquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!createdEnquiry?.id) return;
    if (!formFeeAmount || Number(formFeeAmount) <= 0) {
      showToast('Please enter a valid receipt amount', 'error');
      return;
    }
    setIsGeneratingReceipt(true);
    try {
      const res = await api.post(`/enquiries/${createdEnquiry.id}/receipts`, {
        amount: Number(formFeeAmount),
        paymentMode: receiptPaymentMode,
        receiptDate,
        bankName: receiptPaymentMode === 'CHEQUE' ? receiptBankName : undefined,
        chequeNumber: receiptPaymentMode === 'CHEQUE' ? receiptChequeNumber : undefined,
        chequeDate: receiptPaymentMode === 'CHEQUE' && receiptChequeDate ? receiptChequeDate : undefined,
        transactionId: receiptPaymentMode === 'ONLINE' ? receiptTransactionId : undefined,
        notes: 'Admission Form Fee (Trial Class)',
      });
      if (res.data.success) {
        setGeneratedReceipt(res.data.data);
        showToast('Admission Form Fee Receipt generated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to generate receipt', 'error');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!generatedReceipt || !savedFormData) return;
    const studentName = `${savedFormData.studentFirstName} ${savedFormData.studentLastName}`;
    const programName = programs.find((p) => p.id === savedFormData.programId)?.name || 'N/A';
    const printContent = `
      <html><head><title>Admission Form Fee Receipt - ${generatedReceipt.receiptNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}table{width:100%;border-collapse:collapse;margin-top:15px}td,th{border:1px solid #ddd;padding:10px}h2{color:#1e3a8a;margin-bottom:4px}p{margin:4px 0}</style></head>
      <body>
        <h2>SŪNOIAKIDS™ Pre-School</h2>
        <p style="font-size:12px;color:#666">Admission Form Fee Receipt (Other Receipt)</p>
        <hr style="border:none;border-top:1px solid #ddd;margin:15px 0" />
        <table>
          <tr><td><strong>Receipt No:</strong></td><td>${generatedReceipt.receiptNumber}</td></tr>
          <tr><td><strong>Receipt Date:</strong></td><td>${receiptDate}</td></tr>
          <tr><td><strong>Student Name:</strong></td><td>${studentName}</td></tr>
          <tr><td><strong>Program:</strong></td><td>${programName}</td></tr>
          <tr><td><strong>Parent Name:</strong></td><td>${savedFormData.enquirerName}</td></tr>
          <tr><td><strong>Parent Mobile:</strong></td><td>${savedFormData.enquirerMobile}</td></tr>
          <tr><td><strong>Fee Description:</strong></td><td>Admission Form Fee (Trial Class)</td></tr>
          <tr><td><strong>Payment Mode:</strong></td><td>${receiptPaymentMode}</td></tr>
          <tr><td><strong>Amount Paid:</strong></td><td><strong>₹${Number(formFeeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td></tr>
        </table>
        <br/><p style="color:#888;font-size:11px">This is an official computer-generated receipt.</p>
      </body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

  const handleEmailReceipt = () => {
    if (!savedFormData || !generatedReceipt) return;
    const parentEmail = savedFormData.enquirerEmail || '';
    const studentName = `${savedFormData.studentFirstName} ${savedFormData.studentLastName}`;
    const mailto = `mailto:${parentEmail}?subject=Admission Form Fee Receipt - ${generatedReceipt.receiptNumber}&body=Dear ${savedFormData.enquirerName},%0D%0A%0D%0AThank you for registering for the Trial Class!%0D%0A%0D%0APlease find the Admission Form Fee Receipt details below:%0D%0A%0D%0AStudent: ${studentName}%0D%0AReceipt No: ${generatedReceipt.receiptNumber}%0D%0ADate: ${receiptDate}%0D%0AAmount: Rs ${formFeeAmount}%0D%0APayment Mode: ${receiptPaymentMode}%0D%0A%0D%0ARegards,%0D%0ASuryadhi Learning Pvt. Ltd.`;
    window.open(mailto, '_blank');
  };

  const labelClass = 'block text-sm font-medium text-foreground/80 mb-1.5';
  const errorClass = 'text-[11px] text-destructive mt-1 font-medium';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/50 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title="Create Enquiry" 
          description="Register a new pre-admission enquiry in the system"
          className="mb-0"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enquirer Information */}
          <Card>
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Enquirer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Mobile No *</label>
                <Input {...register('enquirerMobile')} placeholder="Enter mobile number" />
                {errors.enquirerMobile && <p className={errorClass}>{errors.enquirerMobile.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Enquirer Name *</label>
                <Input {...register('enquirerName')} placeholder="Enter enquirer name" />
                {errors.enquirerName && <p className={errorClass}>{errors.enquirerName.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email Address</label>
                <Input {...register('enquirerEmail')} placeholder="Enter email address" />
                {errors.enquirerEmail && <p className={errorClass}>{errors.enquirerEmail.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Residential Address *</label>
                <Input {...register('enquirerAddress')} placeholder="Enter full address" />
                {errors.enquirerAddress && <p className={errorClass}>{errors.enquirerAddress.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Academic Year *</label>
                <select {...register('academicYearId')} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary">
                  <option value="">Select Academic Year</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
                {errors.academicYearId && <p className={errorClass}>{errors.academicYearId.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Enquiry Date</label>
                <Input value={new Date().toLocaleDateString('en-IN')} readOnly className="bg-muted/50 text-muted-foreground" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Program Seeking *</label>
                <select {...register('programId')} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary">
                  <option value="">Select Program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.programId && <p className={errorClass}>{errors.programId.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Information */}
        <Card>
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <UserSquare2 className="h-4 w-4 text-primary" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>First Name *</label>
              <Input {...register('studentFirstName')} placeholder="First name" />
              {errors.studentFirstName && <p className={errorClass}>{errors.studentFirstName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Middle Name</label>
              <Input {...register('studentMiddleName')} placeholder="Middle name (optional)" />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <Input {...register('studentLastName')} placeholder="Last name" />
              {errors.studentLastName && <p className={errorClass}>{errors.studentLastName.message}</p>}
            </div>
            
            <div>
              <label className={labelClass}>Date of Birth *</label>
              <Input type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className={errorClass}>{errors.dateOfBirth.message}</p>}
            </div>
            
            <div>
              <label className={labelClass}>Gender *</label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="radio" value="BOY" {...register('gender')} className="peer sr-only" />
                    <div className="w-4 h-4 rounded-full border border-primary peer-checked:border-primary peer-checked:border-[4px] transition-all"></div>
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">Boy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="radio" value="GIRL" {...register('gender')} className="peer sr-only" />
                    <div className="w-4 h-4 rounded-full border border-primary peer-checked:border-primary peer-checked:border-[4px] transition-all"></div>
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">Girl</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Has Sibling in SUNOIA / SEMS? *</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        checked={watch('hasSibling') === val}
                        onChange={() => setValue('hasSibling', val)} 
                        className="peer sr-only" 
                      />
                      <div className="w-4 h-4 rounded-full border border-primary peer-checked:border-primary peer-checked:border-[4px] transition-all"></div>
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{val ? 'Yes' : 'No'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Trial Class Selected? *</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {[true, false].map((val) => (
                  <label key={String(val)} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        checked={watch('isTrialClass') === val}
                        onChange={() => setValue('isTrialClass', val)} 
                        className="peer sr-only" 
                      />
                      <div className="w-4 h-4 rounded-full border border-primary peer-checked:border-primary peer-checked:border-[4px] transition-all"></div>
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{val ? 'Yes' : 'No'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>How did you hear about us?</label>
              <select {...register('mediaSourceId')} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary">
                <option value="">Select Source</option>
                {mediaSources.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-card/80 backdrop-blur-xl p-4 rounded-xl border border-border shadow-lg z-10">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Enquiry
          </Button>
        </div>
      </form>

      {/* ── Admission Form Fee (Other Receipt) Trial Class Popup Modal ── */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Admission Form Fee Receipt</h3>
                <p className="text-xs text-blue-100">Trial Class Selected — Generate Other Receipt</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceiptModalOpen(false);
                  navigate('/enquiry');
                }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Summary Details */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Student:</span>
                  <span className="font-semibold text-slate-800">
                    {savedFormData?.studentFirstName} {savedFormData?.studentLastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Parent / Mobile:</span>
                  <span className="font-medium text-slate-800">
                    {savedFormData?.enquirerName} ({savedFormData?.enquirerMobile})
                  </span>
                </div>
                {savedFormData?.enquirerEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Parent Email:</span>
                    <span className="font-medium text-slate-800">{savedFormData?.enquirerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee Category:</span>
                  <span className="font-bold text-blue-700">Admission Form Fee (Other Receipt)</span>
                </div>
              </div>

              {!generatedReceipt ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Receipt Date *</label>
                      <Input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Amount (₹) *</label>
                      <Input
                        type="number"
                        min="0"
                        value={formFeeAmount}
                        onChange={(e) => setFormFeeAmount(e.target.value)}
                        className="h-8 text-xs font-semibold"
                        placeholder="₹ 500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-slate-700">Payment Mode *</label>
                    <select
                      value={receiptPaymentMode}
                      onChange={(e) => setReceiptPaymentMode(e.target.value)}
                      className="flex h-8 w-full rounded border border-input bg-white px-3 py-1 text-xs"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="ONLINE">Online Payment</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  {receiptPaymentMode === 'CHEQUE' && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-600">Cheque No.</label>
                        <Input
                          value={receiptChequeNumber}
                          onChange={(e) => setReceiptChequeNumber(e.target.value)}
                          placeholder="Cheque No."
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600">Bank Name</label>
                        <Input
                          value={receiptBankName}
                          onChange={(e) => setReceiptBankName(e.target.value)}
                          placeholder="Bank Name"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {receiptPaymentMode === 'ONLINE' && (
                    <div className="space-y-1 text-xs">
                      <label className="text-slate-600">Transaction / Ref ID</label>
                      <Input
                        value={receiptTransactionId}
                        onChange={(e) => setReceiptTransactionId(e.target.value)}
                        placeholder="Transaction ID"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setReceiptModalOpen(false);
                        navigate('/enquiry');
                      }}
                      className="h-8 text-xs"
                    >
                      Skip / Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGenerateReceipt}
                      disabled={isGeneratingReceipt}
                      className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 text-xs font-semibold px-4"
                    >
                      {isGeneratingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Generate Receipt
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="flex flex-col items-center justify-center text-green-700">
                    <CheckCircle2 className="w-12 h-12 mb-1" />
                    <span className="font-bold text-sm">Receipt Generated!</span>
                    <span className="font-mono text-xs text-slate-600 mt-0.5">
                      Receipt No: {generatedReceipt.receiptNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Receipt
                    </Button>
                    <Button
                      type="button"
                      onClick={handleEmailReceipt}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send to Email
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <Button
                      type="button"
                      onClick={() => {
                        setReceiptModalOpen(false);
                        navigate('/enquiry');
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white h-8 text-xs px-6"
                    >
                      Done (Go to Enquiries)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
