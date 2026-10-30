import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, MessageSquare, ShieldAlert,
  Send, User, ArrowRight, Filter
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { Flag } from '../types';
import { useNowViewingStore } from '../store/useNowViewingStore';

export const Flags: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setViewingStudent } = useNowViewingStore();

  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Active flag details drawer
  const [activeFlag, setActiveFlag] = useState<Flag | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/flags', {
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        search: searchTerm || undefined,
        limit: 50
      });
      const list = Array.isArray(res) ? res : (res.flags || res.items || []);
      setFlags(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [statusFilter, severityFilter]);

  const handleSelectFlag = async (f: Flag) => {
    try {
      const detail = await ApiClient.get(`/flags/${f.id}`);
      setActiveFlag(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeFlag) return;
    try {
      await ApiClient.put(`/flags/${activeFlag.id}/status?new_status=${newStatus}`);
      const updated = await ApiClient.get(`/flags/${activeFlag.id}`);
      setActiveFlag(updated);
      fetchFlags();
    } catch (err: any) {
      alert(`Failed to update flag status: ${err.message}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFlag || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await ApiClient.post(`/flags/${activeFlag.id}/comments`, { comment: newComment.trim() });
      setNewComment('');
      const updated = await ApiClient.get(`/flags/${activeFlag.id}`);
      setActiveFlag(updated);
    } catch (err: any) {
      alert(`Failed to add comment: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <span>Discrepancy & Flag Management</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Resolve automated anomalies, name/DOB mismatches, checksum faults, and SLA deadlines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#242424] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#242424] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 outline-none"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags List (2 cols) */}
        <div className="lg:col-span-2 bg-[#181818] rounded-2xl border border-[#282828] overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-[#B3B3B3] text-sm animate-pulse">
              Loading active flags...
            </div>
          ) : (
            <div className="divide-y divide-[#242424]">
              {flags.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFlag(f)}
                  className={`p-4 hover:bg-[#202020] cursor-pointer transition flex items-start justify-between gap-4 ${
                    activeFlag?.id === f.id ? 'bg-[#222] border-l-4 border-amber-400' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        f.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        f.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {f.student_name}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        ({f.student_apaar})
                      </span>
                    </div>

                    <p className="text-xs text-[#B3B3B3] line-clamp-1">
                      {f.description}
                    </p>

                    <div className="text-[11px] text-zinc-500 flex items-center gap-3 pt-1">
                      <span>{f.college_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Clock className="w-3 h-3" />
                        SLA: 48h Remaining
                      </span>
                      <span>•</span>
                      <span>{f.comments_count || 0} Comments</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    f.status === 'RESOLVED' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                    f.status === 'ESCALATED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flag Details & Resolution Feed (1 col) */}
        <div className="bg-[#181818] rounded-2xl border border-[#282828] p-5 flex flex-col justify-between min-h-[500px]">
          {activeFlag ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    FLAG #{activeFlag.id} • {activeFlag.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{activeFlag.status}</span>
                </div>
                <h3 className="font-bold text-white text-base">
                  {activeFlag.student_name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  APAAR: {activeFlag.student_apaar}
                </p>
              </div>

              <div className="p-3 bg-[#242424] rounded-xl text-xs space-y-1">
                <span className="text-zinc-400 font-bold block">Discrepancy Details:</span>
                <p className="text-zinc-200">{activeFlag.description}</p>
              </div>

              {/* Status transition buttons */}
              <div className="flex items-center gap-2 pt-1">
                {activeFlag.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="spotify-pill-btn text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve Flag</span>
                  </button>
                )}
                {activeFlag.status !== 'ESCALATED' && activeFlag.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus('ESCALATED')}
                    className="spotify-pill-secondary text-xs py-1.5 px-3 text-rose-400 border-rose-800"
                  >
                    Escalate to HQ
                  </button>
                )}
                {activeFlag.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus('REOPENED')}
                    className="spotify-pill-secondary text-xs py-1.5 px-3"
                  >
                    Reopen Flag
                  </button>
                )}
              </div>

              {/* Comments Feed */}
              <div className="pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-300 uppercase mb-2">Officer Comments & Audit Notes</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeFlag.comments?.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-[#242424] text-xs">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{c.user_name}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Recorded</span>
                      </div>
                      <p className="text-[#B3B3B3] text-[11px] mt-1">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add resolution note..."
                  className="flex-1 bg-[#242424] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="w-8 h-8 rounded-xl bg-[#1DB954] text-black hover:bg-[#1ed760] disabled:opacity-40 flex items-center justify-center shrink-0 font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 text-xs py-12">
              <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
              <span>Select any flag from the list to view SLA timers, comments, and resolution workflow</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
