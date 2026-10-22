import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Download, ArrowLeft, RefreshCw,
  FileText, Upload, CheckCircle2, XCircle, Clock, Send, Eye,
  Building2, Calendar, Phone, Mail, MapPin, Hash
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { Student, AcademicRecord, DocumentItem, VerificationDifference } from '../types';
import { useNowViewingStore } from '../store/useNowViewingStore';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setViewingStudent } = useNowViewingStore();

  const [student, setStudent] = useState<Student | null>(null);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // DigiLocker Diff Modal & States
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [differences, setDifferences] = useState<VerificationDifference[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  // Document Upload State
  const [uploadDocType, setUploadDocType] = useState('marksheet');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Transfer & Edit Request modals
  const [transferOpen, setTransferOpen] = useState(false);
  const [targetCollegeId, setTargetCollegeId] = useState(2);
  const [transferReason, setTransferReason] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editCgpa, setEditCgpa] = useState('');
  const [editSemester, setEditSemester] = useState('');

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get(`/students/${id}`);
      setStudent(res);
      setAcademicRecords(res.academic_records || []);
      setDocuments(res.documents || []);
      setViewingStudent(res);
      setEditCgpa(String(res.cgpa));
      setEditSemester(String(res.current_semester));
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const handleManualVerify = async () => {
    if (!student) return;
    try {
      const res = await ApiClient.post(`/verification/verify-student/${student.id}`);
      alert(`Manual verification complete! Trust Score: ${res.trust_score}%. Status: ${res.status}`);
      fetchStudentData();
    } catch (e: any) {
      alert(`Verification failed: ${e.message}`);
    }
  };

  const handleOpenDigiLockerSync = async () => {
    setDiffOpen(true);
    setDiffLoading(true);
    try {
      const res = await ApiClient.get(`/verification/digilocker-sync/${student?.id}`);
      if (res.success) {
        setDifferences(res.differences || []);
        const initResolutions: Record<string, string> = {};
        (res.differences || []).forEach((d: any) => {
          initResolutions[d.field] = d.matches ? 'MATCHED' : 'ACCEPT_OFFICIAL';
        });
        setResolutions(initResolutions);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`DigiLocker sync error: ${err.message}`);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleSaveResolutions = async () => {
    try {
      await ApiClient.post(`/verification/digilocker-sync/${student?.id}/resolve`, resolutions);
      alert('Official DigiLocker values applied and Trust Score updated!');
      setDiffOpen(false);
      fetchStudentData();
    } catch (e: any) {
      alert(`Error updating record: ${e.message}`);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !student) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('doc_type', uploadDocType);
      formData.append('file', uploadFile);
      await ApiClient.post(`/students/${student.id}/documents`, formData);
      setUploadFile(null);
      fetchStudentData();
      alert('Document uploaded successfully.');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      const formData = new FormData();
      formData.append('to_college_id', String(targetCollegeId));
      formData.append('reason', transferReason);
      await ApiClient.post(`/students/${student.id}/transfer`, formData);
      setTransferOpen(false);
      alert('Transfer request submitted to AICTE and destination institution.');
    } catch (err: any) {
      alert(`Transfer request failed: ${err.message}`);
    }
  };

  const handleSubmitEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    try {
      const formData = new FormData();
      const changes = {
        cgpa: parseFloat(editCgpa),
        current_semester: parseInt(editSemester)
      };
      formData.append('proposed_changes', JSON.stringify(changes));
      await ApiClient.post(`/students/${student.id}/request-edit`, formData);
      setEditOpen(false);
      alert('Edit request submitted for administrative approval.');
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    }
  };

  if (loading || !student) {
    return (
      <div className="text-center py-12 text-[#B3B3B3] text-sm animate-pulse">
        Loading authenticated student identity credentials...
      </div>
    );
  }

  const anomalyList: string[] = student.anomaly_reasons ? JSON.parse(student.anomaly_reasons) : [];

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-1.5 text-xs font-bold text-[#B3B3B3] hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Students</span>
      </button>

      {/* Main Student Header Card */}
      <div className="bg-[#181818] rounded-2xl border border-[#282828] p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-zinc-900 border border-[#333] flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-lg">
            {student.photo_url ? (
              <img src={student.photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              student.name[0]
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {student.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                student.verification_status === 'Verified' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                student.verification_status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' :
                student.verification_status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {student.verification_status}
              </span>
            </div>

            <div className="text-xs text-[#B3B3B3] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#1DB954]" />
                {student.college_name || 'AICTE Institution'}
              </span>
              <span>•</span>
              <span>{student.branch}</span>
              <span>•</span>
              <span>Enrollment: <b className="text-white font-mono">{student.enrollment_no}</b></span>
            </div>

            <div className="mt-2 text-xs font-mono text-[#1DB954] flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>APAAR ID: <b>{student.apaar_id}</b> (12-Digit Luhn Authenticated)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualVerify}
            className="spotify-pill-btn text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Now</span>
          </button>

          <button
            onClick={handleOpenDigiLockerSync}
            className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>DigiLocker Diff</span>
          </button>

          <button
            onClick={() => window.open(`http://localhost:8000/api/v1/students/${student.id}/certificate`, '_blank')}
            className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Certificate PDF</span>
          </button>

          <button
            onClick={() => window.open(`http://localhost:8000/api/v1/students/${student.id}/id-card`, '_blank')}
            className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Digital ID Card</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Warnings if Flagged */}
      {anomalyList.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 text-xs text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Discrepancy Engine Flags Detected ({anomalyList.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-zinc-300 pl-1">
            {anomalyList.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 2-Column Info: Demographic Profile & Academic Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Demographic & Privacy Masked Data */}
        <div className="bg-[#181818] rounded-2xl border border-[#282828] p-5 space-y-4">
          <h3 className="font-bold text-white text-sm pb-2 border-b border-zinc-800">
            Demographic & Identity Attributes
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Father / Mother Name</span>
              <span className="font-semibold text-white">{student.father_name} / {student.mother_name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Date of Birth & Gender</span>
              <span className="font-semibold text-white">{student.dob} ({student.gender})</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Social Category</span>
              <span className="font-semibold text-white">{student.category}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Aadhaar (DPDP Masked)</span>
              <span className="font-mono text-zinc-300">XXXX-XXXX-{student.aadhaar_last4}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Contact Phone</span>
              <span className="font-mono text-zinc-300">{student.phone_masked}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Email Address</span>
              <span className="text-zinc-300 truncate block">{student.email}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Residential Address</span>
              <span className="text-zinc-300 block">{student.address}, {student.district}, {student.state}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <button
              onClick={() => setEditOpen(true)}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-[#242424] hover:bg-[#333] text-zinc-300 transition"
            >
              Request Record Edit
            </button>
            <button
              onClick={() => setTransferOpen(true)}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-[#242424] hover:bg-[#333] text-zinc-300 transition"
            >
              Initiate College Transfer
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Academic Records & Document Vault */}
        <div className="md:col-span-2 space-y-6">
          {/* Academic Records */}
          <div className="bg-[#181818] rounded-2xl border border-[#282828] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Academic Semester Records</h3>
                <span className="text-xs text-[#B3B3B3]">
                  Cumulative GPA: <b className="text-[#1DB954] text-sm">{student.cgpa} / 10.0</b> • Semester {student.current_semester}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954]">
                Transcript Authenticated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-zinc-500 uppercase font-bold text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Semester</th>
                    <th className="py-2">SGPA</th>
                    <th className="py-2">CGPA</th>
                    <th className="py-2">Credits</th>
                    <th className="py-2">Backlogs</th>
                    <th className="py-2 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {academicRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 font-bold text-white">Semester {r.semester}</td>
                      <td className="py-2.5 text-[#1DB954] font-black">{r.sgpa}</td>
                      <td className="py-2.5 font-bold text-white">{r.cgpa}</td>
                      <td className="py-2.5 text-zinc-300">{r.credits_earned} / {r.total_credits}</td>
                      <td className="py-2.5 text-zinc-400">{r.backlogs}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1DB954]/20 text-[#1DB954]">
                          {r.result_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Vault */}
          <div className="bg-[#181818] rounded-2xl border border-[#282828] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="font-bold text-white text-sm">Verified Document Vault</h3>
              <span className="text-xs text-zinc-400">{documents.length} Files Uploaded</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-[#242424] border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-[#1DB954] shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">{doc.file_name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase">{doc.doc_type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`http://localhost:8000/api/v1/students/${student.id}/documents/${doc.id}/download`, '_blank')}
                    className="text-xs font-bold text-[#1DB954] hover:underline shrink-0 ml-2"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>

            {/* Document Upload Form */}
            <form onSubmit={handleUploadDocument} className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-3">
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="bg-[#242424] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 outline-none"
              >
                <option value="marksheet">Marksheet</option>
                <option value="id_proof">ID Proof</option>
                <option value="photo">Student Photo</option>
                <option value="transfer_cert">Transfer Certificate</option>
              </select>

              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#333] file:text-white hover:file:bg-[#444]"
              />

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="spotify-pill-btn text-xs py-1.5 px-4 disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DigiLocker Sync Diff Modal */}
      {diffOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#1DB954]" />
                <h3 className="font-bold text-white text-base">
                  DigiLocker / APAAR Official Field Comparison
                </h3>
              </div>
              <button onClick={() => setDiffOpen(false)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>

            {diffLoading ? (
              <div className="text-center py-8 text-sm text-[#B3B3B3] animate-pulse">
                Fetching official citizen registry from DigiLocker Gateway...
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#B3B3B3]">
                  Comparing college registration against verified UIDAI & DigiLocker APAAR records. Select field resolution:
                </p>

                <div className="divide-y divide-zinc-800 text-xs">
                  {differences.map((d) => (
                    <div key={d.field} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-28 font-bold text-zinc-300">{d.label}</div>
                      <div className="flex-1">
                        <div className="text-zinc-400">College: <b className="text-white">{d.college_value}</b></div>
                        <div className="text-zinc-400">Official: <b className="text-[#1DB954]">{d.official_value}</b></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.matches ? (
                          <span className="text-[11px] font-bold text-[#1DB954] flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            100% Match
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setResolutions({ ...resolutions, [d.field]: 'ACCEPT_OFFICIAL' })}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                resolutions[d.field] === 'ACCEPT_OFFICIAL' ? 'bg-[#1DB954] text-black' : 'bg-[#242424] text-zinc-400'
                              }`}
                            >
                              Accept Official
                            </button>
                            <button
                              type="button"
                              onClick={() => setResolutions({ ...resolutions, [d.field]: 'KEEP_COLLEGE' })}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                resolutions[d.field] === 'KEEP_COLLEGE' ? 'bg-amber-500 text-black' : 'bg-[#242424] text-zinc-400'
                              }`}
                            >
                              Keep College
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2">
                  <button onClick={() => setDiffOpen(false)} className="spotify-pill-secondary text-xs py-2 px-4">
                    Cancel
                  </button>
                  <button onClick={handleSaveResolutions} className="spotify-pill-btn text-xs py-2 px-5">
                    Apply Resolutions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {transferOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-white text-base mb-3">Initiate Student Transfer</h3>
            <form onSubmit={handleInitiateTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Target College ID</label>
                <input
                  type="number"
                  required
                  value={targetCollegeId}
                  onChange={(e) => setTargetCollegeId(parseInt(e.target.value))}
                  className="w-full bg-[#242424] text-white p-2.5 rounded-xl border border-zinc-700 outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Reason for Institutional Transfer</label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Relocation, AICTE mutual migration agreement..."
                  className="w-full bg-[#242424] text-white p-2.5 rounded-xl border border-zinc-700 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTransferOpen(false)} className="spotify-pill-secondary py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" className="spotify-pill-btn py-1.5 px-4">
                  Submit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-white text-base mb-3">Request Student Record Edit</h3>
            <form onSubmit={handleSubmitEditRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Proposed CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editCgpa}
                  onChange={(e) => setEditCgpa(e.target.value)}
                  className="w-full bg-[#242424] text-white p-2.5 rounded-xl border border-zinc-700 outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Proposed Current Semester</label>
                <input
                  type="number"
                  required
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="w-full bg-[#242424] text-white p-2.5 rounded-xl border border-zinc-700 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="spotify-pill-secondary py-1.5 px-3">
                  Cancel
                </button>
                <button type="submit" className="spotify-pill-btn py-1.5 px-4">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
