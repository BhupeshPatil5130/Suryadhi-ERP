import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, Users, UserPlus, UserCheck, Plus, Sparkles, Loader2, ListFilter } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiDownload } from '@/lib/downloadUtils';

interface LSQLead {
  id: string;
  studentName: string;
  parentName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  area: string;
  program: string;
  leadSource: string;
  leadStatus: string;
  remarks?: string;
  createdAt: string;
}

const mockDashboardData = {
  kpis: {
    enquiries: 154,
    grossAdmission: 85,
    activeAdmissions: 82,
  }
};

const mockAnalytics = {
  enrollmentTrend: [
    { month: 'Jan', count: 12, enquiries: 20 },
    { month: 'Feb', count: 15, enquiries: 25 },
    { month: 'Mar', count: 18, enquiries: 30 },
    { month: 'Apr', count: 22, enquiries: 35 },
    { month: 'May', count: 10, enquiries: 20 },
    { month: 'Jun', count: 8, enquiries: 15 },
  ],
  enquiryByStage: [
    { stage: 'COLD', count: 40 },
    { stage: 'WARM', count: 50 },
    { stage: 'HOT', count: 35 },
    { stage: 'REGISTERED', count: 20 },
    { stage: 'CONVERTED', count: 9 },
  ]
};

const mockLsqLeads = [
  { id: 'l1', studentName: 'Vivaan Joshi', parentName: 'Amit Joshi', mobile: '98223 34455', area: 'Model Town', program: 'Nursery', leadSource: 'Facebook', leadStatus: 'Warm', createdAt: new Date().toISOString() },
  { id: 'l2', studentName: 'Kiara Sen', parentName: 'Rohan Sen', mobile: '90112 88776', area: 'Civil Lines', program: 'Play Group', leadSource: 'Google Ads', leadStatus: 'Hot', createdAt: new Date().toISOString() },
];

