import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, Building2, Users, Download,
  TrendingUp, Award, Filter, MapPin, Layers, ArrowUpRight
} from 'lucide-react';
import { ApiClient, getDownloadUrl } from '../services/api';
import { useNowViewingStore } from '../store/useNowViewingStore';

const COLORS = ['#1DB954', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setViewingCollege } = useNowViewingStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string>('ALL');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await ApiClient.get('/reports/national-dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load national dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm text-[#B3B3B3] animate-pulse">
        Generating AICTE National Analytics & Compliance Telemetry...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const state_stats = Array.isArray(data?.state_stats) ? data.state_stats : [];
  const funnel = Array.isArray(data?.funnel) ? data.funnel : [];
  const monthly_trend = Array.isArray(data?.monthly_trend) ? data.monthly_trend : [];
  const gender_ratio = Array.isArray(data?.gender_ratio) ? data.gender_ratio : [];
  const category_breakdown = Array.isArray(data?.category_breakdown) ? data.category_breakdown : [];
  const branch_breakdown = Array.isArray(data?.branch_breakdown) ? data.branch_breakdown : [];

  const filteredStates = selectedState === 'ALL'
    ? state_stats
    : state_stats.filter((s: any) => s.state === selectedState);

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-[#1DB954]" />
            <span>AICTE National Verification Dashboard</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1 font-medium">
            Real-time credential authenticity & institutional compliance across 15 states and 60 institutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* State filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-[#242424] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 outline-none"
          >
            <option value="ALL">All States (15)</option>
            {state_stats.map((s: any) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>

          <button
            onClick={() => window.open(getDownloadUrl('/reports/export?dataset=students&format=pdf'), '_blank')}
            className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Students</div>
          <div className="text-xl font-black text-white mt-1">{metrics.total_students.toLocaleString()}</div>
          <span className="text-[10px] text-[#1DB954] font-semibold">100% Enrolled</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Verified %</div>
          <div className="text-xl font-black text-[#1DB954] mt-1">{metrics.verified_percentage}%</div>
          <span className="text-[10px] text-zinc-400">{metrics.verified_students.toLocaleString()} students</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Pending Check</div>
          <div className="text-xl font-black text-blue-400 mt-1">{metrics.pending_students}</div>
          <span className="text-[10px] text-zinc-400">Queue processing</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Flagged Issues</div>
          <div className="text-xl font-black text-amber-400 mt-1">{metrics.flagged_students}</div>
          <span className="text-[10px] text-amber-300 font-semibold">Under SLA review</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Duplicates</div>
          <div className="text-xl font-black text-rose-400 mt-1">{metrics.duplicate_groups}</div>
          <span className="text-[10px] text-zinc-400">Cross-college groups</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">AICTE Colleges</div>
          <div className="text-xl font-black text-purple-400 mt-1">{metrics.total_colleges}</div>
          <span className="text-[10px] text-zinc-400">15 Indian States</span>
        </div>

        <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828]">
          <div className="text-[10px] text-zinc-400 font-bold uppercase">Quality Score</div>
          <div className="text-xl font-black text-[#1DB954] mt-1">{metrics.data_quality_score}%</div>
          <span className="text-[10px] text-[#1DB954] font-semibold">AICTE Benchmark A+</span>
        </div>
      </div>

      {/* State-Wise Drill Down Choropleth Grid */}
      <section className="bg-[#181818] p-5 rounded-2xl border border-[#282828]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1DB954]" />
              <span>State-Wise Verification Index & Institutional Ranking</span>
            </h3>
            <p className="text-xs text-[#B3B3B3]">Click any state to drill down into district, college, and student rosters</p>
          </div>
          <span className="text-xs font-bold text-zinc-400">15 States Monitored</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {filteredStates.map((st: any) => (
            <div
              key={st.state}
              onClick={() => navigate(`/students?state=${st.state}`)}
              className="bg-[#242424] hover:bg-[#2e2e2e] p-3 rounded-xl border border-zinc-800 hover:border-[#1DB954] transition cursor-pointer group"
            >
              <div className="text-xs font-bold text-white group-hover:text-[#1DB954] transition-colors flex items-center justify-between">
                <span>{st.state}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-[#B3B3B3] mt-1">
                {st.total_students} Students
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#1DB954]">{st.verification_rate}% Verified</span>
                <span className="text-zinc-500">{st.verified_students} verified</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#1DB954] rounded-full"
                  style={{ width: `${st.verification_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Charts 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-[#282828]">
          <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1DB954]" />
            <span>Monthly Verification Throughput</span>
          </h3>
          <p className="text-xs text-[#B3B3B3] mb-4">Volume of student credentials verified vs anomalies flagged</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="verified" name="Verified Records" stroke="#1DB954" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="flagged" name="Discrepancies Flagged" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Funnel */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-[#282828]">
          <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Verification Pipeline Funnel</span>
          </h3>
          <p className="text-xs text-[#B3B3B3] mb-4">Drop-off and authenticity filtering stages</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnel} margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis type="category" dataKey="stage" tick={{ fill: '#bbb', fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', fontSize: 11 }} />
                <Bar dataKey="count" fill="#1DB954" radius={[0, 6, 6, 0]}>
                  {funnel.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch-Wise Enrollment */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-[#282828]">
          <h3 className="font-bold text-white text-base mb-1">Students by Engineering Branch</h3>
          <p className="text-xs text-[#B3B3B3] mb-4">Departmental intake and admission volume</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branch_breakdown} margin={{ top: 5, right: 10, left: -10, bottom: 35 }}>
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} interval={0} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', fontSize: 11 }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographic & Diversity Ratios */}
        <div className="bg-[#181818] p-5 rounded-2xl border border-[#282828] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Gender & Category Distribution</h3>
            <p className="text-xs text-[#B3B3B3] mb-2">Inclusivity metrics across enrolled cohorts</p>
          </div>

          <div className="grid grid-cols-2 gap-4 h-56">
            <div>
              <div className="text-[11px] font-bold text-zinc-400 text-center mb-1">Gender Ratio</div>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={gender_ratio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                    {gender_ratio.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="text-[11px] font-bold text-zinc-400 text-center mb-1">Category Diversity</div>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={category_breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                    {category_breakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
