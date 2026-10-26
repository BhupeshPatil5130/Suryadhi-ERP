import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api-client';
import { BRAND } from '@/lib/brand';
import {
  Eye, EyeOff, Loader2, Lock, User,
  Calendar, ChevronRight, ArrowLeft
} from 'lucide-react';

import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { setAcademicYear, setAcademicYearId, setActivePortal } = useUIStore();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Three-step login flow: 'login' | 'systemSelect' | 'academicYear'
  const [step, setStep] = useState<'login' | 'systemSelect' | 'academicYear'>('login');
  const [selectedPortal, setSelectedPortal] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [academicYearsRaw, setAcademicYearsRaw] = useState<any[]>([]);

  const fetchAcademicYears = async () => {
    try {
      const res = await apiClient.get('/lookups/academic-years');
      if (res.data.success && res.data.data?.length > 0) {
        setAcademicYearsRaw(res.data.data);
        const labels = res.data.data.map((y: any) => y.label);
        setAcademicYears(labels);
        const current = res.data.data.find((y: any) => y.isCurrent);
        if (current) {
          setSelectedYear(current.label);
        } else {
          setSelectedYear(labels[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch academic years lookup, using default list');
      setAcademicYears(['Apr 26 - Mar 27', 'Apr 25 - Mar 26']);
      setAcademicYearsRaw([
        { id: 'ay1', label: 'Apr 26 - Mar 27' },
        { id: 'ay0', label: 'Apr 25 - Mar 26' }
      ]);
      setSelectedYear('Apr 26 - Mar 27');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      setStep('systemSelect');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.message && !err.message.includes('undefined') ? err.message : null) ||
        'Invalid username or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortalSelect = async (portalName: string) => {
    setSelectedPortal(portalName);
    setIsLoading(true);
    try {
      await fetchAcademicYears();
      setStep('academicYear');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    setAcademicYear(selectedYear);
    const matched = academicYearsRaw.find(y => y.label === selectedYear);
    if (matched) {
      setAcademicYearId(matched.id);
    } else {
      setAcademicYearId('ay1');
    }
    setActivePortal(selectedPortal);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] relative">
      <div className="relative z-10 w-full max-w-[480px] px-4">

        {step === 'login' && (
          <>
            {/* Logo */}
            <div className="text-center mb-8">
              {/* Suryadhi circular icon */}
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border shadow-md bg-white flex items-center justify-center">
                <img
                  src={BRAND.iconSrc}
                  alt="Suryadhi"
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">{BRAND.systemAbbr}</h1>
              <p className="text-sm text-slate-500">
                {BRAND.systemName}
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Sign in to your account to continue
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-blue-700 hover:text-blue-800 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-[11px] text-slate-400 text-center">
                  Secured with JWT authentication • {BRAND.copyright}
                </p>
              </div>
            </div>
          </>
        )}

        {step === 'systemSelect' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg flex flex-col items-center">
            {/* Header branding */}
            <div className="text-center mb-6">
              <img
                src={BRAND.logoSrc}
                alt={BRAND.companyName}
                className="h-10 object-contain mx-auto mb-3"
              />
              <h2 className="text-xl font-bold text-slate-900">Select Portal / Application</h2>
              <p className="text-xs text-slate-500 mt-1">Choose the application module you want to access</p>
            </div>

            <div className="w-full space-y-3">
              {BRAND.portals.map((portal, idx) => (
                <button
                  key={portal.name}
                  onClick={() => handlePortalSelect(portal.name)}
                  className="w-full text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0">
                    <img src={portal.logoSrc} alt={portal.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{portal.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{portal.fullName}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('login')}
              className="mt-6 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Login
            </button>
          </div>
        )}

        {step === 'academicYear' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg flex flex-col items-center">
            {/* Academic year step — Suryadhi SEMS badge */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto flex items-center justify-center bg-white border border-slate-200 shadow-md">
                <img
                  src={BRAND.semsBadgeSrc}
                  alt="SEMS"
                  className="w-28 h-28 object-contain"
                />
              </div>
              <p className="text-[10px] text-slate-600 font-bold tracking-widest text-center mt-3 uppercase leading-tight">
                {BRAND.systemAbbr}<br />{BRAND.systemName}
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">
                  Select Academic Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-slate-300 text-slate-800 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l pl-2 text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              <Button
                onClick={handleProceed}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                Proceed to Dashboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex gap-4 text-[10px] text-slate-400">
              <button
                onClick={() => setStep('systemSelect')}
                className="hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Change Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}