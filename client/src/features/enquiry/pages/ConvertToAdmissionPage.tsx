import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Menu, CheckCircle, Banknote, ArrowRight } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function ConvertToAdmissionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [step, setStep] = useState<'confirmation' | 'admission_form'>('confirmation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [createdAdmissionId, setCreatedAdmissionId] = useState<string>('');

  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [enquirerMap, setEnquirerMap] = useState('fathers');

  // Form State
  const [form, setForm] = useState<any>({
    academicYearId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    studentFirstName: '',
    studentMiddleName: '',
    studentLastName: '',
    gender: 'BOY',
    dateOfBirth: '',
    nationality: 'Indian',
    programId: '',
    admissionType: 'OFFLINE',
    isUniformRequired: 'yes',
    isDiscountApplicable: 'no',
    fatherName: '',
    motherName: '',
    fatherMobile: '',
    motherMobile: '',
    fatherEmail: '',
    motherEmail: '',
    fatherOccupation: '',
    motherOccupation: '',
    fatherOrganisation: '',
    motherOrganisation: '',
    address: '',
    postalCode: '',
    city: '',
    state: '',
    country: 'India',
    batchId: '',
    isTransportRequired: 'no',
    isPreviousSchooling: 'no',
    isKinAttended: 'no',
    hasSibling: 'no',
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const [progRes, yearRes] = await Promise.all([
          api.get('/lookups/programs'),
          api.get('/lookups/academic-years'),
        ]);
        if (progRes.data.success) setPrograms(progRes.data.data);
        let currentAyId = '';
        if (yearRes.data?.success && yearRes.data.data?.length > 0) {
          const currentAy = yearRes.data.data.find((y: any) => y.isCurrent) || yearRes.data.data[0];
          currentAyId = currentAy.id;
        }

        if (id) {
          const res = await api.get(`/enquiries/${id}`);
          if (res.data.success) {
            const e = res.data.data;
            const stu = e.student || {};
            const dob = stu.dateOfBirth
              ? new Date(stu.dateOfBirth).toISOString().split('T')[0]
              : e.dateOfBirth
              ? new Date(e.dateOfBirth).toISOString().split('T')[0]
              : '2022-01-01';

            setForm((prev: any) => ({
              ...prev,
              academicYearId: e.academicYearId || currentAyId,
              studentFirstName: stu.firstName || e.studentFirstName || '',
              studentMiddleName: stu.middleName || e.studentMiddleName || '',
              studentLastName: stu.lastName || e.studentLastName || '',
              gender: stu.gender || e.gender || 'BOY',
              dateOfBirth: dob,
              programId: e.programId || prev.programId || '',
              address: e.enquirerAddress || stu.address || 'Arni, Yavatmal',
              postalCode: stu.postalCode || '445001',
              city: stu.city || 'Yavatmal',
              state: stu.state || 'Maharashtra',
              country: stu.country || 'India',
              hasSibling: e.hasSibling ? 'yes' : 'no',
              _rawEnquirerName: e.enquirerName || '',
              _rawEnquirerMobile: e.enquirerMobile || '',
              _rawEnquirerEmail: e.enquirerEmail || '',
              fatherName: e.enquirerName || '',
              fatherMobile: e.enquirerMobile || '',
              fatherEmail: e.enquirerEmail || '',
            }));

            if (e.programId) {
              const batchRes = await api.get(`/lookups/batches?programId=${e.programId}`);
              if (batchRes.data.success) setBatches(batchRes.data.data);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load init data', err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [id]);

  const setField = (k: string, v: string) => setForm((prev: any) => ({ ...prev, [k]: v }));

  const handleProgramChange = async (val: string) => {
    setField('programId', val);
    try {
      const res = await api.get(`/lookups/batches?programId=${val}`);
      if (res.data.success) setBatches(res.data.data);
    } catch (err) {
      console.error('Failed to load batches for program:', err);
      showToast('Could not load batches for selected program', 'error');
    }
  };

  const handleConfirmMapping = () => {
    setForm((prev: any) => {
      const update = { ...prev };
      if (enquirerMap === 'fathers') {
        update.fatherName = prev._rawEnquirerName;
        update.fatherMobile = prev._rawEnquirerMobile;
        update.fatherEmail = prev._rawEnquirerEmail;
      } else if (enquirerMap === 'mothers') {
        update.motherName = prev._rawEnquirerName;
        update.motherMobile = prev._rawEnquirerMobile;
        update.motherEmail = prev._rawEnquirerEmail;
      }
      return update;
    });
    setStep('admission_form');
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    try {
      const payload = {
        studentFirstName: form.studentFirstName,
        studentMiddleName: form.studentMiddleName,
        studentLastName: form.studentLastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality,
        programId: form.programId,
        batchId: form.batchId || undefined,
        admissionType: form.admissionType,
        isUniformRequired: form.isUniformRequired === 'yes',
        isDiscountApplicable: form.isDiscountApplicable === 'yes',
        isTransportRequired: form.isTransportRequired === 'yes',
        isPreviousSchooling: form.isPreviousSchooling === 'yes',
        isKinAttended: form.isKinAttended === 'yes',
        hasSibling: form.hasSibling === 'yes',
        fatherName: form.fatherName,
        motherName: form.motherName,
        fatherMobile: form.fatherMobile,
        motherMobile: form.motherMobile,
        fatherEmail: form.fatherEmail,
        motherEmail: form.motherEmail,
        fatherOccupation: form.fatherOccupation,
        motherOccupation: form.motherOccupation,
        fatherOrganisation: form.fatherOrganisation,
        motherOrganisation: form.motherOrganisation,
        address: form.address,
        postalCode: form.postalCode,
        city: form.city,
        state: form.state,
        country: form.country,
        enquiryId: id,
        academicYearId: form.academicYearId,
        admissionDate: form.admissionDate
      };

      // Since enquiry conversion essentially creates an admission
      const res = await api.post('/admissions', payload);
      const newId = res.data?.data?.id || res.data?.id || '';
      setCreatedAdmissionId(newId);
      setShowFeesModal(true);
      showToast('Admission created successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to convert enquiry to admission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>;
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-4">
        <h1 className="text-2xl font-normal text-slate-800 mb-6">Enquirer Confirmation</h1>

        <Card className="border-slate-300 shadow-sm rounded-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-300 py-3 px-4">
            <CardTitle className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Enquirer Confirmation
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0 bg-[#f9f9f9]">
            <div className="p-8 py-10">
              <div className="grid grid-cols-[200px_1fr] items-center gap-4">
                <span className="text-sm text-slate-700 font-normal">Enquirer details mapped to</span>
                <RadioGroup value={enquirerMap} onValueChange={setEnquirerMap} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fathers" id="fathers" />
                    <Label htmlFor="fathers" className="font-normal text-sm">Fathers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mothers" id="mothers" />
                    <Label htmlFor="mothers" className="font-normal text-sm">Mothers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal text-sm">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="bg-[#f2f2f2] border-t border-slate-300 p-4 px-6 flex justify-end gap-2">
              <Button onClick={() => navigate(-1)} className="bg-[#333] hover:bg-[#222] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold">
                Cancel
              </Button>
              <Button onClick={handleConfirmMapping} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-semibold">
                Ok
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 pb-12 pt-2">
      <h1 className="text-2xl font-normal text-slate-800 mb-4">Create Admission</h1>

      <form onSubmit={handleConfirm}>
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm">
          
          {/* Student Information */}
          <div className="bg-[#8eed8f] px-4 py-1.5 border-b border-slate-300">
            <h2 className="text-xs font-semibold text-slate-800">Student Information</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
              
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Academic Year <span className="text-red-500">*</span></Label>
                <Select value={form.academicYearId} onValueChange={(v) => setField('academicYearId', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Admission Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.admissionDate} onChange={(e) => setField('admissionDate', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Student Name <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input value={form.studentFirstName} onChange={e => setField('studentFirstName', e.target.value)} placeholder="First" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" required />
                  <Input value={form.studentMiddleName} onChange={e => setField('studentMiddleName', e.target.value)} placeholder="Middle" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
                  <Input value={form.studentLastName} onChange={e => setField('studentLastName', e.target.value)} placeholder="Last" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" required />
                </div>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Gender <span className="text-red-500">*</span></Label>
                <RadioGroup value={form.gender} onValueChange={(v) => setField('gender', v)} className="flex gap-6 h-8 items-center">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="BOY" id="boy" /><Label htmlFor="boy" className="font-normal text-[13px]">Boy</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="GIRL" id="girl" /><Label htmlFor="girl" className="font-normal text-[13px]">Girl</Label></div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Date Of Birth <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[200px] bg-[#f2f2f2]" required />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Nationality</Label>
                <Input value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Program Name <span className="text-red-500">*</span></Label>
                <Select value={form.programId} onValueChange={handleProgramChange}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[200px]"><SelectValue placeholder="Select Program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden md:block"></div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Admission Type <span className="text-red-500">*</span></Label>
                <Select value={form.admissionType} onValueChange={v => setField('admissionType', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Is Uniform Required <span className="text-red-500">*</span></Label>
                <RadioGroup value={form.isUniformRequired} onValueChange={(v) => setField('isUniformRequired', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="uni-yes" /><Label htmlFor="uni-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="uni-no" /><Label htmlFor="uni-no" className="font-normal text-[13px]">No</Label></div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-[#8eed8f] px-4 py-1.5 border-y border-slate-300">
            <h2 className="text-xs font-semibold text-slate-800">Parent Information</h2>
          </div>
          
          <div className="p-6 bg-[#e6e6e6]">
            <p className="text-red-500 text-[10px] font-bold mb-4">All details of one of the parents is mandatory</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-6">
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Name <span className="text-red-500">*</span></Label>
                <Input value={form.fatherName} onChange={e => setField('fatherName', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Name <span className="text-red-500">*</span></Label>
                <Input value={form.motherName} onChange={e => setField('motherName', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Mobile <span className="text-red-500">*</span></Label>
                <Input value={form.fatherMobile} onChange={e => setField('fatherMobile', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Mobile <span className="text-red-500">*</span></Label>
                <Input value={form.motherMobile} onChange={e => setField('motherMobile', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Occupation <span className="text-red-500">*</span></Label>
                <Select value={form.fatherOccupation} onValueChange={v => setField('fatherOccupation', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white"><SelectValue placeholder="Select Occupation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Occupation <span className="text-red-500">*</span></Label>
                <Select value={form.motherOccupation} onValueChange={v => setField('motherOccupation', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white"><SelectValue placeholder="Select Occupation" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Homemaker">Home Maker</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Email</Label>
                <Input value={form.fatherEmail} onChange={e => setField('fatherEmail', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Email</Label>
                <Input value={form.motherEmail} onChange={e => setField('motherEmail', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-slate-300">
              <div className="grid grid-cols-[180px_1fr] items-center gap-4 md:col-span-2">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Address <span className="text-red-500">*</span></Label>
                <Input value={form.address} onChange={e => setField('address', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" required />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Postal Code <span className="text-red-500">*</span></Label>
                <Input value={form.postalCode} onChange={e => setField('postalCode', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[150px]" required />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">City <span className="text-red-500">*</span></Label>
                <Input value={form.city} onChange={e => setField('city', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" required />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">State <span className="text-red-500">*</span></Label>
                <Input value={form.state} onChange={e => setField('state', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" required />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Country <span className="text-red-500">*</span></Label>
                <Input value={form.country} onChange={e => setField('country', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" required />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Batch <span className="text-red-500">*</span></Label>
                <Select value={form.batchId} onValueChange={v => setField('batchId', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.timeSlot}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Transport Required ?</Label>
                <RadioGroup value={form.isTransportRequired} onValueChange={(v) => setField('isTransportRequired', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="trans-yes" /><Label htmlFor="trans-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="trans-no" /><Label htmlFor="trans-no" className="font-normal text-[13px]">No</Label></div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 ml-[12.5%] md:ml-[180px] px-6">
          <Button type="submit" disabled={isSubmitting} className="bg-[#0056b3] hover:bg-[#004494] text-white h-7 px-4 text-xs shadow-none rounded-sm font-semibold">
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </Button>
          <Button type="button" onClick={() => navigate(-1)} className="bg-[#e6e6e6] hover:bg-[#d4d4d4] text-slate-700 h-7 px-4 text-xs shadow-none rounded-sm font-semibold">
            Cancel
          </Button>
        </div>
      </form>

      {/* Admission Fees Confirmation Modal */}
      {showFeesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-md shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="h-8 w-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-slate-800">Admission Fees Confirmation</h3>
                <p className="text-xs text-slate-500">Student registration completed</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm space-y-2 text-slate-700">
              <p>
                Student <strong className="text-slate-900">{form.studentFirstName} {form.studentLastName}</strong> has been successfully converted to admission!
              </p>
              <p className="text-xs text-slate-500">
                Would you like to collect the admission / term fees and generate a receipt right now?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                onClick={() => {
                  setShowFeesModal(false);
                  if (createdAdmissionId) {
                    navigate(`/admissions/${createdAdmissionId}/receipt`);
                  } else {
                    navigate(`/fees/add-receipt`);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-sm"
              >
                <Banknote className="h-4 w-4" /> Collect Fees Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeesModal(false);
                  navigate('/admission');
                }}
                className="flex-1 text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                View Admission List <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