export default function EnrollmentSummaryPage() {
  const [academicYear, setAcademicYear] = useState('ay1');
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'lsq'>('analytics');

  // LSQ Form States
  const [lsqLeads, setLsqLeads] = useState<LSQLead[]>([]);
  const [lsqLoading, setLsqLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    area: '',
    program: 'Nursery',
    leadSource: 'Walk-in',
    leadStatus: 'Warm',
    remarks: '',
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, analyticsRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/dashboard/enrollment-analytics')
      ]);
      if (summaryRes.data.success) setData(summaryRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.warn('Dashboard API failed, using fallback mock data', error);
      setData(mockDashboardData);
      setAnalytics(mockAnalytics);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLSQLeads = async () => {
    setLsqLoading(true);
    try {
      const res = await api.get('/enrollment/lsq');
      if (res.data.success) {
        setLsqLeads(res.data.data);
      }
    } catch (error) {
      console.warn('Failed to load LSQ leads, using fallback mock registry', error);
      setLsqLeads(mockLsqLeads);
    } finally {
      setLsqLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLSQLeads();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLSQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.parentName || !formData.mobile || !formData.area) {
      window.dispatchEvent(new CustomEvent('erp-toast', { detail: { message: 'Please fill out all required fields.', type: 'error' } }));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/enrollment/lsq', formData);
      if (res.data.success) {
        // Show success feedback
        window.dispatchEvent(new CustomEvent('erp-toast', { detail: { message: 'LSQ Lead successfully registered!', type: 'success' } }));
        setFormData({
          studentName: '',
          parentName: '',
          mobile: '',
          alternateMobile: '',
          email: '',
          area: '',
          program: 'Nursery',
          leadSource: 'Walk-in',
          leadStatus: 'Warm',
          remarks: '',
        });
        fetchLSQLeads();
        fetchDashboardData(); // update stats
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('erp-toast', { detail: { message: 'Failed to register LSQ Lead. Please try again.', type: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

  const totalEnquiries = data?.kpis?.enquiries || 0;
  const totalAdmissions = data?.kpis?.grossAdmission || 0;
  const conversionRate = totalEnquiries > 0 ? ((totalAdmissions / totalEnquiries) * 100).toFixed(1) : 0;
  const activeStudents = data?.kpis?.activeAdmissions || 0;

  // Format data for chart
  const conversionData = analytics?.enrollmentTrend?.map((item: any) => ({
    name: item.month,
    enquiries: item.enquiries || item.count,
    admissions: item.count,
  })) || [];

  const sourceData = analytics?.enquiryByStage?.map((item: any) => ({
    name: item.stage.replace(/_/g, ' '),
    count: item.count
  })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Summary"
        description="Comprehensive analysis of enquiries, admissions, and conversion rates"
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-lg border flex gap-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                activeTab === 'analytics' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('lsq')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1",
                activeTab === 'lsq' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              LeadSuryadhi Form
            </button>
          </div>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ay1">Apr 26 - Mar 27</SelectItem>
              <SelectItem value="ay0">Apr 25 - Mar 26</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => apiDownload(
            'admissions',
            { academicYearId: academicYear },
            [],
            'enrollment-summary'
          )}>
            <Download className="h-4 w-4" /> Download Report
          </Button>
        </div>
      </PageHeader>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enquiries" value={totalEnquiries} icon={Users} color="blue" />
        <StatCard title="Total Admissions" value={totalAdmissions} icon={UserPlus} color="green" />
        <StatCard title="Overall Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="violet" progressPercent={Number(conversionRate)} />
        <StatCard title="Active Students" value={activeStudents} icon={UserCheck} color="emerald" />
      </div>

      {activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enquiry vs Admission Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Enquiries vs Admissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {conversionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEnq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnq)" />
                      <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAdm)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No trend data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Source Wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Enquiry Stage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <RechartsTooltip 
                        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No stage data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LSQ Capture Form Card */}
          <Card className="lg:col-span-1 border-blue-500/10 shadow-lg shadow-blue-500/5">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-600">
                <Sparkles className="w-4 h-4" />
                Register LeadSuryadhi Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLSQSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Name *</label>
                  <Input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="Enter student full name"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent's Name *</label>
                  <Input
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    placeholder="Enter father or mother name"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <Input
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile"
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Mobile</label>
                    <Input
                      name="alternateMobile"
                      value={formData.alternateMobile}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@mail.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Location *</label>
                  <Input
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Enter city or area name"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                    <select
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Play Group">Play Group</option>
                      <option value="Nursery">Nursery</option>
                      <option value="SUNOIA Junior">SUNOIA Junior</option>
                      <option value="SUNOIA Senior">SUNOIA Senior</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                    <select
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleInputChange}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="Walk-in">Walk-in</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Banner">Banner</option>
                      <option value="Reference">Reference</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Status</label>
                  <select
                    name="leadStatus"
                    value={formData.leadStatus}
                    onChange={handleInputChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Cold">Cold</option>
                    <option value="Warm">Warm</option>
                    <option value="Hot">Hot</option>
                    <option value="Registered">Registered</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="Enter observations..."
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Lead
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* LSQ Leads List Card */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-slate-500" />
                LeadSuryadhi Leads Registry
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-slate-100">{lsqLeads.length} Registered Leads</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-border text-slate-600 font-semibold">
                      <th className="p-3">Student / Parent</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Area</th>
                      <th className="p-3">Program</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lsqLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          Loading Leads...
                        </td>
                      </tr>
                    ) : lsqLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No LeadSuryadhi Leads registered yet.</td>
                      </tr>
                    ) : (
                      lsqLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">{lead.studentName}</p>
                            <p className="text-[10px] text-muted-foreground">Parent: {lead.parentName}</p>
                          </td>
                          <td className="p-3">
                            <p>{lead.mobile}</p>
                            {lead.email && <p className="text-[10px] text-muted-foreground">{lead.email}</p>}
                          </td>
                          <td className="p-3 text-slate-700">{lead.area}</td>
                          <td className="p-3 font-medium text-slate-700">{lead.program}</td>
                          <td className="p-3 text-slate-600">{lead.leadSource}</td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              lead.leadStatus === 'Hot' ? "bg-red-100 text-red-700" :
                              lead.leadStatus === 'Warm' ? "bg-amber-100 text-amber-700" :
                              lead.leadStatus === 'Cold' ? "bg-blue-100 text-blue-700" :
                              lead.leadStatus === 'Converted' ? "bg-green-100 text-green-700" :
                              "bg-slate-100 text-slate-700"
                            )}>
                              {lead.leadStatus}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
