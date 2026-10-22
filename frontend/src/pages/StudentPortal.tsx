import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
  Trash2,
  Send,
  Building,
  Calendar,
  Award,
  HelpCircle,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { api, getDownloadUrl } from '../services/api';
import toast from 'react-hot-toast';

interface StudentProfile {
  id: number;
  apaar_id: string;
  name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  category: string;
  aadhaar_last4: string;
  phone_masked: string;
  email: string;
  address: string;
  college: string;
  course: string;
  branch: string;
  admission_year: number;
  current_semester: number;
  cgpa: number;
  enrollment_no: string;
  verification_status: string;
  trust_score: number;
  risk_score: number;
}

interface TimelineItem {
  step: string;
  status: string;
  date: string;
  detail: string;
}

interface AcademicRecord {
  semester: number;
  sgpa: number;
  cgpa: number;
  credits_earned: number;
  status: string;
}

interface ConsentCenterData {
  pending_requests: Array<{
    id: number;
    request_code: string;
    organization_name: string;
    purpose: string;
    requested_fields: string[];
    status: string;
    created_at: string;
  }>;
  active_consents: Array<{
    id: number;
    organization_name: string;
    fields_granted: string[];
    status: string;
    granted_at: string;
    expires_at: string;
  }>;
  history: Array<{
    organization_name: string;
    purpose: string;
    status: string;
    date: string;
  }>;
}

