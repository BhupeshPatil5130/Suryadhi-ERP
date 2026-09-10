import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

export default function UpdateEnquiryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [mediaSources, setMediaSources] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enquiryDate, setEnquiryDate] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      hasSibling: false,
      isTrialClass: false,
      gender: 'BOY',
    },
  });

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [progRes, yearRes, sourceRes, enquiryRes] = await Promise.all([
          api.get('/lookups/programs'),
          api.get('/lookups/academic-years'),
          api.get('/lookups/media-sources'),
          api.get(`/enquiries/${id}`)
        ]);
        
        if (progRes.data.success) setPrograms(progRes.data.data);
        if (yearRes.data.success) setAcademicYears(yearRes.data.data);
        if (sourceRes.data.success) setMediaSources(sourceRes.data.data);

        if (enquiryRes.data.success) {
          const e = enquiryRes.data.data;
          const stu = e.student || {};
          const dob = stu.dateOfBirth
            ? new Date(stu.dateOfBirth).toISOString().split('T')[0]
            : e.dateOfBirth
            ? new Date(e.dateOfBirth).toISOString().split('T')[0]
            : '';

          setValue('enquirerMobile', e.enquirerMobile || '');
          setValue('enquirerName', e.enquirerName || '');
          setValue('enquirerEmail', e.enquirerEmail || '');
          setValue('enquirerAddress', e.enquirerAddress || '');
          setValue('studentFirstName', stu.firstName || e.studentFirstName || '');
          setValue('studentMiddleName', stu.middleName || e.studentMiddleName || '');
          setValue('studentLastName', stu.lastName || e.studentLastName || '');
          setValue('dateOfBirth', dob);
          setValue('gender', stu.gender || e.gender || 'BOY');
          setValue('programId', e.programId || '');
          setValue('hasSibling', e.hasSibling || false);
          setValue('isTrialClass', e.isTrialClass || false);
          setValue('mediaSourceId', e.mediaSourceId || '');
          setValue('academicYearId', e.academicYearId || '');
          setEnquiryDate(new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        }
      } catch (error) {
        console.warn('Failed to fetch enquiry data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchInitData();
  }, [id, setValue]);

  const onSubmit = async (data: EnquiryFormData) => {
    setIsSubmitting(true);
    try {
      await api.put(`/enquiries/${id}`, data);
      navigate('/enquiry');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update enquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">Loading enquiry data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 pt-2">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Update Enquiry</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Enquirer Information */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-sm">
          <CardHeader className="bg-[#b3d4f6]/40 border-b border-[#b3d4f6]/60 py-3 px-6">
            <CardTitle className="text-sm font-medium text-slate-800">Enquirer Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Enquirer Mobile No <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Input {...register('enquirerMobile')} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  {errors.enquirerMobile && <p className="text-red-500 text-xs mt-1">{errors.enquirerMobile.message}</p>}
                </div>
              </div>
              <div className="hidden md:block"></div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Enquirer Name <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Input {...register('enquirerName')} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  {errors.enquirerName && <p className="text-red-500 text-xs mt-1">{errors.enquirerName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Enquirer EmailID <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Input {...register('enquirerEmail')} type="email" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  {errors.enquirerEmail && <p className="text-red-500 text-xs mt-1">{errors.enquirerEmail.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 md:col-span-2 md:grid-cols-12">
                <Label className="text-right text-slate-600 font-normal text-[13px] md:col-span-2 mr-2">Address <span className="text-red-500">*</span></Label>
                <div className="col-span-2 md:col-span-10">
                  <Input {...register('enquirerAddress')} className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" placeholder="Enquirer Address" />
                  {errors.enquirerAddress && <p className="text-red-500 text-xs mt-1">{errors.enquirerAddress.message}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-sm">
          <CardHeader className="bg-[#b3d4f6]/40 border-b border-[#b3d4f6]/60 py-3 px-6">
            <CardTitle className="text-sm font-medium text-slate-800">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Academic Year <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Select value={watch('academicYearId')} onValueChange={(v) => setValue('academicYearId', v)}>
                    <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y: any) => (
                        <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicYearId && <p className="text-red-500 text-xs mt-1">{errors.academicYearId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Enquiry Date <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Input value={enquiryDate} readOnly className="h-8 text-[13px] bg-[#f4f8fd] border-[#b3d4f6] text-slate-700 pointer-events-none rounded-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 md:col-span-2 md:grid-cols-12">
                <Label className="text-right text-slate-600 font-normal text-[13px] md:col-span-2 mr-2">Student Name <span className="text-red-500">*</span></Label>
                <div className="col-span-2 md:col-span-10 flex gap-2">
                  <Input {...register('studentFirstName')} placeholder="First" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  <Input {...register('studentMiddleName')} placeholder="Middle" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  <Input {...register('studentLastName')} placeholder="Last" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                </div>
                {(errors.studentFirstName || errors.studentLastName) && (
                  <div className="col-span-2 md:col-span-10 col-start-3 md:col-start-3">
                    <p className="text-red-500 text-xs mt-1">First and Last name required</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Date Of Birth <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Input {...register('dateOfBirth')} type="date" className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm" />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Gender <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <RadioGroup 
                    value={watch('gender')} 
                    onValueChange={(v: 'BOY'|'GIRL') => setValue('gender', v)}
                    className="flex gap-4 h-8 items-center"
                  >
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="BOY" id="boy" /><Label htmlFor="boy" className="font-normal text-[13px]">Boy</Label></div>
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="GIRL" id="girl" /><Label htmlFor="girl" className="font-normal text-[13px]">Girl</Label></div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Program <span className="text-red-500">*</span></Label>
                <div className="col-span-2">
                  <Select value={watch('programId')} onValueChange={(v) => setValue('programId', v)}>
                    <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white">
                      <SelectValue placeholder="Select Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.programId && <p className="text-red-500 text-xs mt-1">{errors.programId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px] leading-tight">Does the child have any sibling?</Label>
                <div className="col-span-2">
                  <RadioGroup 
                    value={watch('hasSibling') ? 'yes' : 'no'} 
                    onValueChange={(v) => setValue('hasSibling', v === 'yes')}
                    className="flex gap-4 h-8 items-center"
                  >
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="sib-yes" /><Label htmlFor="sib-yes" className="font-normal text-[13px]">Yes</Label></div>
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="sib-no" /><Label htmlFor="sib-no" className="font-normal text-[13px]">No</Label></div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px]">Trial Class</Label>
                <div className="col-span-2">
                  <RadioGroup 
                    value={watch('isTrialClass') ? 'yes' : 'no'} 
                    onValueChange={(v) => setValue('isTrialClass', v === 'yes')}
                    className="flex gap-4 h-8 items-center"
                  >
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="yes" id="trial-yes" /><Label htmlFor="trial-yes" className="font-normal text-[13px]">Yes</Label></div>
                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="no" id="trial-no" /><Label htmlFor="trial-no" className="font-normal text-[13px]">No</Label></div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-slate-600 font-normal text-[13px] leading-tight">How did you hear about Suryadhi / SEMS?</Label>
                <div className="col-span-2">
                  <Select value={watch('mediaSourceId')} onValueChange={(v) => setValue('mediaSourceId', v)}>
                    <SelectTrigger className="h-8 text-[13px] border-slate-300 shadow-none rounded-sm bg-white">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaSources.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-6 text-[13px] shadow-none rounded-sm font-medium">
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
          <Button type="button" onClick={() => navigate('/enquiry')} variant="outline" className="h-8 px-6 text-[13px] border-slate-300 text-slate-700 shadow-none rounded-sm font-medium">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
