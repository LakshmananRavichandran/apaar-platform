import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, RefreshCw, Download, AlertTriangle, ExternalLink,
  Building2, CheckCircle2, X
} from 'lucide-react';
import { useNowViewingStore } from '../../store/useNowViewingStore';
import { ApiClient, getDownloadUrl } from '../../services/api';

export const NowViewingBar: React.FC = () => {
  const navigate = useNavigate();
  const { item, clearViewing } = useNowViewingStore();
  const [verifying, setVerifying] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!item) return null;

  const handleVerifyNow = async () => {
    if (item.type !== 'student') return;
    setVerifying(true);
    try {
      const res = await ApiClient.post(`/verification/verify-student/${item.id}`);
      setToastMsg(`Verification complete! Trust Score: ${res.trust_score}%. Status: ${res.status}`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (e: any) {
      setToastMsg(`Verification failed: ${e.message}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadPDF = () => {
    if (item.type === 'student') {
      window.open(getDownloadUrl(`/students/${item.id}/certificate`), '_blank');
    } else {
      window.open(getDownloadUrl(`/reports/export?dataset=colleges&format=pdf`), '_blank');
    }
  };

  const handleOpenDetail = () => {
    if (item.type === 'student') {
      navigate(`/students/${item.id}`);
    } else {
      navigate(`/colleges/${item.id}`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-50 shadow-xl select-none transition-colors duration-200">
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#15803D] text-white font-bold text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Left Column: Student / College Info & Trust Badge */}
      <div className="flex items-center gap-4 min-w-[280px] max-w-sm">
        <div
          className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer shadow-xs"
          onClick={handleOpenDetail}
        >
          {item.photo_url ? (
            <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
          ) : item.type === 'student' ? (
            <div className="w-full h-full bg-[#0A3871] flex items-center justify-center text-white font-bold text-lg">
              {item.title[0]}
            </div>
          ) : (
            <Building2 className="w-6 h-6 text-[#0A3871] dark:text-blue-400" />
          )}
        </div>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-slate-900 dark:text-white text-sm hover:underline cursor-pointer truncate"
              onClick={handleOpenDetail}
            >
              {item.title}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                item.status === 'Verified'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : item.status === 'Flagged'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : item.status === 'Rejected'
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {item.status}
            </span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
            {item.subtitle}
          </div>
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
            {item.type === 'student' ? `APAAR: ${item.apaar_or_code}` : `AICTE Code: ${item.apaar_or_code}`}
          </div>
        </div>
      </div>

      {/* Center Column: Quick Action Controls */}
      <div className="flex items-center gap-3">
        {item.type === 'student' && (
          <button
            onClick={handleVerifyNow}
            disabled={verifying}
            className="spotify-pill-btn text-xs py-2 px-5 cursor-pointer disabled:opacity-50"
            title="Execute rule checks and anomaly detection"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Verifying...' : 'Verify Now'}</span>
          </button>
        )}

        <button
          onClick={handleOpenDetail}
          className="spotify-pill-secondary text-xs py-2 px-4 flex items-center gap-2"
          title="Field-by-field DigiLocker comparison"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
          <span>DigiLocker Sync</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          className="spotify-pill-secondary text-xs py-2 px-4 flex items-center gap-2"
          title="Download official PDF certificate"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{item.type === 'student' ? 'Certificate PDF' : 'Export PDF'}</span>
        </button>

        {item.type === 'student' && (
          <button
            onClick={() => navigate(`/flags?search=${item.apaar_or_code}`)}
            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
            title="View or create flags for this student"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right Column: Score Dial, Full Profile Link, Close */}
      <div className="flex items-center gap-4 min-w-[200px] justify-end">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
            {item.type === 'student' ? 'Trust Score' : 'Score'}
          </div>
          <div className="text-sm font-black text-[#15803D] dark:text-emerald-400 flex items-center gap-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{item.score}%</span>
          </div>
        </div>

        <button
          onClick={handleOpenDetail}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition"
          title="Open Full Details"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={clearViewing}
          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition"
          title="Dismiss Bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