export const StudentPortal: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [consentData, setConsentData] = useState<ConsentCenterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'consent' | 'transcripts' | 'privacy'>('overview');

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportSubject, setReportSubject] = useState<string>('');
  const [reportDesc, setReportDesc] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('Graduation Completed - Revoke third-party sharing');
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [profRes, consentRes] = await Promise.all([
        api.get('/student-portal/my-profile'),
        api.get('/student-portal/consent-center')
      ]);
      setProfile(profRes.data.student);
      setTimeline(profRes.data.timeline || []);
      setAcademicRecords(profRes.data.academic_records || []);
      setConsentData(consentRes.data);
    } catch (err: any) {
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleDownloadIdCard = () => {
    window.open(getDownloadUrl('/student-portal/my-id-card'), '_blank');
  };

  const handleDownloadData = () => {
    window.open(getDownloadUrl('/student-portal/download-data'), '_blank');
  };

  const handleConsentResponse = async (requestId: number, decision: 'APPROVE' | 'DENY') => {
    try {
      const form = new FormData();
      form.append('decision', decision);
      form.append('validity_days', '30');
      const res = await api.post(`/student-portal/consent/${requestId}/respond`, form);
      toast.success(res.data.message || `Request ${decision.toLowerCase()}d`);
      loadStudentData();
    } catch (err: any) {
      toast.error('Failed to update consent');
    }
  };

  const handleRevokeConsent = async (consentId: number) => {
    try {
      const res = await api.post(`/student-portal/consent/active/${consentId}/revoke`);
      toast.success(res.data.message || 'Access revoked immediately');
      loadStudentData();
    } catch (err: any) {
      toast.error('Failed to revoke access');
    }
  };

  const handleReportError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject.trim() || !reportDesc.trim()) {
      toast.error('Please enter subject and description');
      return;
    }
    try {
      setReportSubmitting(true);
      const form = new FormData();
      form.append('subject', reportSubject);
      form.append('description', reportDesc);
      const res = await api.post('/student-portal/report-error', form);
      toast.success(res.data.message || 'Grievance ticket created');
      setIsReportModalOpen(false);
      setReportSubject('');
      setReportDesc('');
    } catch (err: any) {
      toast.error('Failed to submit grievance');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDeleteSubmitting(true);
      const form = new FormData();
      form.append('reason', deleteReason);
      const res = await api.post('/student-portal/request-deletion', form);
      toast.success(res.data.message || 'Erasure request logged');
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      toast.error('Failed to lodge erasure request');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <div className="h-44 bg-[#181818] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-[#181818] rounded-2xl animate-pulse" />
          <div className="h-64 md:col-span-2 bg-[#181818] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Identity Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-[#1c3323] via-[#181818] to-[#121212] p-6 md:p-8 rounded-3xl border border-[#1DB954]/20 overflow-hidden shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#1DB954]">
                AICTE National Student Registry
              </span>
              <span className="text-[11px] bg-[#1DB954]/20 text-[#1DB954] px-2.5 py-0.5 rounded-full font-bold">
                ● Live DPDP Act Protected
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#B3B3B3]">
              <span className="font-mono bg-black/40 text-white px-2.5 py-1 rounded-md border border-white/10">
                APAAR ID: {profile.apaar_id}
              </span>
              <span>•</span>
              <span className="text-white font-medium">{profile.course} - {profile.branch}</span>
              <span>•</span>
              <span>{profile.college}</span>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-[#181818]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#B3B3B3]">AICTE Trust Score</div>
              <div className="text-2xl font-black text-[#1DB954]">{profile.trust_score}%</div>
            </div>

            <button
              onClick={handleDownloadIdCard}
              className="px-5 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
            >
              <QrCode className="w-4 h-4" />
              Download Digital ID Card
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Academic Overview
        </button>

        <button
          onClick={() => setActiveTab('consent')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === 'consent'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Consent Center ({consentData?.pending_requests.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('transcripts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === 'transcripts'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Official Transcripts
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === 'privacy'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          Privacy & Data Rights
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Demographic Card */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Personal Profile</span>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="text-[11px] text-[#1DB954] hover:underline"
              >
                Report Error
              </button>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Date of Birth</span>
                <span className="text-white">{profile.dob}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Gender</span>
                <span className="text-white">{profile.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Father's Name</span>
                <span className="text-white">{profile.father_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Mother's Name</span>
                <span className="text-white">{profile.mother_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Aadhaar Masked</span>
                <span className="font-mono text-white">XXXX-XXXX-{profile.aadhaar_last4}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Phone Masked</span>
                <span className="font-mono text-white">{profile.phone_masked}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#B3B3B3]">Email</span>
                <span className="text-white truncate max-w-[180px]">{profile.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#B3B3B3]">Enrollment No</span>
                <span className="font-mono text-white">{profile.enrollment_no}</span>
              </div>
            </div>
          </div>

          {/* Verification Timeline */}
          <div className="lg:col-span-2 bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1DB954]" />
              Official Verification Audit Trail
            </h3>

            <div className="space-y-4 pt-2">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">{step.step}</div>
                      <span className="text-[11px] text-[#B3B3B3]">{step.date}</span>
                    </div>
                    <p className="text-xs text-[#B3B3B3]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Consent Center */}
      {activeTab === 'consent' && consentData && (
        <div className="space-y-6">
          {/* Pending Verifier Requests */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Verifier Access Authorizations ({consentData.pending_requests.length})
            </h3>
            <p className="text-xs text-[#B3B3B3]">
              Third-party employers, banks, or universities requesting consent to inspect your verified semester transcripts.
            </p>

            {consentData.pending_requests.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#B3B3B3]">
                No pending verification requests awaiting authorization.
              </div>
            ) : (
              <div className="space-y-3">
                {consentData.pending_requests.map((r) => (
                  <div key={r.id} className="bg-[#242424] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white">{r.organization_name}</div>
                      <div className="text-xs text-[#B3B3B3]">
                        <strong>Purpose:</strong> {r.purpose}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.requested_fields.map((f, i) => (
                          <span key={i} className="text-[10px] bg-black/40 text-white/80 px-2 py-0.5 rounded border border-white/5">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleConsentResponse(r.id, 'APPROVE')}
                        className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105"
                      >
                        Authorize Access (30 Days)
                      </button>
                      <button
                        onClick={() => handleConsentResponse(r.id, 'DENY')}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-full"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Grants */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1DB954]" />
              Currently Active Consent Grants
            </h3>

            {consentData.active_consents.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#B3B3B3]">
                No active verifier authorizations currently granted.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {consentData.active_consents.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-white">{c.organization_name}</div>
                      <div className="text-[11px] text-[#B3B3B3]">Expires: {c.expires_at}</div>
                    </div>
                    <button
                      onClick={() => handleRevokeConsent(c.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20"
                    >
                      Revoke Immediately
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Transcripts */}
      {activeTab === 'transcripts' && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Cumulative Academic Ledger</h3>
            <span className="text-xs font-bold text-[#1DB954] bg-[#1DB954]/20 px-3 py-1 rounded-full">
              Overall CGPA: {profile.cgpa} / 10.0
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1f1f1f] text-[#B3B3B3] border-b border-white/5">
                <tr>
                  <th className="p-3">Semester</th>
                  <th className="p-3">SGPA</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">Credits Earned</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {academicRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-3 font-bold text-white">Semester {r.semester}</td>
                    <td className="p-3 text-white font-mono">{r.sgpa}</td>
                    <td className="p-3 text-[#1DB954] font-mono font-bold">{r.cgpa}</td>
                    <td className="p-3 text-[#B3B3B3]">{r.credits_earned}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded-full font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Data Rights */}
      {activeTab === 'privacy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#1DB954]" />
              DPDP Act Right to Data Portability
            </h3>
            <p className="text-xs text-[#B3B3B3]">
              Under Section 12 of the Digital Personal Data Protection Act 2023, you are entitled to export your complete academic identity and transcript ledger in machine-readable JSON format.
            </p>
            <button
              onClick={handleDownloadData}
              className="px-5 py-2.5 bg-[#282828] hover:bg-[#333] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#1DB954]" />
              Export Personal Data Package (.json)
            </button>
          </div>

          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5 text-red-400" />
              DPDP Act Right to Erasure
            </h3>
            <p className="text-xs text-[#B3B3B3]">
              Submit a formal data erasure petition. Under AICTE regulatory statutes, historical degree transcripts are archived into cold storage, while third-party marketing and employer verification consents are permanently terminated.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-full transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Submit Erasure Request
            </button>
          </div>
        </div>
      )}

      {/* Report Error Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white">Report Data Discrepancy</h3>
              <p className="text-xs text-[#B3B3B3]">
                Lodge a formal correction ticket to your institution's AICTE Nodal Officer.
              </p>

              <form onSubmit={handleReportError} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#B3B3B3] block mb-1">Subject</label>
                  <input
                    type="text"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    placeholder="e.g. Spelling error in Mother's Name"
                    className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1DB954]"
                  />
                </div>
                <div>
                  <label className="text-[#B3B3B3] block mb-1">Details & Supporting Proof</label>
                  <textarea
                    rows={4}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    placeholder="Describe the discrepancy and reference your official government ID proof..."
                    className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#1DB954]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 bg-[#282828] text-white text-xs rounded-full hover:bg-[#333]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="px-5 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full shadow-lg shadow-[#1DB954]/20"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Grievance'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Erasure Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-red-400">Section 12 DPDP Act Erasure Request</h3>
              <p className="text-xs text-[#B3B3B3]">
                Specify the justification for deregistration. Your request will be reviewed by the central AICTE compliance nodal office within 72 hours.
              </p>

              <form onSubmit={handleDeleteRequest} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#B3B3B3] block mb-1">Justification</label>
                  <textarea
                    rows={3}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-red-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-[#282828] text-white text-xs rounded-full hover:bg-[#333]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteSubmitting}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-full shadow-lg shadow-red-500/20"
                  >
                    {deleteSubmitting ? 'Logging...' : 'Confirm Erasure Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
