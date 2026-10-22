import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, RefreshCw, Download, AlertTriangle, ExternalLink,
  GraduationCap, CheckCircle2, X, Sparkles, Building2
} from 'lucide-react';
import { useNowViewingStore } from '../../store/useNowViewingStore';
import { ApiClient } from '../../services/api';

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
      window.open(`http://localhost:8000/api/v1/students/${item.id}/certificate`, '_blank');
    } else {
      window.open(`http://localhost:8000/api/v1/reports/export?dataset=colleges&format=pdf`, '_blank');
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
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#181818] border-t border-[#282828] px-6 flex items-center justify-between z-50 shadow-2xl select-none">
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1DB954] text-black font-bold text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Left Column: Student / College Info & Trust Badge */}
      <div className="flex items-center gap-4 min-w-[280px] max-w-sm">
        <div className="w-12 h-12 rounded-lg bg-[#242424] border border-[#333] flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer" onClick={handleOpenDetail}>
          {item.photo_url ? (
            <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
          ) : item.type === 'student' ? (
            <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-zinc-900 flex items-center justify-center text-white font-bold text-lg">
              {item.title[0]}
            </div>
          ) : (
            <Building2 className="w-6 h-6 text-[#1DB954]" />
          )}
        </div>

        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm hover:underline cursor-pointer truncate" onClick={handleOpenDetail}>
              {item.title}
            </span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              item.status === 'Verified' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
              item.status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' :
              item.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {item.status}
            </span>
          </div>
          <div className="text-xs text-[#B3B3B3] truncate mt-0.5">
            {item.subtitle}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate">
            {item.type === 'student' ? `APAAR: ${item.apaar_or_code}` : `AICTE Code: ${item.apaar_or_code}`}
          </div>
        </div>
      </div>

      {/* Center Column: Quick Action Controls (Spotify Player style) */}
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
          <RefreshCw className="w-3.5 h-3.5 text-[#1DB954]" />
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
            className="w-9 h-9 rounded-full bg-[#242424] hover:bg-amber-950/60 hover:text-amber-400 text-zinc-400 flex items-center justify-center transition"
            title="View or create flags for this student"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right Column: Score Dial, Full Profile Link, Close */}
      <div className="flex items-center gap-4 min-w-[200px] justify-end">
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
            {item.type === 'student' ? 'Trust Score' : 'Score'}
          </div>
          <div className="text-sm font-black text-[#1DB954] flex items-center gap-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-ping" />
            <span>{item.score}%</span>
          </div>
        </div>

        <button
          onClick={handleOpenDetail}
          className="w-9 h-9 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-300 hover:text-white flex items-center justify-center transition"
          title="Open Full Details"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        <button
          onClick={clearViewing}
          className="w-7 h-7 rounded-full text-zinc-500 hover:text-white flex items-center justify-center transition"
          title="Dismiss Now Viewing"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
