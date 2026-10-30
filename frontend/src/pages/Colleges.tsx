import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Search, Building2, Award, Users, AlertTriangle,
  ArrowRight, CheckCircle2, MapPin, Phone, Mail, Globe, ExternalLink
} from 'lucide-react';
import { ApiClient, getDownloadUrl } from '../services/api';
import { College } from '../types';
import { useNowViewingStore } from '../store/useNowViewingStore';

export const Colleges: React.FC = () => {
  const navigate = useNavigate();
  const { setViewingCollege } = useNowViewingStore();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');

  // Selected College Profile modal/drawer
  const [activeCollege, setActiveCollege] = useState<any | null>(null);
  const [reports, setReports] = useState<any | null>(null);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/colleges', {
        search: search || undefined,
        state: selectedState || undefined,
        limit: 60
      });
      const list = Array.isArray(res) ? res : (res.colleges || res.items || []);
      setColleges(list);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [selectedState]);

  const handleInspectCollege = async (col: College) => {
    setViewingCollege(col);
    try {
      const [detailRes, repRes] = await Promise.all([
        ApiClient.get(`/colleges/${col.id}`),
        ApiClient.get(`/colleges/${col.id}/reports`)
      ]);
      setActiveCollege(detailRes);
      setReports(repRes);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-[#1DB954]" />
            <span>AICTE Approved Institutions</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            60 Technical Universities & Colleges across 15 Indian States with Compliance Monitoring
          </p>
        </div>

        <button
          onClick={() => window.open(getDownloadUrl('/reports/export?dataset=colleges&format=csv'), '_blank')}
          className="spotify-pill-secondary text-xs py-2 px-3.5"
        >
          Export Directory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181818] p-4 rounded-2xl border border-[#282828] flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchColleges()}
            placeholder="Search by college name, AICTE approval code, or district..."
            className="w-full bg-[#242424] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#1DB954] outline-none"
          />
        </div>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-[#242424] text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-700 outline-none"
        >
          <option value="">All 15 States</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Delhi">Delhi</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Telangana">Telangana</option>
          <option value="West Bengal">West Bengal</option>
          <option value="Gujarat">Gujarat</option>
          <option value="Kerala">Kerala</option>
          <option value="Rajasthan">Rajasthan</option>
          <option value="Madhya Pradesh">Madhya Pradesh</option>
          <option value="Andhra Pradesh">Andhra Pradesh</option>
          <option value="Punjab">Punjab</option>
          <option value="Haryana">Haryana</option>
          <option value="Bihar">Bihar</option>
        </select>
      </div>

      {/* Grid of Colleges */}
      {loading ? (
        <div className="text-center py-12 text-[#B3B3B3] text-sm animate-pulse">
          Loading AICTE college directory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map((col) => (
            <div
              key={col.id}
              onClick={() => handleInspectCollege(col)}
              className="spotify-card cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    {col.accreditation}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    col.rag_rating === 'GREEN' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                    col.rag_rating === 'AMBER' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {col.rag_rating} COMPLIANT
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#1DB954] transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-[#B3B3B3] mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{col.district}, {col.state}</span>
                </p>
                <div className="text-[11px] font-mono text-zinc-500 mt-1">
                  AICTE Code: {col.aicte_code}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Verification Score</span>
                  <span className="text-[#1DB954] font-black text-sm">{col.verification_score}%</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px]">Compliance Index</span>
                  <span className="text-white font-bold">{col.compliance_score}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* College Profile Modal */}
      {activeCollege && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800 mb-4">
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  {activeCollege.accreditation} • AICTE Code: {activeCollege.aicte_code}
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  {activeCollege.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {activeCollege.address}
                </p>
              </div>
              <button onClick={() => setActiveCollege(null)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-[#242424] p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Enrolled Students</span>
                <span className="text-base font-black text-white">{activeCollege.total_students}</span>
              </div>
              <div className="bg-[#242424] p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Verified %</span>
                <span className="text-base font-black text-[#1DB954]">{activeCollege.verification_score}%</span>
              </div>
              <div className="bg-[#242424] p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Flagged Discrepancies</span>
                <span className="text-base font-black text-amber-400">{activeCollege.flagged_students}</span>
              </div>
              <div className="bg-[#242424] p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">RAG Rating</span>
                <span className={`text-base font-black ${
                  activeCollege.rag_rating === 'GREEN' ? 'text-[#1DB954]' :
                  activeCollege.rag_rating === 'AMBER' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {activeCollege.rag_rating}
                </span>
              </div>
            </div>

            {/* Courses Offered */}
            <div className="mb-5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase mb-2">Approved Academic Programs</h3>
              <div className="grid grid-cols-2 gap-2">
                {activeCollege.courses.map((cs: any) => (
                  <div key={cs.id} className="p-2.5 rounded-xl bg-[#242424] text-xs">
                    <div className="font-bold text-white">{cs.name}</div>
                    <div className="text-[11px] text-zinc-400">{cs.duration_years} Years Duration</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Compliance Alert Status */}
            {activeCollege.compliance_score < 90 && (
              <div className="p-3 mb-5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automated compliance alert: Institution compliance score ({activeCollege.compliance_score}%) is below 90% benchmark threshold. Nodal officer notification dispatched.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  navigate(`/students?college_id=${activeCollege.id}`);
                  setActiveCollege(null);
                }}
                className="spotify-pill-btn text-xs py-2 px-5"
              >
                View Enrolled Students ({activeCollege.total_students})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
