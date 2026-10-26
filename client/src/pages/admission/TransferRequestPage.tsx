import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import api from '@/api/client';

export default function TransferRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const admissionId = searchParams.get('admissionId');

  const [admission, setAdmission] = useState<any>(null);
  const [toSchoolName, setToSchoolName] = useState('');
  const [reason, setReason] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admissionId) {
      api.get(`/admissions/${admissionId}`)
        .then((res) => { if (res.data.success) setAdmission(res.data.data); })
        .catch(() => {});
    }
  }, [admissionId]);

  const handleSave = async () => {
    if (!admissionId) {
      setError('No admission selected.');
      return;
    }
    if (!toSchoolName.trim()) {
      setError('Please enter the destination school name.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await api.post('/transfers/request', { admissionId, toSchoolName, reason, transferDate });
      navigate('/admission');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit transfer request');
      setTimeout(() => navigate('/admission'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = 'Apr 26 - Mar 27';
  const studentName = admission ? `${admission.student?.firstName || ''} ${admission.student?.lastName || ''}`.trim() : 'Mahi Sachin Rathod';
  const programName = admission?.program?.name || 'SUNOIA Senior';

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-4">
        <div className="bg-[#f2f2f2] px-4 py-2 border border-slate-300 border-b-0 rounded-t-sm flex items-center">
          <span className="font-semibold text-[13px] text-slate-700">≡ School Transfer Request Form</span>
        </div>

        <div className="border border-slate-300 p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-sm">{error}</div>}

          <div className="max-w-3xl space-y-5">
            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">Academic Year</Label>
              <Select defaultValue="26-27" disabled>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-[250px] bg-[#f5f5f5]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="26-27">{currentYear}</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">From School Name</Label>
              <Input type="text" value="EK-Demo School" className="h-8 text-[13px] border-slate-300 rounded-sm bg-[#f5f5f5] max-w-lg" readOnly />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">Program Name</Label>
              <Select value={programName} disabled>
                <SelectTrigger className="h-8 text-[13px] border-slate-300 rounded-sm w-[250px] bg-[#f5f5f5]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={programName}>{programName}</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">Student Full Name</Label>
              <Input type="text" value={studentName} className="h-8 text-[13px] border-slate-300 rounded-sm bg-[#f5f5f5] max-w-sm" readOnly />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">To School Name</Label>
              <Input type="text" value={toSchoolName} onChange={(e) => setToSchoolName(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm max-w-lg" placeholder="Enter destination school name" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">Transfer Out Reason</Label>
              <Input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm max-w-[300px]" placeholder="Enter reason" />
            </div>

            <div className="grid grid-cols-[160px_1fr] items-center gap-4">
              <Label className="text-right text-[13px] text-slate-700 font-normal">Transfer Out Date</Label>
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="h-8 text-[13px] border-slate-300 rounded-sm max-w-[200px]" />
            </div>
          </div>
        </div>

        <div className="bg-[#f2f2f2] px-6 py-4 border border-slate-300 border-t-0 rounded-b-sm flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#0056b3] hover:bg-[#004494] text-white h-8 px-5 text-[13px] shadow-none rounded-sm font-medium">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={() => navigate(-1)} className="bg-[#333] hover:bg-[#222] text-white h-8 px-5 text-[13px] shadow-none rounded-sm font-medium">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
