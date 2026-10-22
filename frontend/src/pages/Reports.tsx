import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Filter
} from 'lucide-react';
import { getDownloadUrl } from '../services/api';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<string>('students');
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [scheduledFrequency, setScheduledFrequency] = useState<string>('weekly');

  const handleExport = (dataset: string, format: string) => {
    const url = getDownloadUrl(`/reports/export?dataset=${dataset}&format=${format}`);
    window.open(url, '_blank');
    toast.success(`Generating official AICTE ${dataset} report in ${format.toUpperCase()} format...`);
  };

  const handleScheduleReport = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Scheduled ${scheduledFrequency.toUpperCase()} report dispatch configured successfully!`);
  };

  const reportPacks = [
    {
      id: 'students',
      title: 'Enrolled Students National Ledger',
      description: 'Comprehensive registry of 5,000+ students including 12-digit APAAR IDs, verification status, and AICTE trust scores.',
      count: '5,000 Records',
      color: 'from-emerald-900/40 to-[#181818]'
    },
    {
      id: 'colleges',
      title: 'AICTE Approved Colleges Directory',
      description: 'Complete roster of 60 institutions across 15 states with compliance RAG status, accreditation, and intake metrics.',
      count: '60 Institutions',
      color: 'from-blue-900/40 to-[#181818]'
    },
    {
      id: 'flags',
      title: 'Audit Discrepancies & Anomaly Log',
      description: 'Full register of identity collisions, age vs admission drifts, duplicate submissions, and IsolationForest ML outliers.',
      count: '150+ Incidents',
      color: 'from-amber-900/40 to-[#181818]'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-7 h-7 text-[#1DB954]" />
          <h1 className="text-3xl font-black text-white tracking-tight">Official Reports & Data Exports</h1>
        </div>
        <p className="text-sm text-[#B3B3B3] mt-1">
          Export institutional rosters, national compliance audits, and anomaly telemetry in CSV, Excel (.xlsx), and PDF formats
        </p>
      </div>

      {/* Primary Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportPacks.map((pack) => (
          <motion.div
            key={pack.id}
            whileHover={{ y: -4 }}
            className={`p-6 rounded-3xl bg-gradient-to-b ${pack.color} border border-white/10 flex flex-col justify-between space-y-4 shadow-xl`}
          >
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#1DB954] uppercase tracking-wider">
                {pack.count}
              </span>
              <h3 className="text-lg font-bold text-white">{pack.title}</h3>
              <p className="text-xs text-[#B3B3B3] leading-relaxed">{pack.description}</p>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleExport(pack.id, 'csv')}
                className="flex-1 py-2 px-3 bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#1DB954]" />
                CSV
              </button>
              <button
                onClick={() => handleExport(pack.id, 'excel')}
                className="flex-1 py-2 px-3 bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                Excel
              </button>
              <button
                onClick={() => handleExport(pack.id, 'pdf')}
                className="flex-1 py-2 px-3 bg-[#282828] hover:bg-[#333] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                PDF
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Report Builder & Scheduler Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Demand Builder */}
        <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">Custom Query Report Generator</h3>
          </div>
          <p className="text-xs text-[#B3B3B3]">
            Customize dataset slicing, file compression format, and security seal prior to download.
          </p>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="text-[#B3B3B3] block mb-1">Target Data Domain</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-[#1DB954]"
              >
                <option value="students">Student Identity & Academic Ledger</option>
                <option value="colleges">Colleges Directory & Compliance Ratings</option>
                <option value="flags">Verification Anomalies & Quality Flags</option>
              </select>
            </div>

            <div>
              <label className="text-[#B3B3B3] block mb-1">Document Format</label>
              <div className="grid grid-cols-3 gap-3">
                {['csv', 'excel', 'pdf'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`p-2.5 rounded-xl uppercase font-bold text-xs border text-center transition-all ${
                      selectedFormat === fmt
                        ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]'
                        : 'bg-[#282828] border-white/5 text-[#B3B3B3]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleExport(selectedDataset, selectedFormat)}
              className="w-full py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-full transition-transform hover:scale-102 flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20 mt-2"
            >
              <Download className="w-4 h-4" />
              Generate & Download Report Now
            </button>
          </div>
        </div>

        {/* Automated Recurring Schedule */}
        <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1DB954]" />
            <h3 className="text-base font-bold text-white">Automated Scheduled Executive Briefs</h3>
          </div>
          <p className="text-xs text-[#B3B3B3]">
            Configure cron-driven PDF/Excel reports dispatched directly to AICTE council members and regional secretariats.
          </p>

          <form onSubmit={handleScheduleReport} className="space-y-4 text-xs pt-2">
            <div>
              <label className="text-[#B3B3B3] block mb-1">Dispatch Cadence</label>
              <select
                value={scheduledFrequency}
                onChange={(e) => setScheduledFrequency(e.target.value)}
                className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-[#1DB954]"
              >
                <option value="daily">Daily Midnight Digest (00:00 UTC)</option>
                <option value="weekly">Weekly National Compliance Audit (Every Monday)</option>
                <option value="monthly">Monthly Institutional Accreditation Summary</option>
              </select>
            </div>

            <div>
              <label className="text-[#B3B3B3] block mb-1">Distribution Recipients</label>
              <input
                type="text"
                defaultValue="officer@aicte.gov.in, superadmin@aicte.gov.in"
                className="w-full bg-[#282828] text-white p-2.5 rounded-xl border border-white/10 text-xs focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#282828] hover:bg-[#333] text-white font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-2 border border-white/10 mt-2"
            >
              <Clock className="w-4 h-4 text-[#1DB954]" />
              Save Automation Schedule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
