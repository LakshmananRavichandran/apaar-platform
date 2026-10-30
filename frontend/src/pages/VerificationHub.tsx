import React, { useState } from 'react';
import {
  ShieldCheck, RefreshCw, Cpu, CheckCircle2, AlertTriangle,
  Play, Download, ExternalLink, Activity, Sparkles, Filter,
  FileText, UploadCloud, Eye, Scan, Lock, Award, FileSearch,
  Check, X, AlertCircle
} from 'lucide-react';
import { ApiClient } from '../services/api';

export const VerificationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'identity_engine' | 'document_forensics'>('document_forensics');

  // --- Tab 1: Identity & DigiLocker State ---
  const [apaarInput, setApaarInput] = useState('100000000007');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [simulateDelay, setSimulateDelay] = useState(true);
  const [simulateError, setSimulateError] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // --- Tab 2: Watermark, Hologram & Document Forensics State ---
  const [forensicFile, setForensicFile] = useState<File | null>(null);
  const [forensicApaar, setForensicApaar] = useState('100000000007');
  const [forensicLoading, setForensicLoading] = useState(false);
  const [forensicResult, setForensicResult] = useState<any>(null);
  const [forensicError, setForensicError] = useState<string | null>(null);

  const handleRunVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const searchRes = await ApiClient.get('/students', { search: apaarInput.trim(), limit: 1 });
      if (!searchRes.students || searchRes.students.length === 0) {
        throw new Error(`Student with APAAR ID ${apaarInput} not found in database.`);
      }

      const studentId = searchRes.students[0].id;
      const verifyRes = await ApiClient.post(`/verification/verify-student/${studentId}`);
      setResult({ student: searchRes.students[0], ...verifyRes });
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDigiLockerSync = async () => {
    if (!result?.student?.id) return;
    setSyncLoading(true);
    try {
      const res = await ApiClient.get(`/verification/digilocker-sync/${result.student.id}`, {
        simulate_error: simulateError
      });
      setSyncResult(res);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTriggerNightlyScheduler = async () => {
    try {
      const res = await ApiClient.post('/verification/run-nightly-verification');
      alert(res.message);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // --- Forensic Upload & Analysis Handlers ---
  const handleForensicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForensicFile(e.target.files[0]);
      setForensicError(null);
    }
  };

  const handleRunForensicScan = async (overrideFile?: File, overrideApaar?: string) => {
    const fileToUpload = overrideFile || forensicFile;
    if (!fileToUpload) {
      setForensicError('Please select or drag a PDF marksheet or certificate file.');
      return;
    }

    setForensicLoading(true);
    setForensicError(null);
    setForensicResult(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    const apaarVal = overrideApaar !== undefined ? overrideApaar : forensicApaar;
    if (apaarVal.trim()) {
      formData.append('apaar_id', apaarVal.trim());
    }

    try {
      const data = await ApiClient.post('/verification/analyze-document-authenticity', formData);
      setForensicResult(data);
    } catch (err: any) {
      setForensicError(err.response?.data?.detail || err.message || 'Forensic inspection failed');
    } finally {
      setForensicLoading(false);
    }
  };

  // Demo Samples for Evaluators & Judges
  const handleLoadAuthenticDemo = () => {
    const sampleBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a,
      0x25, 0xc4, 0xe5, 0xf2, 0xe5, 0x0a, 0x31, 0x20, 0x30,
      0x20, 0x6f, 0x62, 0x6a, 0x0a, 0x3c, 0x3c, 0x20, 0x2f,
      0x50, 0x72, 0x6f, 0x64, 0x75, 0x63, 0x65, 0x72, 0x20,
      0x28, 0x41, 0x49, 0x43, 0x54, 0x45, 0x20, 0x41, 0x50,
      0x41, 0x41, 0x52, 0x20, 0x56, 0x65, 0x72, 0x69, 0x66,
      0x79, 0x20, 0x43, 0x65, 0x72, 0x74, 0x69, 0x66, 0x69,
      0x63, 0x61, 0x74, 0x65, 0x20, 0x45, 0x6e, 0x67, 0x69,
      0x6e, 0x65, 0x29, 0x20, 0x2f, 0x42, 0x79, 0x74, 0x65,
      0x52, 0x61, 0x6e, 0x67, 0x65, 0x20, 0x5b, 0x30, 0x20,
      0x31, 0x20, 0x32, 0x5d, 0x20, 0x3e, 0x3e, 0x0a, 0x65,
      0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, 0x25, 0x25, 0x45,
      0x4f, 0x46, 0x0a
    ]);
    const blob = new Blob([sampleBytes], { type: 'application/pdf' });
    const file = new File([blob], 'AICTE_Official_Marksheet_Authentic.pdf', { type: 'application/pdf' });
    setForensicFile(file);
    setForensicApaar('100000000007');
    handleRunForensicScan(file, '100000000007');
  };

  const handleLoadTamperedDemo = () => {
    const forgedBytes = new TextEncoder().encode(
      '%PDF-1.4\n1 0 obj\n<< /Producer (Canva/Photoshop Spliced) /ModDate (D:20261028120000) >>\nendobj\n%%EOF\n' +
      '2 0 obj\n<< /Type /Annot /Contents (Altered CGPA from 6.2 to 9.8) >>\nendobj\n%%EOF\n'
    );
    const blob = new Blob([forgedBytes], { type: 'application/pdf' });
    const file = new File([blob], 'Tampered_Marksheet_Grade_Edited.pdf', { type: 'application/pdf' });
    setForensicFile(file);
    setForensicApaar('999999999999'); // Non-existent or mismatched APAAR
    handleRunForensicScan(file, '999999999999');
  };

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#EA580C] uppercase tracking-wider mb-1">
            <span>AICTE Problem Statement SIH26263</span>
            <span>•</span>
            <span className="text-[#15803D] dark:text-emerald-400">National Forensic Cell</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-[#0A3871] dark:text-blue-400" />
            <span>AICTE Verification & Forensic Authenticity Hub</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Zero-Trust identity checks, Scikit-Learn IsolationForest anomaly scoring, and multi-spectral watermark & hologram inspection
          </p>
        </div>

        <button
          onClick={handleTriggerNightlyScheduler}
          className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
          <span>Run Nightly Batch Queue</span>
        </button>
      </div>

      {/* Main Tab Navigation Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('document_forensics')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'document_forensics'
              ? 'text-[#0A3871] dark:text-blue-400 border-b-2 border-[#0A3871] dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scan className="w-4 h-4 text-[#EA580C]" />
          <span>Watermark, Hologram & PDF Authenticator</span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold">
            Live Tool
          </span>
        </button>

        <button
          onClick={() => setActiveTab('identity_engine')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'identity_engine'
              ? 'text-[#0A3871] dark:text-blue-400 border-b-2 border-[#0A3871] dark:border-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Student APAAR ID & DigiLocker Gateway</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: WATERMARK, HOLOGRAM & DOCUMENT FORENSICS (NEW LIVE TOOL)
          ========================================================================= */}
      {activeTab === 'document_forensics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Forensics Inspection Card */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scan className="w-5 h-5 text-[#0A3871] dark:text-blue-400" />
                  <span>Multi-Spectral Document & Hologram Authenticity Scanner</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload any marksheet or degree PDF to verify Optical Hologram (OVD) diffraction, paper/digital watermarks, Error Level Analysis (ELA) grade tampering, and PAdES signatures.
                </p>
              </div>

              {/* Demo Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadAuthenticDemo}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-xs"
                  title="Test an authentic AICTE certificate"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Demo: Genuine PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadTamperedDemo}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition flex items-center gap-1.5 shadow-xs"
                  title="Test a tampered document with spliced grades"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Demo: Tampered PDF</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* File upload zone */}
              <div className="md:col-span-2 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0A3871] dark:hover:border-blue-500 rounded-xl p-5 text-center transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 relative">
                <input
                  type="file"
                  id="forensic-file-input"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleForensicFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-8 h-8 text-[#0A3871] dark:text-blue-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {forensicFile ? (
                    <span className="text-[#0A3871] dark:text-blue-400 font-mono text-sm">{forensicFile.name} ({(forensicFile.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    <span>Click or Drag & Drop marksheet PDF / Certificate</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Supported formats: PDF (e-Certificates, Marksheets), PNG, JPG, JPEG (Max 15MB)
                </div>
              </div>

              {/* Optional APAAR Registry Cross-Match Input */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Student APAAR ID (For Cross-Check)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={forensicApaar}
                    onChange={(e) => setForensicApaar(e.target.value)}
                    placeholder="100000000007"
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Matches document grades & name against AICTE master database.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRunForensicScan()}
                  disabled={forensicLoading}
                  className="spotify-pill-btn w-full text-xs py-2.5 font-bold cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <FileSearch className={`w-4 h-4 ${forensicLoading ? 'animate-spin' : ''}`} />
                  <span>{forensicLoading ? 'Analyzing Document Forensics...' : 'Run Forensic Authenticity Scan'}</span>
                </button>
              </div>
            </div>

            {forensicError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{forensicError}</span>
              </div>
            )}
          </div>

          {/* Forensic Results Dashboard */}
          {forensicResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Verdict Header Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                forensicResult.verdict === 'AUTHENTIC_GENUINE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                  : forensicResult.verdict === 'SUSPICIOUS_REVIEW_REQUIRED'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-100'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    forensicResult.verdict === 'AUTHENTIC_GENUINE'
                      ? 'bg-emerald-600 text-white'
                      : forensicResult.verdict === 'SUSPICIOUS_REVIEW_REQUIRED'
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {forensicResult.verdict === 'AUTHENTIC_GENUINE' ? (
                      <ShieldCheck className="w-7 h-7" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight">
                        {forensicResult.verdict === 'AUTHENTIC_GENUINE'
                          ? 'AUTHENTIC ACADEMIC CREDENTIAL'
                          : forensicResult.verdict === 'SUSPICIOUS_REVIEW_REQUIRED'
                          ? 'SUSPICIOUS ANOMALY DETECTED (MANUAL REVIEW REQUIRED)'
                          : 'FORGERY OR DIGITAL TAMPER DETECTED'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        forensicResult.verdict === 'AUTHENTIC_GENUINE'
                          ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-white'
                          : 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-white'
                      }`}>
                        {forensicResult.verdict}
                      </span>
                    </div>
                    <div className="text-xs opacity-80 mt-0.5">
                      File: <span className="font-mono font-bold">{forensicResult.filename}</span> • Size: {(forensicResult.file_size_bytes / 1024).toFixed(1)} KB • Timestamp: {forensicResult.timestamp}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Composite Trust Score</div>
                  <div className="text-3xl font-black">{forensicResult.composite_security_score}%</div>
                </div>
              </div>

              {/* 4 Security Forensic Pillar Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Hologram / OVD Diffraction */}
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#EA580C]" />
                      <span>Optical Hologram</span>
                    </span>
                    <span className="text-[#0A3871] dark:text-blue-400 font-black">
                      {forensicResult.hologram_analysis?.holographic_authenticity_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EA580C] rounded-full"
                      style={{ width: `${forensicResult.hologram_analysis?.holographic_authenticity_score}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div>Iridescence Index: <span className="font-bold text-slate-800 dark:text-slate-200">{forensicResult.hologram_analysis?.iridescence_spectrum_index}</span></div>
                    <div>Reflectance Pixels: <span className="font-mono text-slate-800 dark:text-slate-200">{forensicResult.hologram_analysis?.specular_reflectance_pixels} px</span></div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                      {forensicResult.hologram_analysis?.status}
                    </div>
                  </div>
                </div>

                {/* 2. Watermark & Substrate Integrity */}
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#15803D]" />
                      <span>Watermark Integrity</span>
                    </span>
                    <span className="text-[#15803D] dark:text-emerald-400 font-black">
                      {forensicResult.watermark_analysis?.optical_watermark?.watermark_density_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15803D] rounded-full"
                      style={{ width: `${forensicResult.watermark_analysis?.optical_watermark?.watermark_density_score}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div>Fourier Frequency: <span className="font-mono text-slate-800 dark:text-slate-200">{forensicResult.watermark_analysis?.optical_watermark?.spatial_frequency_energy}</span></div>
                    <div>Stream Tokens: <span className="font-bold text-slate-800 dark:text-slate-200">{forensicResult.watermark_analysis?.digital_watermark_in_stream?.matching_tokens?.join(', ') || 'AICTE / APAAR'}</span></div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                      {forensicResult.watermark_analysis?.optical_watermark?.status}
                    </div>
                  </div>
                </div>

                {/* 3. Tamper & Error Level Analysis (ELA) */}
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0A3871] dark:text-blue-400" />
                      <span>Tamper & ELA Integrity</span>
                    </span>
                    <span className="text-[#0A3871] dark:text-blue-400 font-black">
                      {forensicResult.tamper_forensics?.error_level_analysis?.integrity_score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A3871] dark:bg-blue-500 rounded-full"
                      style={{ width: `${forensicResult.tamper_forensics?.error_level_analysis?.integrity_score}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div>ELA Tamper Risk: <span className="font-bold text-slate-800 dark:text-slate-200">{forensicResult.tamper_forensics?.error_level_analysis?.tamper_risk_score}%</span></div>
                    <div>Incremental Revisions: <span className="font-mono text-slate-800 dark:text-slate-200">{forensicResult.tamper_forensics?.pdf_revision_anomalies?.eof_count || 1} revision(s)</span></div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                      Sig: {forensicResult.tamper_forensics?.cryptographic_signatures?.signature_type || 'Unsigned'}
                    </div>
                  </div>
                </div>

                {/* 4. Sovereign AICTE Registry Match */}
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                      <span>Registry Match</span>
                    </span>
                    <span className={`text-xs font-black ${forensicResult.registry_cross_check?.matched ? 'text-[#15803D]' : 'text-amber-500'}`}>
                      {forensicResult.registry_cross_check?.matched ? 'VERIFIED' : 'UNMATCHED'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${forensicResult.registry_cross_check?.matched ? 'bg-[#15803D]' : 'bg-amber-400'}`}
                      style={{ width: forensicResult.registry_cross_check?.matched ? '100%' : '30%' }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                    <div className="truncate">Student: <span className="font-bold text-slate-800 dark:text-slate-200">{forensicResult.registry_cross_check?.registered_name || 'N/A'}</span></div>
                    <div>Depository CGPA: <span className="font-bold text-slate-800 dark:text-slate-200">{forensicResult.registry_cross_check?.cgpa ? `${forensicResult.registry_cross_check.cgpa}/10.0` : 'N/A'}</span></div>
                    <div className="text-[10px] font-semibold text-slate-500 truncate mt-1">
                      {forensicResult.registry_cross_check?.institution || 'External Document'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Findings Checklist & Explanation Feed */}
              <div className="bg-white dark:bg-[#0F172A] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EA580C]" />
                  <span>Explainable Forensic Analysis & Indicator Findings</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {forensicResult.findings?.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2"
                    >
                      {item.toLowerCase().includes('fail') || item.toLowerCase().includes('tamper') || item.toLowerCase().includes('suspicious') || item.toLowerCase().includes('not registered') ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Check className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORIGINAL DETERMINISTIC IDENTITY & DIGILOCKER PIPELINE
          ========================================================================= */}
      {activeTab === 'identity_engine' && (
        <div className="space-y-6 animate-fade-in">
          {/* Manual Verification Form */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0A3871] dark:text-blue-400" />
              <span>Execute Instant Student Verification Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter a 12-digit APAAR ID to execute checksum validation, age range checks, admission semester coherence, duplicate detection, and IsolationForest anomaly analysis.
            </p>

            <form onSubmit={handleRunVerification} className="flex gap-3">
              <input
                type="text"
                required
                maxLength={12}
                value={apaarInput}
                onChange={(e) => setApaarInput(e.target.value)}
                placeholder="e.g. 100000000007"
                className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-[#0A3871] outline-none font-mono text-sm"
              />
              <button
                type="submit"
                disabled={verifying}
                className="spotify-pill-btn text-xs py-3 px-6 shrink-0 disabled:opacity-50"
              >
                <span>{verifying ? 'Executing Pipeline...' : 'Run Verification Pipeline'}</span>
              </button>
            </form>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Verification Pipeline Results */}
          {result && (
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{result.student.name}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                      result.status === 'Verified' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                      result.status === 'Flagged' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    APAAR ID: {result.student.apaar_id} • {result.student.college_name || 'AICTE College'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Trust Score</span>
                  <span className="text-2xl font-black text-[#15803D] dark:text-emerald-400">{result.trust_score}%</span>
                </div>
              </div>

              {/* Rule-by-rule results */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3">Deterministic Rule Checks</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>12-Digit Luhn Checksum</span>
                    {result.rule_results?.checksum_valid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>Age at Admission (16-60)</span>
                    {result.rule_results?.age_valid !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>Semester / Term Coherence</span>
                    {result.rule_results?.semester_valid !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>CGPA Scale (0.0 - 10.0)</span>
                    {result.rule_results?.cgpa_valid !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>Cross-College Uniqueness</span>
                    {result.rule_results?.unique_apaar !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                    <span>IsolationForest ML Risk</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{result.risk_score}% Risk</span>
                  </div>
                </div>
              </div>

              {/* Anomaly Explanations */}
              {result.anomaly_reasons && result.anomaly_reasons.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-[#EA580C]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Detected Discrepancy Reasons:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {result.anomaly_reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* DigiLocker Sync Gateway section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#0A3871] dark:text-blue-400" />
                      <span>DigiLocker Realtime Sync Gateway</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fetch official citizen record, test latency, rate limits, and diff resolution
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={simulateError}
                        onChange={(e) => setSimulateError(e.target.checked)}
                        className="accent-red-500"
                      />
                      <span>Simulate Gateway 503</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDigiLockerSync}
                      disabled={syncLoading}
                      className="spotify-pill-secondary text-xs py-1.5 px-3"
                    >
                      {syncLoading ? 'Syncing...' : 'Sync with DigiLocker'}
                    </button>
                  </div>
                </div>

                {/* Sync Results Matrix */}
                {syncResult && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {syncResult.success ? 'Official Record Retrieved' : 'Gateway Response Error'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {syncResult.synced_at || 'HTTP Error'}
                      </span>
                    </div>

                    {!syncResult.success ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
                        {syncResult.message}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="py-1">Field</th>
                              <th className="py-1">College Value</th>
                              <th className="py-1">DigiLocker Official Value</th>
                              <th className="py-1 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {syncResult.differences?.map((d: any) => (
                              <tr key={d.field}>
                                <td className="py-2 font-bold text-slate-700 dark:text-slate-300">{d.label}</td>
                                <td className="py-2 text-slate-900 dark:text-white">{d.college_value}</td>
                                <td className="py-2 text-[#15803D] dark:text-emerald-400 font-semibold">{d.official_value}</td>
                                <td className="py-2 text-right">
                                  {d.matches ? (
                                    <span className="text-[#15803D] dark:text-emerald-400 font-bold">Matched</span>
                                  ) : (
                                    <span className="text-[#EA580C] font-bold">Mismatch ({d.similarity_score}%)</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
