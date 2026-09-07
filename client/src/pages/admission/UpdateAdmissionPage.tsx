import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import api from '@/api/client';

interface FormState {
  academicYearId: string;
  admissionDate: string;
  studentFirstName: string;
  studentMiddleName: string;
  studentLastName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  programId: string;
  admissionType: string;
  isUniformRequired: string;
  isDiscountApplicable: string;
  fatherName: string;
  motherName: string;
  fatherMobile: string;
  motherMobile: string;
  fatherEmail: string;
  motherEmail: string;
  fatherOccupation: string;
  motherOccupation: string;
  fatherOrganisation: string;
  motherOrganisation: string;
  address: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  batchId: string;
  isTransportRequired: string;
  isPreviousSchooling: string;
  isKinAttended: string;
  hasSibling: string;
}

export default function UpdateAdmissionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [form, setForm] = useState<FormState>({
    academicYearId: '',
    admissionDate: '2026-04-01',
    studentFirstName: 'Mahi',
    studentMiddleName: 'Sachin',
    studentLastName: 'Rathod',
    gender: 'GIRL',
    dateOfBirth: '2021-03-13',
    nationality: 'Indian',
    programId: '',
    admissionType: 'OFFLINE',
    isUniformRequired: 'yes',
    isDiscountApplicable: 'no',
    fatherName: 'Sachin Chavhan',
    motherName: 'Swati Sachin Rathod',
    fatherMobile: '7721038204',
    motherMobile: '7721038088',
    fatherEmail: 'sachinrathod1411@gmail.com',
    motherEmail: 'sachinrathod53@gmail.com',
    fatherOccupation: 'Business',
    motherOccupation: 'Homemaker',
    fatherOrganisation: '',
    motherOrganisation: '',
    address: 'Arni',
    postalCode: '445103',
    city: 'Yavatmal',
    state: 'Maharashtra',
    country: 'India',
    batchId: '',
    isTransportRequired: 'no',
    isPreviousSchooling: 'no',
    isKinAttended: 'no',
    hasSibling: 'no',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [programsRes, yearsRes] = await Promise.all([
          api.get('/lookups/programs'),
          api.get('/lookups/academic-years'),
        ]);
        if (programsRes.data.success) setPrograms(programsRes.data.data);
        if (yearsRes.data.success) setAcademicYears(yearsRes.data.data);

        // Load admission data if editing
        if (id && id !== 'new') {
          const admissionRes = await api.get(`/admissions/${id}`);
          if (admissionRes.data.success) {
            const a = admissionRes.data.data;
            const s = a.student;
            const p = s?.parent;
            setForm({
              academicYearId: a.academicYearId || '',
              admissionDate: a.admissionDate?.split('T')[0] || '',
              studentFirstName: s?.firstName || '',
              studentMiddleName: s?.middleName || '',
              studentLastName: s?.lastName || '',
              gender: s?.gender || 'BOY',
              dateOfBirth: s?.dateOfBirth?.split('T')[0] || '',
              nationality: s?.nationality || '',
              programId: a.programId || '',
              admissionType: a.admissionType || 'OFFLINE',
              isUniformRequired: a.isUniformRequired ? 'yes' : 'no',
              isDiscountApplicable: a.isDiscountApplicable ? 'yes' : 'no',
              fatherName: p?.fatherName || '',
              motherName: p?.motherName || '',
              fatherMobile: p?.fatherMobile || '',
              motherMobile: p?.motherMobile || '',
              fatherEmail: p?.fatherEmail || '',
              motherEmail: p?.motherEmail || '',
              fatherOccupation: p?.fatherOccupation || '',
              motherOccupation: p?.motherOccupation || '',
              fatherOrganisation: p?.fatherOrganisation || '',
              motherOrganisation: p?.motherOrganisation || '',
              address: s?.address || '',
              postalCode: s?.postalCode || '',
              city: s?.city || '',
              state: s?.state || '',
              country: s?.country || 'India',
              batchId: a.batchId || '',
              isTransportRequired: a.isTransportRequired ? 'yes' : 'no',
              isPreviousSchooling: a.isPreviousSchooling ? 'yes' : 'no',
              isKinAttended: a.isKinAttended ? 'yes' : 'no',
              hasSibling: a.hasSibling ? 'yes' : 'no',
            });

            // Load batches for this program
            if (a.programId) {
              const batchRes = await api.get(`/lookups/batches?programId=${a.programId}`);
              if (batchRes.data.success) setBatches(batchRes.data.data);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load admission data, using defaults');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [id]);

  const setField = (key: keyof FormState, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleProgramChange = async (programId: string) => {
    setField('programId', programId);
    try {
      const batchRes = await api.get(`/lookups/batches?programId=${programId}`);
      if (batchRes.data.success) setBatches(batchRes.data.data);
    } catch {}
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
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
      };

      if (id && id !== 'new') {
        await api.put(`/admissions/${id}`, payload);
      }
      navigate('/admission');
    } catch (error) {
      console.warn('API call failed, navigating back', error);
      navigate('/admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Loading admission data...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 pb-12 pt-2">
      <h1 className="text-2xl font-normal text-slate-800 mb-4">Update Admission</h1>

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
                    {academicYears.map((y: any) => (
                      <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                    ))}
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
                  <Input value={form.studentFirstName} onChange={(e) => setField('studentFirstName', e.target.value)} placeholder="First" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
                  <Input value={form.studentMiddleName} onChange={(e) => setField('studentMiddleName', e.target.value)} placeholder="Middle" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
                  <Input value={form.studentLastName} onChange={(e) => setField('studentLastName', e.target.value)} placeholder="Last" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
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
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[200px] bg-[#f2f2f2]" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Nationality</Label>
                <Input value={form.nationality} onChange={(e) => setField('nationality', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Program Name <span className="text-red-500">*</span></Label>
                <Select value={form.programId} onValueChange={handleProgramChange}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[200px]">
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden md:block"></div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Admission Type <span className="text-red-500">*</span></Label>
                <Select value={form.admissionType} onValueChange={(v) => setField('admissionType', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]">
                    <SelectValue />
                  </SelectTrigger>
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

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Discount Applicable ? <span className="text-red-500">*</span></Label>
                <RadioGroup value={form.isDiscountApplicable} onValueChange={(v) => setField('isDiscountApplicable', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="disc-yes" /><Label htmlFor="disc-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="disc-no" /><Label htmlFor="disc-no" className="font-normal text-[13px]">No</Label></div>
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
                <Input value={form.fatherName} onChange={(e) => setField('fatherName', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Name <span className="text-red-500">*</span></Label>
                <Input value={form.motherName} onChange={(e) => setField('motherName', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Mobile <span className="text-red-500">*</span></Label>
                <Input value={form.fatherMobile} onChange={(e) => setField('fatherMobile', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Mobile <span className="text-red-500">*</span></Label>
                <Input value={form.motherMobile} onChange={(e) => setField('motherMobile', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Occupation <span className="text-red-500">*</span></Label>
                <Select value={form.fatherOccupation} onValueChange={(v) => setField('fatherOccupation', v)}>
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
                <Select value={form.motherOccupation} onValueChange={(v) => setField('motherOccupation', v)}>
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
                <Input value={form.fatherEmail} onChange={(e) => setField('fatherEmail', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Email</Label>
                <Input value={form.motherEmail} onChange={(e) => setField('motherEmail', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4 mt-2">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Father Organisation</Label>
                <Input value={form.fatherOrganisation} onChange={(e) => setField('fatherOrganisation', e.target.value)} placeholder="Enter Father Organisation Name" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4 mt-2">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Mother Organisation</Label>
                <Input value={form.motherOrganisation} onChange={(e) => setField('motherOrganisation', e.target.value)} placeholder="Enter Mother Organisation Name" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-slate-300">
              <div className="grid grid-cols-[180px_1fr] items-center gap-4 md:col-span-2">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Address <span className="text-red-500">*</span></Label>
                <Input value={form.address} onChange={(e) => setField('address', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Postal Code <span className="text-red-500">*</span></Label>
                <Input value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm w-[150px]" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">City <span className="text-red-500">*</span></Label>
                <Input value={form.city} onChange={(e) => setField('city', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">State <span className="text-red-500">*</span></Label>
                <Input value={form.state} onChange={(e) => setField('state', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
              </div>
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Country <span className="text-red-500">*</span></Label>
                <Input value={form.country} onChange={(e) => setField('country', e.target.value)} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-[#f2f2f2]" />
              </div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Batch <span className="text-red-500">*</span></Label>
                <Select value={form.batchId} onValueChange={(v) => setField('batchId', v)}>
                  <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.timeSlot}</SelectItem>
                    ))}
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

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px] leading-tight">Previous Schooling ?</Label>
                <RadioGroup value={form.isPreviousSchooling} onValueChange={(v) => setField('isPreviousSchooling', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="prev-yes" /><Label htmlFor="prev-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="prev-no" /><Label htmlFor="prev-no" className="font-normal text-[13px]">No</Label></div>
                </RadioGroup>
              </div>
              <div className="hidden md:block"></div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px] leading-tight">Has any of the child's kin attended SUNOIAKids before?</Label>
                <RadioGroup value={form.isKinAttended} onValueChange={(v) => setField('isKinAttended', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="kin-yes" /><Label htmlFor="kin-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="kin-no" /><Label htmlFor="kin-no" className="font-normal text-[13px]">No</Label></div>
                </RadioGroup>
              </div>
              <div className="hidden md:block"></div>

              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px] leading-tight">Does the child have any sibling?</Label>
                <RadioGroup value={form.hasSibling} onValueChange={(v) => setField('hasSibling', v)} className="flex gap-4 items-center h-8">
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="sib-yes" /><Label htmlFor="sib-yes" className="font-normal text-[13px]">Yes</Label></div>
                  <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="sib-no" /><Label htmlFor="sib-no" className="font-normal text-[13px]">No</Label></div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 ml-[12.5%] md:ml-[180px] px-6">
          <Button type="submit" disabled={isSubmitting} className="bg-[#0056b3] hover:bg-[#004494] text-white h-7 px-4 text-xs shadow-none rounded-sm font-semibold">
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </Button>
          <Button type="button" onClick={() => setIsLoading(true)} className="bg-[#333] hover:bg-[#222] text-white h-7 px-4 text-xs shadow-none rounded-sm font-semibold">
            Reload
          </Button>
          <Button type="button" onClick={() => navigate(-1)} className="bg-[#e6e6e6] hover:bg-[#d4d4d4] text-slate-700 h-7 px-4 text-xs shadow-none rounded-sm font-semibold">
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
