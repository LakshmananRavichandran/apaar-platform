import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  QrCode,
  Building,
  GraduationCap,
  Calendar,
  Award,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PublicVerifyResult {
  is_valid: boolean;
  message?: string;
  verification_code?: string;
  apaar_id?: string;
  student_name?: string;
  institution?: string;
  course?: string;
  branch?: string;
  admission_year?: number;
  cgpa?: number;
  verification_status?: string;
  trust_score?: number;
  verified_on?: string;
}

export const PublicVerify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [codeQuery, setCodeQuery] = useState<string>(searchParams.get('code') || '');
  const [apaarQuery, setApaarQuery] = useState<string>(searchParams.get('apaar') || '829103847192');
  const [queryType, setQueryType] = useState<'apaar' | 'code'>(searchParams.get('code') ? 'code' : 'apaar');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PublicVerifyResult | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (queryType === 'apaar' && !apaarQuery.trim()) {
      toast.error('Enter a 12-digit APAAR ID');
      return;
    }
    if (queryType === 'code' && !codeQuery.trim()) {
      toast.error('Enter a certificate verification code');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const params = queryType === 'apaar' ? { apaar: apaarQuery.trim() } : { code: codeQuery.trim() };
      const res = await axios.get('http://localhost:8000/api/v1/verification/public-verify', { params });
      setResult(res.data);
      if (res.data.is_valid) {
        toast.success('Certificate Authenticated Successfully!');
      } else {
        toast.error('Credential could not be validated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('code') || searchParams.get('apaar')) {
      handleVerify();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col justify-between selection:bg-[#1DB954] selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#181818]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center font-black text-black text-lg shadow-lg shadow-[#1DB954]/20">
            A
          </div>
          <div>
            <div className="font-black text-white text-base tracking-tight">APAAR Verify</div>
            <div className="text-[10px] text-[#B3B3B3]">AICTE National Credential Authentication Gateway</div>
          </div>
        </div>

        <Link
          to="/login"
          className="px-4 py-2 bg-[#282828] hover:bg-[#333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"
        >
          Institutional Login
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            Public Verification Portal
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Authenticate Academic Credentials
          </h1>
          <p className="text-xs md:text-sm text-[#B3B3B3] max-w-xl mx-auto">
            Instantly validate official AICTE student certificates, degrees, and APAAR IDs against the central National Citizen Registry.
          </p>
        </div>

        {/* Verification Input Box */}
        <div className="bg-[#181818] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <label className="flex items-center gap-1.5 cursor-pointer text-white">
              <input
                type="radio"
                name="queryType"
                checked={queryType === 'apaar'}
                onChange={() => setQueryType('apaar')}
                className="accent-[#1DB954]"
              />
              12-Digit APAAR ID
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-white">
              <input
                type="radio"
                name="queryType"
                checked={queryType === 'code'}
                onChange={() => setQueryType('code')}
                className="accent-[#1DB954]"
              />
              Certificate Verification Code
            </label>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row items-center gap-3">
            {queryType === 'apaar' ? (
              <input
                type="text"
                value={apaarQuery}
                onChange={(e) => setApaarQuery(e.target.value)}
                placeholder="Enter 12-digit APAAR ID (e.g. 829103847192)"
                className="w-full bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 font-mono text-sm focus:outline-none focus:border-[#1DB954]"
              />
            ) : (
              <input
                type="text"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                placeholder="Enter Code (e.g. APAAR-VERIFY-2026-7192-3819)"
                className="w-full bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 font-mono text-sm focus:outline-none focus:border-[#1DB954]"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-7 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20 shrink-0"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Validating...' : 'Validate'}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`rounded-3xl border overflow-hidden shadow-2xl ${
                result.is_valid
                  ? 'bg-gradient-to-b from-[#182e1e] to-[#181818] border-[#1DB954]/30'
                  : 'bg-gradient-to-b from-red-950/40 to-[#181818] border-red-500/30'
              }`}
            >
              {result.is_valid ? (
                <div className="p-6 md:p-8 space-y-6">
                  {/* Badge Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider text-[#1DB954]">
                          Authenticated AICTE Credential
                        </div>
                        <h2 className="text-2xl font-black text-white">{result.student_name}</h2>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[11px] text-[#B3B3B3]">AICTE Trust Score</div>
                      <div className="text-2xl font-black text-[#1DB954]">{result.trust_score}%</div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">APAAR ID</span>
                      <div className="font-mono font-bold text-white text-sm">{result.apaar_id}</div>
                    </div>

                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">Verification Code</span>
                      <div className="font-mono font-semibold text-white text-xs truncate">
                        {result.verification_code}
                      </div>
                    </div>

                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">Accredited Institution</span>
                      <div className="font-bold text-white truncate">{result.institution}</div>
                    </div>

                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">Academic Program</span>
                      <div className="font-semibold text-white">
                        {result.course} ({result.branch})
                      </div>
                    </div>

                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">Admission Cohort</span>
                      <div className="font-semibold text-white">{result.admission_year}</div>
                    </div>

                    <div className="bg-[#1f1f1f]/80 p-3.5 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[#B3B3B3]">Official Verification Date</span>
                      <div className="font-semibold text-white">{result.verified_on}</div>
                    </div>
                  </div>

                  {/* Footer Seal */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#B3B3B3]">
                    <span>Digitally sealed via SHA-256 Hash Chain</span>
                    <span className="text-[#1DB954] font-semibold">Status: Officially Verified</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Validation Failed</h3>
                  <p className="text-xs text-[#B3B3B3] max-w-md mx-auto">
                    {result.message || 'No matching academic identity exists in the AICTE National Database. Ensure the APAAR ID or Certificate Code was typed correctly.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 p-6 text-center text-xs text-[#B3B3B3] space-y-1">
        <div>All India Council for Technical Education (AICTE) • APAAR Platform (SIH26263)</div>
        <div className="text-[11px] text-white/40">Compliant with the Digital Personal Data Protection Act 2023</div>
      </footer>
    </div>
  );
};
