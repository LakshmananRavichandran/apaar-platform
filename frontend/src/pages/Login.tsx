import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Key, UserCheck, AlertCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { ApiClient } from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();

  const [activeTab, setActiveTab] = useState<'password' | 'apaar_otp'>('password');
  const [email, setEmail] = useState('superadmin@aicte.gov.in');
  const [password, setPassword] = useState('Admin@123');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student OTP Login simulation state
  const [studentApaar, setStudentApaar] = useState('100000000007');
  const [studentOtpSent, setStudentOtpSent] = useState(false);
  const [studentOtp, setStudentOtp] = useState('');

  // Password strength calculator
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 4
  };
  const strengthScore = calculatePasswordStrength(password);

  const demoLogins = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'superadmin@aicte.gov.in', pass: 'Admin@123', color: 'bg-blue-600' },
    { role: 'AICTE_OFFICER', label: 'AICTE Officer', email: 'officer@aicte.gov.in', pass: 'Officer@123', color: 'bg-indigo-600' },
    { role: 'REGIONAL_OFFICER', label: 'Regional Officer', email: 'regional.mumbai@aicte.gov.in', pass: 'Regional@123', color: 'bg-cyan-600' },
    { role: 'COLLEGE_ADMIN', label: 'College Admin', email: 'college.admin@vjti.ac.in', pass: 'College@123', color: 'bg-teal-600' },
    { role: 'COLLEGE_STAFF', label: 'College Staff', email: 'staff.data@vjti.ac.in', pass: 'Staff@123', color: 'bg-emerald-600' },
    { role: 'VERIFIER', label: 'Verifier (TCS)', email: 'hr.verifier@tcs.com', pass: 'Verifier@123', color: 'bg-purple-600' },
    { role: 'STUDENT', label: 'Student (Aarav)', email: 'student.aarav@student.aicte.gov.in', pass: 'Student@123', color: 'bg-pink-600' },
    { role: 'AUDITOR', label: 'Auditor (CAG)', email: 'auditor.cag@gov.in', pass: 'Auditor@123', color: 'bg-amber-600' },
  ];

  const handleDemoSelect = (demo: typeof demoLogins[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError(null);
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await ApiClient.post('/auth/login', {
        email,
        password,
        otp: otp || undefined
      });

      if (data.token_type === '2fa_required') {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      setUser(data.user, data.access_token, data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentOtpSent) {
      setStudentOtpSent(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.post('/auth/login', {
        email: 'student.aarav@student.aicte.gov.in',
        password: 'Student@123'
      });
      setUser(data.user, data.access_token, data.refresh_token);
      navigate('/student-portal');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Student login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B1120] flex flex-col justify-between text-slate-900 dark:text-white select-none transition-colors duration-200">
      {/* Indian National Tricolor Ribbon */}
      <div className="gov-tricolor-strip" />

      {/* Top Bar with Theme Toggle */}
      <div className="p-4 flex justify-between items-center max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          <span className="text-[#EA580C]">🇮🇳 भारत सरकार</span>
          <span>•</span>
          <span>Ministry of Education</span>
        </div>
        <button
          onClick={toggleTheme}
          className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#0A3871]" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4">
        {/* Official Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-xl bg-[#0A3871] items-center justify-center text-white font-black text-2xl shadow-md border border-blue-900 mb-3">
            <span className="text-[#EA580C] text-lg">A</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            APAAR<span className="text-[#EA580C]">VERIFY</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            National Academic Depository & Verification Portal • AICTE SIH26263
          </p>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          {/* Role Demo Login Pills Header */}
          <div className="mb-5">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
              <span>One-Click Demo Roles (AICTE & CAG)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoLogins.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleDemoSelect(d)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold text-left transition flex items-center justify-between ${
                    email === d.email
                      ? 'border-[#0A3871] bg-blue-50 dark:bg-blue-950/60 text-[#0A3871] dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span className="truncate">{d.label}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${d.color}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Tab switch */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                activeTab === 'password'
                  ? 'bg-white dark:bg-[#0A3871] text-[#0A3871] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Institutional Role Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apaar_otp')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                activeTab === 'apaar_otp'
                  ? 'bg-white dark:bg-[#0A3871] text-[#0A3871] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Student APAAR + OTP
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'password' ? (
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@aicte.gov.in"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none"
                  />
                </div>
                {/* Password strength meter */}
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        strengthScore >= step
                          ? strengthScore === 4
                            ? 'bg-[#15803D]'
                            : strengthScore >= 2
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {requires2FA && (
                <div className="animate-fade-in">
                  <label className="text-xs font-bold text-[#0A3871] dark:text-blue-400 block mb-1">Two-Factor TOTP Code</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-[#0A3871] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit TOTP code"
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[#0A3871] outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="spotify-pill-btn w-full text-xs py-2.5 mt-2 font-bold cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentOtpLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">12-Digit APAAR ID</label>
                <input
                  type="text"
                  maxLength={12}
                  required
                  value={studentApaar}
                  onChange={(e) => setStudentApaar(e.target.value)}
                  placeholder="100000000007"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none font-mono"
                />
              </div>

              {studentOtpSent ? (
                <div>
                  <label className="text-xs font-bold text-[#0A3871] dark:text-blue-400 block mb-1">One-Time Password (OTP)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={studentOtp}
                    onChange={(e) => setStudentOtp(e.target.value)}
                    placeholder="Enter simulated OTP (e.g. 123456)"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-lg border border-[#0A3871] outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Simulated OTP sent to registered Aadhaar mobile (+91-XXXXX-3210). Any 6 digits work!
                  </span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="spotify-pill-btn w-full text-xs py-2.5 mt-2 font-bold cursor-pointer"
              >
                <span>{studentOtpSent ? 'Verify OTP & Enter' : 'Send Simulated OTP'}</span>
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500">
            <span>Protected under the Digital Personal Data Protection (DPDP) Act 2023. Account lockout enforced after 5 failed attempts.</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-3 text-center text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        All India Council for Technical Education (AICTE) • National Student Data Management & Verification Portal
      </div>
    </div>
  );
};
