import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  Hash,
  Clock,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AuditItem {
  id: number;
  user_id: number;
  user_email: string;
  role: string;
  action: string;
  resource: string;
  resource_id: string;
  ip_address: string;
  old_value?: string;
  new_value?: string;
  previous_hash: string;
  hash: string;
  timestamp: string;
}

interface IntegrityResult {
  chain_valid: boolean;
  total_events_checked: number;
  genesis_hash?: string;
  head_hash?: string;
  tamper_detected_at_id?: number | null;
  message: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState<string>('');

  // Integrity Check State
  const [integrityLoading, setIntegrityLoading] = useState<boolean>(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 25 };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;
      if (emailFilter) params.user_email = emailFilter;

      const res = await api.get('/audit', { params });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err: any) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  const handleVerifyIntegrity = async () => {
    try {
      setIntegrityLoading(true);
      const res = await api.get('/audit/verify-integrity');
      setIntegrityResult(res.data);
      if (res.data.chain_valid) {
        toast.success(`Cryptographic integrity verified across ${res.data.total_events_checked} immutable events!`);
      } else {
        toast.error('Cryptographic hash chain violation detected!');
      }
    } catch (err: any) {
      toast.error('Failed to execute cryptographic verification');
    } finally {
      setIntegrityLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open('http://localhost:8000/api/v1/audit/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#1DB954]" />
            <h1 className="text-3xl font-black text-white tracking-tight">Tamper-Evident Audit Ledger</h1>
          </div>
          <p className="text-sm text-[#B3B3B3] mt-1">
            Cryptographically sealed SHA-256 hash chain recording every credential modification, verification check, and administrative action
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            disabled={integrityLoading}
            onClick={handleVerifyIntegrity}
            className="px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
          >
            <Hash className={`w-4 h-4 ${integrityLoading ? 'animate-spin' : ''}`} />
            {integrityLoading ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-[#1DB954]" />
            Export Audit Trail (.csv)
          </button>
        </div>
      </div>

      {/* Cryptographic Integrity Result Card */}
      <AnimatePresence>
        {integrityResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-2xl border ${
              integrityResult.chain_valid
                ? 'bg-[#1DB954]/10 border-[#1DB954]/30 text-[#1DB954]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {integrityResult.chain_valid ? (
                  <CheckCircle2 className="w-6 h-6 text-[#1DB954] shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {integrityResult.chain_valid
                      ? 'Cryptographic Hash Chain Valid & Intact'
                      : 'Cryptographic Integrity Failure Detected!'}
                  </h4>
                  <p className="text-xs text-[#B3B3B3]">{integrityResult.message}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono pt-1 text-white/80">
                    <span>Events Verified: <strong>{integrityResult.total_events_checked}</strong></span>
                    <span>•</span>
                    <span className="truncate max-w-[280px]">Head Hash: {integrityResult.head_hash}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIntegrityResult(null)}
                className="text-xs text-[#B3B3B3] hover:text-white px-2 py-1 rounded bg-black/40"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Toolbar */}
      <div className="bg-[#181818] p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Filter by operator email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="bg-[#282828] text-white px-3.5 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[#1DB954] w-56"
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#282828] text-white px-3 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[#1DB954]"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SYSTEM_SEED">SYSTEM_SEED</option>
            <option value="BULK_STUDENT_UPLOAD">BULK_STUDENT_UPLOAD</option>
            <option value="MANUAL_VERIFY">MANUAL_VERIFY</option>
            <option value="MERGE_DUPLICATES">MERGE_DUPLICATES</option>
            <option value="RESOLVE_FLAG">RESOLVE_FLAG</option>
            <option value="APPROVE_TRANSFER">APPROVE_TRANSFER</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-[#282828] text-white px-3 py-2 rounded-full border border-white/10 focus:outline-none focus:border-[#1DB954]"
          >
            <option value="">All Resources</option>
            <option value="STUDENT">STUDENT</option>
            <option value="COLLEGE">COLLEGE</option>
            <option value="FLAG">FLAG</option>
            <option value="DUPLICATE_GROUP">DUPLICATE_GROUP</option>
            <option value="AUTH">AUTH</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 bg-[#282828] hover:bg-[#333] text-white rounded-full transition-colors"
            title="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs text-[#B3B3B3]">
          Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> immutable entries
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#B3B3B3] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1DB954]" />
            Reading cryptographically chained audit pages...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#B3B3B3] text-xs">
            No audit records match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1f1f1f] text-[#B3B3B3] border-b border-white/5">
                <tr>
                  <th className="p-3">Seq #</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource & ID</th>
                  <th className="p-3">Event Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono text-white/50">{log.id}</td>
                    <td className="p-3 text-[#B3B3B3] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-white font-medium">{log.user_email}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-[#282828] text-white px-2 py-0.5 rounded font-mono">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#1DB954]">{log.action}</span>
                    </td>
                    <td className="p-3 text-white">
                      <span className="text-[#B3B3B3]">{log.resource}:</span>{' '}
                      <span className="font-mono">{log.resource_id}</span>
                      {log.new_value && (
                        <div className="text-[10px] text-[#B3B3B3] truncate max-w-[220px]" title={log.new_value}>
                          {log.new_value}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-white/70 bg-black/40 px-2 py-1 rounded border border-white/5 truncate max-w-[190px]" title={log.hash}>
                        {log.hash.slice(0, 12)}...{log.hash.slice(-8)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-[#1f1f1f] border-t border-white/5 flex items-center justify-between text-xs text-[#B3B3B3]">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-[#282828] hover:bg-[#333] disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-[#282828] hover:bg-[#333] disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
