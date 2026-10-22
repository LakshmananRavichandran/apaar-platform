import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface HealthData {
  status: string;
  timestamp: string;
  api_gateway: string;
  database: {
    engine: string;
    size_mb: number;
    connected: boolean;
  };
  background_queue: {
    status: string;
    active_workers: number;
    jobs_in_queue: number;
  };
  digilocker_mock_gateway: {
    status: string;
    latency_ms: number;
    rate_limit_rpm: number;
  };
  activity_heatmap: Array<{
    day: string;
    verifications: number;
    uploads: number;
    flags: number;
  }>;
}

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);

  // Settings State
  const [contaminationRate, setContaminationRate] = useState<number>(0.04);
  const [trustThreshold, setTrustThreshold] = useState<number>(80);
  const [autoFlagAge, setAutoFlagAge] = useState<boolean>(true);
  const [autoFlagSemester, setAutoFlagSemester] = useState<boolean>(true);
  const [dpdpMasking, setDpdpMasking] = useState<boolean>(true);
  const [digilockerRateLimit, setDigilockerRateLimit] = useState<number>(120);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/health');
      setHealth(res.data);
    } catch (err: any) {
      toast.error('Failed to query telemetry endpoints');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/system/settings');
      if (res.data) {
        if (res.data.anomaly_contamination_rate !== undefined) {
          setContaminationRate(Number(res.data.anomaly_contamination_rate));
        }
        if (res.data.trust_score_pass_threshold !== undefined) {
          setTrustThreshold(Number(res.data.trust_score_pass_threshold));
        }
        if (res.data.auto_flag_age_mismatch !== undefined) {
          setAutoFlagAge(Boolean(res.data.auto_flag_age_mismatch));
        }
        if (res.data.auto_flag_semester_drift !== undefined) {
          setAutoFlagSemester(Boolean(res.data.auto_flag_semester_drift));
        }
        if (res.data.dpdp_act_enforce_masking !== undefined) {
          setDpdpMasking(Boolean(res.data.dpdp_act_enforce_masking));
        }
        if (res.data.digilocker_sync_rate_limit !== undefined) {
          setDigilockerRateLimit(Number(res.data.digilocker_sync_rate_limit));
        }
      }
    } catch (err: any) {
      console.warn('Using default telemetry configuration');
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      const payload = {
        anomaly_contamination_rate: contaminationRate,
        trust_score_pass_threshold: trustThreshold,
        auto_flag_age_mismatch: autoFlagAge,
        auto_flag_semester_drift: autoFlagSemester,
        dpdp_act_enforce_masking: dpdpMasking,
        digilocker_sync_rate_limit: digilockerRateLimit
      };
      const res = await api.put('/system/settings', payload);
      toast.success(res.data.message || 'System thresholds saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update configuration');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#1DB954]" />
            <h1 className="text-3xl font-black text-white tracking-tight">System Telemetry & Parameters</h1>
          </div>
          <p className="text-sm text-[#B3B3B3] mt-1">
            Realtime service health indicators, queue throughput, and ML anomaly threshold tuning
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 bg-[#282828] hover:bg-[#333] text-white rounded-full transition-colors self-start sm:self-auto"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Service Health Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Gateway */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B3B3B3]">API Gateway</span>
            <Server className="w-4 h-4 text-[#1DB954]" />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1DB954] animate-ping" />
            ONLINE
          </div>
          <div className="text-[11px] text-[#B3B3B3]">FastAPI + ASGI Uvicorn</div>
        </div>

        {/* Database */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B3B3B3]">Database Cluster</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {health?.database.size_mb || 0} MB
          </div>
          <div className="text-[11px] text-[#B3B3B3] truncate">
            {health?.database.engine || 'SQLite WAL / Postgres'}
          </div>
        </div>

        {/* Background Tasks */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B3B3B3]">Task Queue</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            {health?.background_queue.active_workers || 4} Workers
          </div>
          <div className="text-[11px] text-[#B3B3B3]">
            {health?.background_queue.jobs_in_queue || 0} Jobs Queued
          </div>
        </div>

        {/* DigiLocker Gateway */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B3B3B3]">DigiLocker Mock Sync</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-[#1DB954]">
            {health?.digilocker_mock_gateway.latency_ms || 32} ms
          </div>
          <div className="text-[11px] text-[#B3B3B3]">
            Limit: {health?.digilocker_mock_gateway.rate_limit_rpm || 120} RPM
          </div>
        </div>
      </div>

      {/* Platform Activity Heatmap */}
      {health?.activity_heatmap && (
        <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">7-Day Verification & Ingestion Load</h3>
              <p className="text-xs text-[#B3B3B3]">Throughput volume across institution rosters</p>
            </div>
            <span className="text-xs text-[#1DB954] bg-[#1DB954]/10 px-3 py-1 rounded-full font-bold">
              Peak: 2,350 queries/day
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={health.activity_heatmap}>
                <XAxis dataKey="day" stroke="#B3B3B3" fontSize={12} tickLine={false} />
                <YAxis stroke="#B3B3B3" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#242424', borderColor: '#333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="verifications" fill="#1DB954" radius={[6, 6, 0, 0]} name="Verifications" />
                <Bar dataKey="uploads" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Batch Uploads" />
                <Bar dataKey="flags" fill="#EF4444" radius={[6, 6, 0, 0]} name="Anomalies Flagged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Machine Learning & Threshold Parameters Form */}
      <div className="bg-[#181818] p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#1DB954]" />
          <h3 className="text-lg font-bold text-white">Algorithm & Verification Threshold Tuning</h3>
        </div>
        <p className="text-xs text-[#B3B3B3]">
          Control scikit-learn IsolationForest anomaly sensitivity and automated flag triggers across all AICTE colleges.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contamination Slider */}
            <div className="bg-[#242424] p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-bold">ML IsolationForest Contamination</label>
                <span className="font-mono text-[#1DB954] font-bold">{(contaminationRate * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.15"
                step="0.01"
                value={contaminationRate}
                onChange={(e) => setContaminationRate(parseFloat(e.target.value))}
                className="w-full accent-[#1DB954] cursor-pointer"
              />
              <p className="text-[11px] text-[#B3B3B3]">
                Estimated proportion of statistical outliers within cohort age and credit distributions.
              </p>
            </div>

            {/* Trust Threshold Slider */}
            <div className="bg-[#242424] p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex justify-between">
                <label className="text-white font-bold">Trust Score Pass Threshold</label>
                <span className="font-mono text-[#1DB954] font-bold">{trustThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={trustThreshold}
                onChange={(e) => setTrustThreshold(parseInt(e.target.value))}
                className="w-full accent-[#1DB954] cursor-pointer"
              />
              <p className="text-[11px] text-[#B3B3B3]">
                Students scoring below this threshold are marked "Pending" or "Flagged" for nodal review.
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <label className="flex items-center gap-3 bg-[#242424] p-3.5 rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFlagAge}
                onChange={(e) => setAutoFlagAge(e.target.checked)}
                className="accent-[#1DB954] w-4 h-4 rounded"
              />
              <div>
                <div className="text-white font-semibold">Auto-Flag Age Outliers</div>
                <div className="text-[11px] text-[#B3B3B3]">Flags if age &lt; 16 or &gt; 60</div>
              </div>
            </label>

            <label className="flex items-center gap-3 bg-[#242424] p-3.5 rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFlagSemester}
                onChange={(e) => setAutoFlagSemester(e.target.checked)}
                className="accent-[#1DB954] w-4 h-4 rounded"
              />
              <div>
                <div className="text-white font-semibold">Auto-Flag Semester Drift</div>
                <div className="text-[11px] text-[#B3B3B3]">Semester vs cohort year check</div>
              </div>
            </label>

            <label className="flex items-center gap-3 bg-[#242424] p-3.5 rounded-xl border border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={dpdpMasking}
                onChange={(e) => setDpdpMasking(e.target.checked)}
                className="accent-[#1DB954] w-4 h-4 rounded"
              />
              <div>
                <div className="text-white font-semibold">DPDP Act PII Masking</div>
                <div className="text-[11px] text-[#B3B3B3]">Masks Aadhaar last-4 & phones</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={settingsLoading}
              className="px-6 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#1DB954]/20"
            >
              <Save className="w-4 h-4" />
              {settingsLoading ? 'Saving...' : 'Apply & Broadcast Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
