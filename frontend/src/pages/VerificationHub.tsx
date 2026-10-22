import React, { useState } from 'react';
import {
  ShieldCheck, RefreshCw, Cpu, CheckCircle2, AlertTriangle,
  Play, Download, ExternalLink, Activity, Sparkles, Filter
} from 'lucide-react';
import { ApiClient } from '../services/api';

export const VerificationHub: React.FC = () => {
  const [apaarInput, setApaarInput] = useState('100000000007');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // DigiLocker Simulation Options
  const [simulateDelay, setSimulateDelay] = useState(true);
  const [simulateError, setSimulateError] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleRunVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      // First lookup student
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

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-[#1DB954]" />
            <span>AICTE Verification & Authenticity Engine</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Deterministic rule validation, Scikit-Learn IsolationForest anomaly scoring, and DigiLocker synchronization
          </p>
        </div>

        <button
          onClick={handleTriggerNightlyScheduler}
          className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>Run Nightly Scheduler</span>
        </button>
      </div>

      {/* Manual Verification Form */}
      <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#1DB954]" />
          <span>Execute Instant Student Verification</span>
        </h3>
        <p className="text-xs text-[#B3B3B3]">
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
            className="flex-1 bg-[#242424] text-white text-xs px-4 py-3 rounded-xl border border-transparent focus:border-[#1DB954] outline-none font-mono text-sm"
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
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Verification Pipeline Results */}
      {result && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{result.student.name}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  result.status === 'Verified' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                  result.status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="text-xs text-[#B3B3B3] font-mono mt-0.5">
                APAAR ID: {result.student.apaar_id} • {result.student.college_name || 'AICTE College'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Trust Score</span>
              <span className="text-2xl font-black text-[#1DB954]">{result.trust_score}%</span>
            </div>
          </div>

          {/* Rule-by-rule results */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase mb-3">Deterministic Rule Checks</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>12-Digit Luhn Checksum</span>
                {result.rule_results?.checksum_valid ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>Age at Admission (16-60)</span>
                {result.rule_results?.age_valid !== false ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>Semester / Term Coherence</span>
                {result.rule_results?.semester_valid !== false ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>CGPA Scale (0.0 - 10.0)</span>
                {result.rule_results?.cgpa_valid !== false ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>Cross-College Uniqueness</span>
                {result.rule_results?.unique_apaar !== false ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1DB954]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="bg-[#242424] p-3 rounded-xl flex items-center justify-between">
                <span>IsolationForest ML Risk</span>
                <span className="font-bold text-zinc-300">{result.risk_score}% Risk</span>
              </div>
            </div>
          </div>

          {/* Anomaly Explanations in Plain English */}
          {result.anomaly_reasons && result.anomaly_reasons.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 text-xs text-amber-200">
              <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Discrepancy Reasons:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                {result.anomaly_reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* DigiLocker Sync Gateway section */}
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#1DB954]" />
                  <span>DigiLocker Realtime Sync Gateway</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Fetch official citizen record, test latency, rate limits, and diff resolution
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={simulateError}
                    onChange={(e) => setSimulateError(e.target.checked)}
                    className="accent-rose-500"
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
              <div className="bg-[#242424] p-4 rounded-xl border border-zinc-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {syncResult.success ? 'Official Record Retrieved' : 'Gateway Response Error'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {syncResult.synced_at || 'HTTP Error'}
                  </span>
                </div>

                {!syncResult.success ? (
                  <div className="p-3 bg-red-950/60 text-red-200 rounded-lg">
                    {syncResult.message}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-zinc-500 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="py-1">Field</th>
                          <th className="py-1">College Value</th>
                          <th className="py-1">DigiLocker Official Value</th>
                          <th className="py-1 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-700/60">
                        {syncResult.differences?.map((d: any) => (
                          <tr key={d.field}>
                            <td className="py-2 font-bold text-zinc-300">{d.label}</td>
                            <td className="py-2 text-white">{d.college_value}</td>
                            <td className="py-2 text-[#1DB954]">{d.official_value}</td>
                            <td className="py-2 text-right">
                              {d.matches ? (
                                <span className="text-[#1DB954] font-bold">Matched</span>
                              ) : (
                                <span className="text-amber-400 font-bold">Mismatch ({d.similarity_score}%)</span>
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
  );
};
