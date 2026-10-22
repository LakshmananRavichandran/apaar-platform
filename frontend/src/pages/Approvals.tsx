import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  ArrowRightLeft,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Building,
  GraduationCap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface TransferItem {
  id: number;
  student_id: number;
  student_name: string;
  student_apaar: string;
  from_college: string;
  to_college: string;
  reason: string;
  from_approved: boolean;
  to_approved: boolean;
  aicte_approved: boolean;
  status: string;
  created_at: string;
}

interface EditRequestItem {
  id: number;
  student_id: number;
  student_name: string;
  student_apaar: string;
  college_id: number;
  proposed_changes: Record<string, any>;
  status: string;
  review_notes?: string;
  created_at: string;
}

export const Approvals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transfers' | 'edits'>('transfers');
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [edits, setEdits] = useState<EditRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/approvals/transfers');
      setTransfers(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load transfer queue');
    }
  };

  const fetchEdits = async () => {
    try {
      const res = await api.get('/approvals/edit-requests');
      setEdits(res.data || []);
    } catch (err: any) {
      toast.error('Failed to load edit requests queue');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchTransfers(), fetchEdits()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveTransfer = async (id: number) => {
    try {
      setActionLoading(id);
      const res = await api.post(`/approvals/transfers/${id}/approve`);
      toast.success(res.data.message || 'Transfer approval recorded');
      fetchTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to approve transfer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecideEdit = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(id);
      const res = await api.post(`/approvals/edit-requests/${id}/decide?decision=${decision}&notes=Reviewed+by+Nodal+Authority`);
      toast.success(res.data.message || `Edit request ${decision.toLowerCase()}`);
      fetchEdits();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-[#1DB954]" />
            <h1 className="text-3xl font-black text-white tracking-tight">Institutional Approvals Queue</h1>
          </div>
          <p className="text-sm text-[#B3B3B3] mt-1">
            Tripartite inter-college transfer authorizations and college staff demographic correction reviews
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-[#282828] hover:bg-[#333] text-white rounded-full transition-colors self-start md:self-auto"
          title="Refresh Queues"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'transfers'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          College Transfers ({transfers.filter((t) => t.status === 'PENDING').length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('edits')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'edits'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Demographic Edit Requests ({edits.filter((e) => e.status === 'PENDING').length} Pending)
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#181818] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'transfers' ? (
        // Transfers List
        transfers.length === 0 ? (
          <div className="bg-[#181818] rounded-2xl p-12 text-center border border-white/5">
            <CheckCircle2 className="w-12 h-12 text-[#1DB954] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Transfer Queue Empty</h3>
            <p className="text-sm text-[#B3B3B3] mt-1">There are no pending student college migration requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#1DB954]" />
                        {req.student_name}
                      </span>
                      <span className="text-xs font-mono text-[#B3B3B3] bg-[#282828] px-2.5 py-0.5 rounded">
                        APAAR: {req.student_apaar}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          req.status === 'APPROVED'
                            ? 'bg-[#1DB954]/20 text-[#1DB954]'
                            : req.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Migration Route */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs bg-[#242424] p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-white">
                        <Building className="w-4 h-4 text-[#B3B3B3]" />
                        <span>Origin: <strong className="text-white">{req.from_college}</strong></span>
                      </div>
                      <span className="text-[#1DB954] font-bold">➔</span>
                      <div className="flex items-center gap-2 text-white">
                        <Building className="w-4 h-4 text-[#1DB954]" />
                        <span>Destination: <strong className="text-[#1DB954]">{req.to_college}</strong></span>
                      </div>
                    </div>

                    {/* Tripartite Approval Progress */}
                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="text-[#B3B3B3]">Status Matrix:</span>
                      <div className="flex items-center gap-1.5">
                        {req.from_approved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954]" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className={req.from_approved ? 'text-[#1DB954]' : 'text-amber-400'}>
                          Relieving College
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {req.to_approved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954]" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className={req.to_approved ? 'text-[#1DB954]' : 'text-amber-400'}>
                          Admitting College
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {req.aicte_approved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1DB954]" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className={req.aicte_approved ? 'text-[#1DB954]' : 'text-amber-400'}>
                          AICTE Directorate
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#B3B3B3]">
                      <strong>Transfer Justification:</strong> {req.reason}
                    </div>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="shrink-0">
                      <button
                        disabled={actionLoading === req.id}
                        onClick={() => handleApproveTransfer(req.id)}
                        className="px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Authorize Migration
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        // Edit Requests List
        edits.length === 0 ? (
          <div className="bg-[#181818] rounded-2xl p-12 text-center border border-white/5">
            <CheckCircle2 className="w-12 h-12 text-[#1DB954] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Pending Edit Requests</h3>
            <p className="text-sm text-[#B3B3B3] mt-1">Institutional staff have not submitted any corrections requiring approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {edits.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{item.student_name}</span>
                      <span className="text-xs font-mono text-[#B3B3B3] bg-[#282828] px-2.5 py-0.5 rounded">
                        APAAR: {item.student_apaar}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-[#1DB954]/20 text-[#1DB954]'
                            : item.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Proposed changes matrix */}
                    <div className="bg-[#242424] p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                      <div className="text-[11px] uppercase tracking-wider text-[#1DB954] font-bold">
                        Proposed Field Updates:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {Object.entries(item.proposed_changes).map(([field, val]) => (
                          <div key={field} className="bg-[#1c1c1c] p-2 rounded-lg border border-white/5">
                            <span className="text-[#B3B3B3] capitalize">{field.replace('_', ' ')}:</span>{' '}
                            <strong className="text-white">{String(val)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.review_notes && (
                      <div className="text-xs text-[#B3B3B3]">
                        <strong>Review Note:</strong> {item.review_notes}
                      </div>
                    )}
                  </div>

                  {item.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleDecideEdit(item.id, 'APPROVED')}
                        className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-1.5 shadow-lg shadow-[#1DB954]/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Apply
                      </button>
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleDecideEdit(item.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs rounded-full transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
