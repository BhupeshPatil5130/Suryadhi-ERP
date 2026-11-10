import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { BRAND } from '@/lib/brand';
import {
  Eye, EyeOff, Loader2, Lock, User,
  Calendar, ChevronRight, ArrowLeft, Building2,
  CheckCircle2, Sparkles, ShieldCheck
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { setAcademicYear, setAcademicYearId, setActivePortal, setActiveBrandId } = useUIStore();

  // Multi-step session configuration state
  const [step, setStep] = useState<'login' | 'systemSelect' | 'academicYear'>('login');
  const [isConfiguringSession, setIsConfiguringSession] = useState(false);

  // Form & selection states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPortal, setSelectedPortal] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [academicYearsRaw, setAcademicYearsRaw] = useState<any[]>([]);

  // Only redirect away if the user was already authenticated before opening this page
  // and has already completed setup (not in the middle of our 3-step setup)
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isConfiguringSession && step === 'login') {
      const existingYear = localStorage.getItem('academicYear');
      const existingPortal = localStorage.getItem('activePortal');
      if (existingYear && existingPortal) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, isConfiguringSession, step, navigate]);

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
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch academic years lookup, using default list');
    }
    // Fallback defaults (Apr to May)
    setAcademicYears(['Apr 26 - May 27', 'Apr 25 - May 26']);
    setAcademicYearsRaw([
      { id: 'ay1', label: 'Apr 26 - May 27' },
      { id: 'ay0', label: 'Apr 25 - May 26' },
    ]);
    setSelectedYear('Apr 26 - May 27');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setIsConfiguringSession(true);
    try {
      await login(username, password);
      await fetchAcademicYears();
      setStep('systemSelect');
    } catch (err: any) {
      setIsConfiguringSession(false);
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

  const handleBrandSelect = (brandName: string, brandId: string) => {
    setSelectedPortal(brandName);
    setSelectedBrandId(brandId);
    setStep('academicYear');
  };

  const handleProceed = () => {
    // 1. Lock Academic Year in state and persistent storage
    setAcademicYear(selectedYear);
    const matchedYear = academicYearsRaw.find((y) => y.label === selectedYear);
    if (matchedYear) {
      setAcademicYearId(matchedYear.id);
    } else {
      setAcademicYearId('ay1');
    }

    // 2. Lock Brand & Portal in state and storage
    setActivePortal(selectedPortal);
    if (selectedBrandId) {
      setActiveBrandId(selectedBrandId);
    } else {
      const matchedBrand = BRAND.subBrands.find(
        (b) => b.name === selectedPortal || b.fullName === selectedPortal
      );
      if (matchedBrand) {
        setActiveBrandId(matchedBrand.id);
      }
    }

    // 3. Navigate into ERP dashboard
    navigate('/dashboard');
  };

  const activeSubBrand =
    BRAND.subBrands.find((b) => b.id === selectedBrandId || b.name === selectedPortal) ||
    BRAND.subBrands[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] py-10 relative">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/40 pointer-events-none" />

      <div
        className={`relative z-10 w-full px-4 transition-all duration-300 ${
          step === 'systemSelect'
            ? 'max-w-6xl'
            : step === 'academicYear'
            ? 'max-w-xl'
            : 'max-w-[480px]'
        }`}
      >
        {/* ─── STEP 1: LOGIN CREDENTIALS ─────────────────────────────────── */}
        {step === 'login' && (
          <>
            {/* Header / Brand Logo */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-4 border border-slate-200 shadow-md bg-white p-2 flex items-center justify-center">
                <img
                  src={BRAND.iconSrc}
                  alt="Suryadhi Learning"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {BRAND.systemName}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  Franchisee: <strong>{BRAND.franchiseCode}</strong>
                </span>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Sign in to ERP</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your credentials to manage school franchise operations
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg mt-2 text-sm"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span>Sign In & Continue</span>
                      <ChevronRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-blue-700 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Secured with JWT authentication • {BRAND.copyright}</span>
              </div>
            </div>
          </>
        )}

        {/* ─── STEP 2: FRANCHISE BRAND SELECTION (3 COLUMN BIG BOX STRUCTURE) ─── */}
        {step === 'systemSelect' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 md:p-10">
            {/* Top Bar / Heading */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Step 2 of 3: Select School Brand</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Select Franchise Brand
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Choose the school brand module to launch for franchisee{' '}
                <strong className="text-slate-800 font-semibold">{BRAND.franchiseCode}</strong> (
                {BRAND.franchiseName})
              </p>
            </div>

            {/* 3 Column Big Box Structure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {BRAND.subBrands.map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand.name, brand.id)}
                  className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer p-6 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 uppercase border border-slate-200/80 transition-colors">
                      {brand.code}
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      {BRAND.franchiseCode}
                    </span>
                  </div>

                  {/* Big Image Container */}
                  <div className="w-full h-36 bg-slate-50/80 group-hover:bg-blue-50/40 rounded-xl border border-slate-200/90 p-4 flex items-center justify-center transition-colors mb-5 shadow-xs">
                    <img
                      src={brand.logoSrc}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                      {brand.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed flex-1">
                      {brand.desc}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Franchise Center:</span>
                      <strong className="text-slate-800">{BRAND.franchiseCode}</strong>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-100 group-hover:bg-blue-700 text-slate-800 group-hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md"
                  >
                    <span>Select Brand</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ))}
            </div>

            {/* Back Button */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
              <span className="text-xs text-slate-400">
                Logged in as <strong>@{username || 'user'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* ─── STEP 3: ACADEMIC YEAR SELECTION ───────────────────────────── */}
        {step === 'academicYear' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 md:p-10">
            {/* Header info with chosen brand preview */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Step 3 of 3: Lock Academic Year</span>
              </div>

              {/* Chosen Brand Badge */}
              <div className="flex items-center justify-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 max-w-md mx-auto mb-5 shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                  <img
                    src={activeSubBrand.logoSrc}
                    alt={activeSubBrand.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {activeSubBrand.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Franchisee: <span className="font-semibold">{BRAND.franchiseCode}</span>
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Select Academic Year
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select the academic session. This will be locked for all admissions, fee receipts,
                and reports.
              </p>
            </div>

            {/* Academic Year Selection Cards */}
            <div className="space-y-3 mb-6">
              {academicYears.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900">{year}</span>
                        {year.includes('Apr 26') && (
                          <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Current Session
                          </span>
                        )}
                      </div>
                    </div>
                    <Calendar className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                );
              })}
            </div>

            {/* Session Lock Notice */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 mb-6 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="font-bold text-amber-600 text-base leading-none">ℹ</span>
              <p className="leading-relaxed">
                <strong>Session Locked:</strong> Once confirmed, all student admissions, fee calculations, and receipt generations will strictly operate under <strong>{selectedYear}</strong>. There is no mid-session switching allowed inside the ERP.
              </p>
            </div>

            {/* Proceed Button */}
            <Button
              onClick={handleProceed}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <span>Confirm & Launch ERP Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Back Button */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setStep('systemSelect')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change School Brand</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
