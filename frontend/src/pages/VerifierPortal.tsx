import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Upload,
  Key,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  FileText,
  Building2,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface SearchResult {
  found: boolean;
  message?: string;
  student_id?: number;
  apaar_id?: string;
  name?: string;
  verification_status?: string;
  trust_score?: number;
  institution?: string;
  course?: string;
  branch?: string;
  admission_year?: number;
  status?: string;
  has_extended_consent?: boolean;
  last_verified_date?: string;
  cgpa?: number;
  current_semester?: number;
  category?: string;
  consent_expires_at?: string;
}

interface ApiKeyItem {
  id: number;
  org_name: string;
  key_prefix: string;
  rate_limit_per_minute: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

interface UsageStats {
  active_keys: number;
  total_api_calls_made: number;
  rate_limit_rpm: number;
  sandbox_mode: boolean;
  monthly_quota: number;
  usage_percentage: number;
}

export const VerifierPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'bulk' | 'api'>('search');

  // Search state
  const [searchType, setSearchType] = useState<'apaar' | 'namedob' | 'enr'>('apaar');
  const [apaarQuery, setApaarQuery] = useState<string>('829103847192');
  const [nameQuery, setNameQuery] = useState<string>('');
  const [dobQuery, setDobQuery] = useState<string>('');
  const [enrQuery, setEnrQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // Request Access Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [requestPurpose, setRequestPurpose] = useState<string>('Employment Pre-Boarding Verification');
  const [requestLoading, setRequestLoading] = useState<boolean>(false);

  // Bulk Verify state
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<any | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [newKeyOrg, setNewKeyOrg] = useState<string>('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState<boolean>(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSearchLoading(true);
      setSearchResult(null);
      const params: any = {};
      if (searchType === 'apaar') {
        params.apaar_id = apaarQuery.trim();
      } else if (searchType === 'enr') {
        params.enrollment_no = enrQuery.trim();
      } else {
        params.name = nameQuery.trim();
        params.dob = dobQuery.trim();
      }

      const res = await api.get('/verifier/search', { params });
      setSearchResult(res.data);
      if (!res.data.found) {
        toast.error(res.data.message || 'No credential match discovered');
      } else {
        toast.success('Academic credential authenticated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Search query failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!searchResult?.student_id) return;
    try {
      setRequestLoading(true);
      const res = await api.post(`/verifier/request-access?student_id=${searchResult.student_id}&purpose=${encodeURIComponent(requestPurpose)}`);
      toast.success(res.data.message || 'Consent request transmitted');
      setIsRequestModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to dispatch request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      toast.error('Select a CSV or Excel file containing APAAR IDs');
      return;
    }
    try {
      setBulkLoading(true);
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await api.post('/verifier/bulk-verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkResults(res.data);
      toast.success(`Verified ${res.data.verified_count} of ${res.data.total_submitted} records`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Bulk verification failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const loadApiData = async () => {
    try {
      const [keysRes, statsRes] = await Promise.all([
        api.get('/verifier/api-keys'),
        api.get('/verifier/usage-stats')
      ]);
      const list = Array.isArray(keysRes.data) ? keysRes.data : (Array.isArray(keysRes.data?.keys) ? keysRes.data.keys : []);
      setApiKeys(list);
      setUsageStats(statsRes.data || null);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'api') {
      loadApiData();
    }
  }, [activeTab]);

  const handleCreateApiKey = async () => {
    if (!newKeyOrg.trim()) {
      toast.error('Enter organization or department name');
      return;
    }
    try {
      const res = await api.post(`/verifier/api-keys?org_name=${encodeURIComponent(newKeyOrg)}`);
      setGeneratedKey(res.data.api_key);
      toast.success('API key generated successfully');
      loadApiData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will lose access immediately.')) {
      return;
    }
    try {
      await api.delete(`/verifier/api-keys/${id}`);
      toast.success('API key revoked');
      loadApiData();
    } catch (err: any) {
      toast.error('Failed to revoke API key');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#1DB954]" />
          <h1 className="text-3xl font-black text-white tracking-tight">Institutional & Employer Verifier Portal</h1>
        </div>
        <p className="text-sm text-[#B3B3B3] mt-1">
          Privacy-preserving academic credential authentication for employers, universities, banks, and credential evaluators
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'search'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Single Credential Search
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'bulk'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Bulk Batch Verification
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'api'
              ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20 scale-102'
              : 'bg-[#242424] text-[#B3B3B3] hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys & Developer Sandbox
        </button>
      </div>

      {/* Tab 1: Single Search */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-[#B3B3B3]">Search Criteria:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === 'apaar'}
                  onChange={() => setSearchType('apaar')}
                  className="accent-[#1DB954]"
                />
                12-Digit APAAR ID
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === 'enr'}
                  onChange={() => setSearchType('enr')}
                  className="accent-[#1DB954]"
                />
                Enrollment Number
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-white">
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === 'namedob'}
                  onChange={() => setSearchType('namedob')}
                  className="accent-[#1DB954]"
                />
                Name + Date of Birth
              </label>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
              {searchType === 'apaar' && (
                <div className="flex-1 relative w-full">
                  <input
                    type="text"
                    value={apaarQuery}
                    onChange={(e) => setApaarQuery(e.target.value)}
                    placeholder="Enter candidate's 12-digit APAAR ID (e.g. 829103847192)"
                    className="w-full bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 font-mono text-sm focus:outline-none focus:border-[#1DB954]"
                  />
                </div>
              )}

              {searchType === 'enr' && (
                <div className="flex-1 relative w-full">
                  <input
                    type="text"
                    value={enrQuery}
                    onChange={(e) => setEnrQuery(e.target.value)}
                    placeholder="Enter College Enrollment / Roll Number (e.g. ENR2024-9102)"
                    className="w-full bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 font-mono text-sm focus:outline-none focus:border-[#1DB954]"
                  />
                </div>
              )}

              {searchType === 'namedob' && (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    placeholder="Candidate Legal Full Name"
                    className="bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 text-sm focus:outline-none focus:border-[#1DB954]"
                  />
                  <input
                    type="date"
                    value={dobQuery}
                    onChange={(e) => setDobQuery(e.target.value)}
                    className="bg-[#282828] text-white px-4 py-3 rounded-full border border-white/10 text-sm focus:outline-none focus:border-[#1DB954]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={searchLoading}
                className="w-full md:w-auto px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20"
              >
                <Search className="w-4 h-4" />
                {searchLoading ? 'Authenticating...' : 'Authenticate Credential'}
              </button>
            </form>
          </div>

          {/* Search Result Display */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#181818] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {!searchResult.found ? (
                <div className="p-8 text-center text-amber-400">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-80" />
                  <h3 className="font-bold text-white text-base">Record Not Found</h3>
                  <p className="text-xs text-[#B3B3B3] mt-1">{searchResult.message}</p>
                </div>
              ) : (
                <div>
                  {/* Result Header */}
                  <div className="p-6 bg-gradient-to-r from-[#1f1f1f] to-[#121212] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-white">{searchResult.name}</h2>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                            searchResult.verification_status === 'Verified'
                              ? 'bg-[#1DB954]/20 text-[#1DB954]'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {searchResult.verification_status}
                        </span>
                      </div>
                      <div className="text-xs text-[#B3B3B3] font-mono">
                        APAAR ID: <strong className="text-white">{searchResult.apaar_id}</strong> • Last Verified: {searchResult.last_verified_date}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[11px] text-[#B3B3B3]">AICTE Trust Score</div>
                        <div className="text-2xl font-black text-[#1DB954]">{searchResult.trust_score}%</div>
                      </div>
                      {searchResult.has_extended_consent ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#1DB954] bg-[#1DB954]/10 px-3 py-1.5 rounded-full border border-[#1DB954]/20">
                          <Unlock className="w-3.5 h-3.5" />
                          Consent Authorized
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                          <Lock className="w-3.5 h-3.5" />
                          Basic Consent Tier
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result Body */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Consented Basic Data */}
                    <div className="space-y-3 bg-[#242424] p-4 rounded-xl border border-white/5 text-xs">
                      <div className="font-bold text-white uppercase tracking-wider text-[11px] text-[#1DB954]">
                        Institutional Enrollment Data
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">AICTE Institution</span>
                        <span className="text-white font-semibold text-right max-w-[220px] truncate">{searchResult.institution}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Degree Course</span>
                        <span className="text-white">{searchResult.course}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Specialization / Branch</span>
                        <span className="text-white">{searchResult.branch}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#B3B3B3]">Admission Cohort</span>
                        <span className="text-white">{searchResult.admission_year}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#B3B3B3]">Enrollment Status</span>
                        <span className="text-white font-semibold">{searchResult.status}</span>
                      </div>
                    </div>

                    {/* Extended Transcript Data */}
                    <div className="space-y-3 bg-[#242424] p-4 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white uppercase tracking-wider text-[11px] text-blue-400">
                          Academic Transcript Metrics
                        </div>
                        {searchResult.has_extended_consent && (
                          <span className="text-[10px] text-[#B3B3B3]">Valid until: {searchResult.consent_expires_at}</span>
                        )}
                      </div>

                      {searchResult.has_extended_consent ? (
                        <>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#B3B3B3]">Cumulative GPA (CGPA)</span>
                            <span className="text-[#1DB954] font-black text-sm">{searchResult.cgpa} / 10.0</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-[#B3B3B3]">Completed Semester</span>
                            <span className="text-white font-bold">Semester {searchResult.current_semester}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-[#B3B3B3]">Category Tier</span>
                            <span className="text-white">{searchResult.category}</span>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center space-y-3">
                          <Lock className="w-8 h-8 text-[#B3B3B3] mx-auto opacity-40" />
                          <div className="text-xs text-[#B3B3B3]">
                            Academic transcripts and GPA metrics are locked under DPDP Act 2023 privacy provisions.
                          </div>
                          <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 shadow-md shadow-[#1DB954]/20"
                          >
                            Request Detailed Student Authorization
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 2: Bulk Verification */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Batch Credential Authentication</h3>
              <p className="text-xs text-[#B3B3B3] mt-0.5">
                Upload a CSV or Excel sheet containing a column of candidate APAAR IDs for rapid institutional screening.
              </p>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 hover:border-[#1DB954]/50 rounded-2xl p-8 text-center transition-colors">
                <Upload className="w-8 h-8 text-[#1DB954] mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs text-white font-bold bg-[#282828] hover:bg-[#333] px-4 py-2 rounded-full inline-block transition-colors">
                    {bulkFile ? bulkFile.name : 'Choose CSV or Excel Spreadsheet'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#B3B3B3] mt-2">
                  Supports columns titled "apaar_id", "apaar", or raw 12-digit values.
                </p>
              </div>

              <button
                type="submit"
                disabled={bulkLoading || !bulkFile}
                className="px-6 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-40 text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
              >
                {bulkLoading ? 'Processing Batch...' : 'Authenticate Batch Credential Roster'}
              </button>
            </form>
          </div>

          {/* Bulk Results Table */}
          {bulkResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden"
            >
              <div className="p-4 bg-[#1f1f1f] flex items-center justify-between border-b border-white/10">
                <div className="text-xs text-white">
                  Processed: <strong>{bulkResults.total_submitted}</strong> records • Validated:{' '}
                  <strong className="text-[#1DB954]">{bulkResults.verified_count}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1f1f1f] text-[#B3B3B3] border-b border-white/5">
                    <tr>
                      <th className="p-3">APAAR ID</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3">Trust Score</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bulkResults.results?.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-bold text-white">{r.apaar_id}</td>
                        <td className="p-3 text-white">{r.name}</td>
                        <td className="p-3 text-[#B3B3B3]">{r.institution}</td>
                        <td className="p-3 font-bold text-[#1DB954]">{r.trust_score}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              r.verified
                                ? 'bg-[#1DB954]/20 text-[#1DB954]'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 3: API Developer Sandbox */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Usage Stats Row */}
          {usageStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <div className="text-xs text-[#B3B3B3]">Active API Keys</div>
                <div className="text-2xl font-black text-white mt-1">{usageStats.active_keys}</div>
              </div>
              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <div className="text-xs text-[#B3B3B3]">API Queries Dispatched</div>
                <div className="text-2xl font-black text-[#1DB954] mt-1">{usageStats.total_api_calls_made}</div>
              </div>
              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <div className="text-xs text-[#B3B3B3]">Rate Limit Ceiling</div>
                <div className="text-2xl font-black text-white mt-1">{usageStats.rate_limit_rpm} <span className="text-xs text-[#B3B3B3] font-normal">req/min</span></div>
              </div>
              <div className="bg-[#181818] p-4 rounded-2xl border border-white/5">
                <div className="text-xs text-[#B3B3B3]">Sandbox Environment</div>
                <div className="text-2xl font-black text-blue-400 mt-1">Enabled</div>
              </div>
            </div>
          )}

          {/* Key Management Card */}
          <div className="bg-[#181818] p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">REST API Authentication Tokens</h3>
                <p className="text-xs text-[#B3B3B3] mt-0.5">
                  Secure programmatic access for enterprise HRMS and university admissions platforms
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Organization / Department"
                  value={newKeyOrg}
                  onChange={(e) => setNewKeyOrg(e.target.value)}
                  className="bg-[#282828] text-white px-3 py-1.5 rounded-full text-xs border border-white/10 focus:outline-none focus:border-[#1DB954]"
                />
                <button
                  onClick={handleCreateApiKey}
                  className="px-4 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 shadow-md shadow-[#1DB954]/20"
                >
                  Generate Key
                </button>
              </div>
            </div>

            {/* Newly Generated Secret Banner */}
            {generatedKey && (
              <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1DB954] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    New Secret API Token (Copy now — it will not be displayed again):
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
                      toast.success('Token copied to clipboard');
                    }}
                    className="text-xs bg-[#1DB954] text-black px-2.5 py-1 rounded font-bold hover:bg-[#1ed760]"
                  >
                    Copy
                  </button>
                </div>
                <div className="font-mono text-xs text-white bg-black/40 p-2 rounded break-all">
                  {generatedKey}
                </div>
              </div>
            )}

            {/* Keys Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f1f1f] text-[#B3B3B3] border-b border-white/5">
                  <tr>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Key Prefix</th>
                    <th className="p-3">Calls Made</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-white/5">
                      <td className="p-3 text-white font-semibold">{key.org_name}</td>
                      <td className="p-3 font-mono text-[#B3B3B3]">{key.key_prefix}...</td>
                      <td className="p-3 text-white font-bold">{key.usage_count}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            key.is_active ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {key.is_active ? 'ACTIVE' : 'REVOKED'}
                        </span>
                      </td>
                      <td className="p-3">
                        {key.is_active && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Curl Code Snippet */}
            <div className="bg-[#242424] p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="font-bold text-[#B3B3B3]">Example API Curl Request:</div>
              <pre className="font-mono text-[11px] text-white/90 bg-black/50 p-3 rounded-lg overflow-x-auto">
{`curl -X GET "http://localhost:8000/api/v1/verifier/search?apaar_id=829103847192" \\
  -H "X-API-Key: apaar_live_your_token_here"`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#1DB954]" />
                Request Extended Data Access
              </h3>
              <p className="text-xs text-[#B3B3B3]">
                Under the DPDP Act 2023, access to detailed semester transcripts requires active consent from the data principal (student).
              </p>

              <div className="space-y-1.5 text-xs">
                <label className="text-[#B3B3B3]">Verification Purpose:</label>
                <select
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-[#1DB954]"
                >
                  <option value="Employment Pre-Boarding Verification">Employment Pre-Boarding Verification</option>
                  <option value="Higher Education Admission Screening">Higher Education Admission Screening</option>
                  <option value="Education Loan Credit Assessment">Education Loan Credit Assessment</option>
                  <option value="Government Scholarship Eligibility">Government Scholarship Eligibility</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-[#282828] text-white text-xs rounded-full hover:bg-[#333]"
                >
                  Cancel
                </button>
                <button
                  disabled={requestLoading}
                  onClick={handleRequestAccess}
                  className="px-5 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full shadow-lg shadow-[#1DB954]/20"
                >
                  {requestLoading ? 'Dispatching...' : 'Dispatch Consent Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
