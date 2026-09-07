import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Menu, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { showToast } from '@/lib/toast';

export default function ProgramChangePage() {
  const navigate = useNavigate();
  const [uin, setUin] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [newProgramId, setNewProgramId] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/lookups/programs');
        if (res.data.success) setPrograms(res.data.data);
      } catch (err) {
        console.error('Failed to load programs', err);
      }
    };
    fetchPrograms();
  }, []);

  const fetchStudent = async () => {
    if (!uin) return;
    setIsLoadingStudent(true);
    setStudentData(null);
    try {
      const res = await api.get('/admissions', { params: { search: uin, limit: 1 } });
      if (res.data.success && res.data.data.length > 0) {
        setStudentData(res.data.data[0]);
      } else {
        showToast('Student not found with this UIN', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to fetch student details', 'error');
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const handleUpdate = async () => {
    if (!studentData || !newProgramId) return;
    setIsUpdating(true);
    try {
      await api.put(`/admissions/${studentData.id}`, { programId: newProgramId });
      showToast('Program updated successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update program', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12 pt-2 space-y-4">
      <h1 className="text-[24px] font-normal text-[#333] mb-4">Program Change</h1>

      <div className="bg-white border border-[#ccc] shadow-sm">

        {/* Form Header */}
        <div className="bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#ccc] p-2 flex items-center gap-1.5">
          <Menu className="w-4 h-4 text-[#333]" />
          <span className="text-[13px] font-bold text-[#333]">Program Change</span>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">

            {/* Student UIN */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">Student UIN / Name</label>
              <div className="w-[65%] flex items-center gap-2">
                <Input
                  type="text"
                  value={uin}
                  onChange={(e) => setUin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchStudent()}
                  className="h-8 rounded-sm border-[#ccc] text-[13px] w-full"
                  placeholder="Enter UIN or Name"
                />
                <Button
                  onClick={fetchStudent}
                  disabled={isLoadingStudent || !uin}
                  className="h-8 px-3 rounded-[3px] bg-[#f4f4f4] hover:bg-[#e0e0e0] border border-[#ccc] text-[#333] text-[13px] font-normal shadow-sm whitespace-nowrap"
                >
                  {isLoadingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Detail'}
                </Button>
              </div>
            </div>

            {/* Student Name */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">Student Name</label>
              <div className="w-[65%]">
                <Input type="text" value={studentData ? `${studentData.studentFirstName} ${studentData.studentLastName}` : ''} disabled className="h-8 rounded-sm border-[#ccc] bg-[#eee] text-[13px] w-full" />
              </div>
            </div>

            {/* Admission Date */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">Admission Date</label>
              <div className="w-[65%]">
                <Input type="text" value={studentData ? formatDate(studentData.admissionDate) : ''} disabled className="h-8 rounded-sm border-[#ccc] bg-[#eee] text-[13px] w-full" />
              </div>
            </div>

            {/* Franchisee Code */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">Franchisee Code</label>
              <div className="w-[65%]">
                <Input type="text" value={studentData?.school?.code || ''} disabled className="h-8 rounded-sm border-[#ccc] bg-[#eee] text-[13px] w-full" />
              </div>
            </div>

            {/* Existing Program */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">Existing Program</label>
              <div className="w-[65%]">
                <Input type="text" value={studentData?.program?.name || ''} disabled className="h-8 rounded-sm border-[#ccc] bg-[#eee] text-[13px] w-full" />
              </div>
            </div>

            {/* Unlock Option */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] font-medium text-[#333] text-right pr-4">Unlock (Yes & No)</label>
              <div className="w-[65%] flex items-center gap-5 text-[13px] text-[#333]">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="unlockToggle"
                    value="yes"
                    checked={isUnlocked}
                    onChange={() => setIsUnlocked(true)}
                    className="w-4 h-4 text-[#0056b3] focus:ring-0 cursor-pointer"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="unlockToggle"
                    value="no"
                    checked={!isUnlocked}
                    onChange={() => setIsUnlocked(false)}
                    className="w-4 h-4 text-[#0056b3] focus:ring-0 cursor-pointer"
                  />
                  <span>No</span>
                </label>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${isUnlocked ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isUnlocked ? 'Unlocked for Changes' : 'Locked (Select Yes to Edit)'}
                </span>
              </div>
            </div>

            {/* New Program */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4">New Program</label>
              <div className="w-[65%]">
                <Select value={newProgramId} onValueChange={setNewProgramId} disabled={!studentData || !isUnlocked}>
                  <SelectTrigger className={`h-8 rounded-sm border-[#ccc] text-[13px] w-full ${!isUnlocked ? 'bg-[#eee] cursor-not-allowed text-gray-500' : 'bg-white'}`}>
                    <SelectValue placeholder={isUnlocked ? "Select New Program" : "Locked (Select Yes to Unlock)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.filter(p => p.id !== studentData?.programId).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Is Welcome kit Allotted */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 leading-tight">
                Is Welcome kit Allotted by Partner
              </label>
              <div className="w-[65%]">
                <Input type="text" value={studentData ? 'Yes' : ''} disabled className="h-8 rounded-sm border-[#ccc] bg-[#eee] text-[13px] w-full" />
              </div>
            </div>

            {/* Welcome kit used by student? */}
            <div className="flex items-center">
              <label className="w-[35%] text-[13px] text-[#333] text-right pr-4 leading-tight">
                Welcome kit used by student?
              </label>
              <div className="w-[65%]">
                <Select disabled={!studentData || !isUnlocked}>
                  <SelectTrigger className={`h-8 rounded-sm border-[#ccc] text-[13px] w-full ${!isUnlocked ? 'bg-[#eee] cursor-not-allowed text-gray-500' : 'bg-white'}`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-2 pl-[17.5%]">
            <Button
              onClick={handleUpdate}
              disabled={!studentData || !isUnlocked || !newProgramId || isUpdating}
              className="bg-[#0056b3] hover:bg-[#004494] text-white rounded-[3px] h-8 px-4 text-[13px] font-normal shadow-sm"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Program
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-[#333] hover:bg-[#222] text-white rounded-[3px] h-8 px-4 text-[13px] font-normal shadow-sm"
            >
              Cancel
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
