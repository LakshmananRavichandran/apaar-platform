import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface StudentSummary {
  id: number;
  name: string;
  apaar_id: string;
  college: string;
  admission_year?: number;
}

interface DuplicateGroup {
  id: number;
  group_identifier: string;
  status: string;
  confidence_score: number;
  reasons: string[];
  primary_student: StudentSummary | null;
  secondary_student: StudentSummary | null;
  created_at: string;
}

interface DuplicateComparison {
  id: number;
  group_identifier: string;
  confidence_score: number;
  status: string;
  reasons: string[];
  primary: any;
  secondary: any;
}

export const Duplicates: React.FC = () => {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<DuplicateComparison | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/duplicates', { params });
      setGroups(res.data.groups || []);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load duplicate groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [statusFilter]);

  const openComparison = async (id: number) => {
    try {
      setComparing(true);
      const res = await api.get(`/duplicates/${id}`);
      setSelectedGroup(res.data);
    } catch (err: any) {
      toast.error('Failed to load comparison data');
    } finally {
      setComparing(false);
    }
  };

  const handleMerge = async (groupId: number, retainStudentId: number, retainName: string) => {
    if (!confirm(`Are you sure you want to merge these records and retain "${retainName}" as the canonical student? The duplicate record will be archived.`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post(`/duplicates/${groupId}/merge?retain_student_id=${retainStudentId}`);
      toast.success(res.data.message || 'Records successfully merged!');
      setSelectedGroup(null);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to merge records');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSeparate = async (groupId: number) => {
    if (!confirm('Mark these records as distinct individuals? This will close the duplicate alert without modifying student accounts.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post(`/duplicates/${groupId}/resolve-separate`);
      toast.success(res.data.message || 'Group resolved as distinct individuals');
      setSelectedGroup(null);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resolve duplicate alert');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Copy className="w-7 h-7 text-[#1DB954]" />
            <h1 className="text-3xl font-black text-white tracking-tight">Duplicate Detection & Resolution</h1>
          </div>
          <p className="text-sm text-[#B3B3B3] mt-1">
            AI-driven identification of multi-institution enrollments, near-identical identities, and APAAR collisions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#282828] text-white text-sm px-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[#1DB954]"
          >
            <option value="">All Statuses</option>
            <option value="DETECTED">Detected (Action Required)</option>
            <option value="RESOLVED_MERGED">Resolved - Merged</option>
            <option value="RESOLVED_SEPARATE">Resolved - Distinct</option>
          </select>

          <button
            onClick={fetchGroups}
            className="p-2 bg-[#282828] hover:bg-[#333] text-white rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#1DB954] shrink-0 mt-0.5" />
        <div className="text-xs text-[#B3B3B3] leading-relaxed">
          <strong className="text-white">Section 6 AICTE Mandate: </strong>
          Students cannot simultaneously hold active enrollment in multiple degree-granting AICTE institutions under the same or variant APAAR IDs. The system computes cross-institutional Levenshtein phonetic similarities and exact Aadhaar/DOB intersections to identify potential collisions.
        </div>
      </div>

      {/* Duplicate Groups List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#181818] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-[#181818] rounded-2xl p-12 text-center border border-white/5">
          <CheckCircle2 className="w-12 h-12 text-[#1DB954] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Duplicate Anomalies</h3>
          <p className="text-sm text-[#B3B3B3] mt-1">
            {statusFilter ? `No groups match the filter "${statusFilter}"` : 'All student records are verified unique across registered colleges.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isResolved = group.status.startsWith('RESOLVED');
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved
                    ? 'bg-[#181818]/60 border-white/5'
                    : 'bg-[#181818] border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#282828] text-white">
                        {group.group_identifier}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          group.status === 'DETECTED'
                            ? 'bg-amber-500/20 text-amber-400'
                            : group.status === 'RESOLVED_MERGED'
                            ? 'bg-[#1DB954]/20 text-[#1DB954]'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {group.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#B3B3B3]">
                        Confidence: <strong className="text-white">{group.confidence_score}%</strong>
                      </span>
                    </div>

                    {/* Comparison Pill Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="bg-[#242424] p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-[#B3B3B3]">Primary Profile</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {group.primary_student?.name || 'Student #1'}
                        </div>
                        <div className="text-xs text-[#B3B3B3] font-mono mt-0.5">
                          APAAR: {group.primary_student?.apaar_id || 'N/A'}
                        </div>
                        <div className="text-xs text-white/70 mt-1 truncate">
                          {group.primary_student?.college || 'Institution'}
                        </div>
                      </div>

                      <div className="bg-[#242424] p-3 rounded-xl border border-white/5">
                        <div className="text-xs text-[#B3B3B3]">Duplicate Contender</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {group.secondary_student?.name || 'Student #2'}
                        </div>
                        <div className="text-xs text-[#B3B3B3] font-mono mt-0.5">
                          APAAR: {group.secondary_student?.apaar_id || 'N/A'}
                        </div>
                        <div className="text-xs text-white/70 mt-1 truncate">
                          {group.secondary_student?.college || 'Institution'}
                        </div>
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {group.reasons.map((r, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => openComparison(group.id)}
                      className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-1.5 shadow-lg shadow-[#1DB954]/20"
                    >
                      Compare Side-by-Side
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {!isResolved && (
                      <button
                        onClick={() => handleResolveSeparate(group.id)}
                        className="px-3 py-1.5 bg-[#282828] hover:bg-[#333] text-white/80 hover:text-white text-xs rounded-full transition-colors"
                      >
                        Mark as Distinct
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1f1f1f]">
                <div>
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5 text-[#1DB954]" />
                    <h2 className="text-xl font-bold text-white">
                      Side-by-Side Identity Comparison
                    </h2>
                    <span className="text-xs bg-[#282828] text-white px-2 py-0.5 rounded font-mono">
                      {selectedGroup.group_identifier}
                    </span>
                  </div>
                  <p className="text-xs text-[#B3B3B3] mt-0.5">
                    Match Confidence: <strong className="text-[#1DB954]">{selectedGroup.confidence_score}%</strong> • Inspect divergent demographic & institutional fields before choosing the canonical profile.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-[#B3B3B3] hover:text-white text-sm px-3 py-1 rounded-full bg-[#282828]"
                >
                  ✕ Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Reasons Alert */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs text-amber-200">
                    <strong>Algorithmic Trigger: </strong>
                    {selectedGroup.reasons.join(' • ')}
                  </div>
                </div>

                {/* Two Profile Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Profile */}
                  <div className="bg-[#242424] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#1DB954] font-bold">Profile A (Primary)</div>
                        <div className="text-lg font-bold text-white">{selectedGroup.primary?.name}</div>
                      </div>
                      <span className="text-xs bg-[#1DB954]/20 text-[#1DB954] px-2.5 py-1 rounded-full font-semibold">
                        Trust: {selectedGroup.primary?.trust_score}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">APAAR ID</span>
                        <span className="font-mono font-bold text-white">{selectedGroup.primary?.apaar_id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Date of Birth</span>
                        <span className="text-white">{selectedGroup.primary?.dob}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Gender</span>
                        <span className="text-white">{selectedGroup.primary?.gender}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Father's Name</span>
                        <span className="text-white">{selectedGroup.primary?.father_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Aadhaar Masked</span>
                        <span className="font-mono text-white">XXXX-XXXX-{selectedGroup.primary?.aadhaar_last4}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">College</span>
                        <span className="text-white font-semibold text-right max-w-[200px] truncate">{selectedGroup.primary?.college}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Branch / Course</span>
                        <span className="text-white text-right">{selectedGroup.primary?.branch}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Admission Year</span>
                        <span className="text-white">{selectedGroup.primary?.admission_year}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">CGPA</span>
                        <span className="text-white font-bold">{selectedGroup.primary?.cgpa}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#B3B3B3]">Status</span>
                        <span className="text-white font-semibold">{selectedGroup.primary?.verification_status}</span>
                      </div>
                    </div>

                    {selectedGroup.status === 'DETECTED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleMerge(selectedGroup.id, selectedGroup.primary.id, selectedGroup.primary.name)}
                        className="w-full py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-102 flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20"
                      >
                        <UserCheck className="w-4 h-4" />
                        Retain Profile A as Canonical Record
                      </button>
                    )}
                  </div>

                  {/* Secondary Profile */}
                  <div className="bg-[#242424] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-blue-400 font-bold">Profile B (Duplicate)</div>
                        <div className="text-lg font-bold text-white">{selectedGroup.secondary?.name}</div>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                        Trust: {selectedGroup.secondary?.trust_score}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">APAAR ID</span>
                        <span className="font-mono font-bold text-white">{selectedGroup.secondary?.apaar_id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Date of Birth</span>
                        <span className="text-white">{selectedGroup.secondary?.dob}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Gender</span>
                        <span className="text-white">{selectedGroup.secondary?.gender}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Father's Name</span>
                        <span className="text-white">{selectedGroup.secondary?.father_name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Aadhaar Masked</span>
                        <span className="font-mono text-white">XXXX-XXXX-{selectedGroup.secondary?.aadhaar_last4}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">College</span>
                        <span className="text-white font-semibold text-right max-w-[200px] truncate">{selectedGroup.secondary?.college}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Branch / Course</span>
                        <span className="text-white text-right">{selectedGroup.secondary?.branch}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Admission Year</span>
                        <span className="text-white">{selectedGroup.secondary?.admission_year}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">CGPA</span>
                        <span className="text-white font-bold">{selectedGroup.secondary?.cgpa}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#B3B3B3]">Status</span>
                        <span className="text-white font-semibold">{selectedGroup.secondary?.verification_status}</span>
                      </div>
                    </div>

                    {selectedGroup.status === 'DETECTED' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleMerge(selectedGroup.id, selectedGroup.secondary.id, selectedGroup.secondary.name)}
                        className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-full transition-transform hover:scale-102 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        <UserCheck className="w-4 h-4" />
                        Retain Profile B as Canonical Record
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-[#1f1f1f] flex items-center justify-between">
                <span className="text-xs text-[#B3B3B3]">
                  Merging archives the non-canonical record, logs an audit entry, and retains historical transcripts.
                </span>
                {selectedGroup.status === 'DETECTED' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleResolveSeparate(selectedGroup.id)}
                    className="px-4 py-2 bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold rounded-full"
                  >
                    Resolve as Distinct Persons
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
