import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, Building2, Users, ArrowRight,
  Sparkles, CheckCircle2, Clock, UploadCloud, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useNowViewingStore } from '../store/useNowViewingStore';
import { ApiClient } from '../services/api';
import { Student, College, Flag } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useAppStore();
  const { setViewingStudent, setViewingCollege } = useNowViewingStore();

  const [loading, setLoading] = useState(true);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [flaggedStudents, setFlaggedStudents] = useState<Student[]>([]);
  const [topColleges, setTopColleges] = useState<College[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Dynamic Spotify greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, pendRes, flagRes, colRes] = await Promise.all([
          ApiClient.get('/reports/national-dashboard'),
          ApiClient.get('/students', { verification_status: 'Pending', limit: 8 }),
          ApiClient.get('/students', { verification_status: 'Flagged', limit: 8 }),
          ApiClient.get('/colleges', { limit: 8 })
        ]);

        setMetrics(dashRes.metrics);
        setPendingStudents(pendRes.students || []);
        setFlaggedStudents(flagRes.students || []);
        setTopColleges(colRes.colleges || []);
      } catch (err) {
        console.error('Failed to load home shelves:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStudentClick = (stu: Student) => {
    setViewingStudent(stu);
    navigate(`/students/${stu.id}`);
  };

  const handleCollegeClick = (col: College) => {
    setViewingCollege(col);
    navigate(`/colleges/${col.id}`);
  };

  return (
    <div className="space-y-8 select-none">
      {/* Spotify Top Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Officer'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] font-medium mt-1">
            AICTE APAAR National Authentication Gateway • Active Academic Session 2026-27
          </p>
        </div>

        {/* Quick KPI stats banner */}
        {metrics && (
          <div className="flex items-center gap-3 bg-[#181818] border border-[#282828] px-4 py-2.5 rounded-2xl">
            <div className="text-center px-2 border-r border-zinc-700">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Students</div>
              <div className="text-base font-black text-white">{metrics.total_students.toLocaleString()}</div>
            </div>
            <div className="text-center px-2 border-r border-zinc-700">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Verified</div>
              <div className="text-base font-black text-[#1DB954]">{metrics.verified_percentage}%</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Active Flags</div>
              <div className="text-base font-black text-amber-400">{metrics.flagged_students}</div>
            </div>
          </div>
        )}
      </div>

      {/* Spotify Shelf 1: Quick Action Hub */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/verification')}
          className="bg-gradient-to-br from-emerald-950/60 to-[#181818] border border-emerald-900/40 p-4 rounded-xl cursor-pointer hover:border-[#1DB954] transition-all group shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-[#1DB954] text-black flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-white text-sm">Batch Verification Hub</div>
          <div className="text-xs text-[#B3B3B3] mt-0.5">Rule checks & DigiLocker sync</div>
        </div>

        <div
          onClick={() => navigate('/flags')}
          className="bg-gradient-to-br from-amber-950/60 to-[#181818] border border-amber-900/40 p-4 rounded-xl cursor-pointer hover:border-amber-400 transition-all group shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="font-bold text-white text-sm">Discrepancy Flags</div>
          <div className="text-xs text-[#B3B3B3] mt-0.5">150 anomalies under SLA review</div>
        </div>

        <div
          onClick={() => navigate('/bulk-upload')}
          className="bg-gradient-to-br from-blue-950/60 to-[#181818] border border-blue-900/40 p-4 rounded-xl cursor-pointer hover:border-blue-400 transition-all group shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-blue-500 text-black flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="font-bold text-white text-sm">Bulk CSV/Excel Upload</div>
          <div className="text-xs text-[#B3B3B3] mt-0.5">Column mapping & rollback</div>
        </div>

        <div
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-br from-purple-950/60 to-[#181818] border border-purple-900/40 p-4 rounded-xl cursor-pointer hover:border-purple-400 transition-all group shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mb-3 shadow-md group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="font-bold text-white text-sm">National Map Analytics</div>
          <div className="text-xs text-[#B3B3B3] mt-0.5">State & compliance monitor</div>
        </div>
      </div>

      {/* Spotify Shelf 2: Pending Verifications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('pending_verifications')}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {pendingStudents.length} awaiting checks
            </span>
          </h2>
          <button
            onClick={() => navigate('/students?verification_status=Pending')}
            className="text-xs font-bold text-[#1DB954] hover:underline flex items-center gap-1"
          >
            <span>Show all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="spotify-shelf">
          {pendingStudents.map((stu) => (
            <div
              key={stu.id}
              onClick={() => handleStudentClick(stu)}
              className="spotify-card w-48 shrink-0 cursor-pointer group"
            >
              <div className="w-full aspect-square rounded-md bg-[#242424] mb-3 flex items-center justify-center text-2xl font-bold text-zinc-300 relative overflow-hidden group-hover:shadow-lg transition">
                <span className="text-3xl font-black text-[#1DB954]">{stu.name[0]}</span>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300">
                  {stu.verification_status}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm truncate group-hover:text-[#1DB954] transition-colors">
                {stu.name}
              </h3>
              <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                {stu.branch}
              </p>
              <div className="text-[11px] font-mono text-zinc-500 mt-1">
                {stu.apaar_id}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spotify Shelf 3: Flagged Records Under SLA Review */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-400">⚠️</span>
            <span>{t('flagged_this_week')}</span>
          </h2>
          <button
            onClick={() => navigate('/flags')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Flags</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="spotify-shelf">
          {flaggedStudents.map((stu) => (
            <div
              key={stu.id}
              onClick={() => handleStudentClick(stu)}
              className="spotify-card w-52 shrink-0 cursor-pointer group border border-amber-900/30 hover:border-amber-500"
            >
              <div className="w-full h-24 rounded-md bg-amber-950/40 p-2.5 mb-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                  <span>DISCREPANCY</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300">HIGH SLA</span>
                </div>
                <div className="text-xs font-mono text-zinc-300 truncate">
                  {stu.apaar_id}
                </div>
              </div>
              <h3 className="font-bold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                {stu.name}
              </h3>
              <p className="text-xs text-amber-200/80 line-clamp-2 mt-1">
                {stu.anomaly_reasons ? JSON.parse(stu.anomaly_reasons || '[]')[0] : 'Discrepancy flagged'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Spotify Shelf 4: Top AICTE Approved Colleges */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('top_colleges')}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              60 Institutions Ranked
            </span>
          </h2>
          <button
            onClick={() => navigate('/colleges')}
            className="text-xs font-bold text-[#1DB954] hover:underline flex items-center gap-1"
          >
            <span>View directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="spotify-shelf">
          {topColleges.map((col) => (
            <div
              key={col.id}
              onClick={() => handleCollegeClick(col)}
              className="spotify-card w-56 shrink-0 cursor-pointer group"
            >
              <div className="w-full aspect-video rounded-md bg-gradient-to-br from-[#242424] to-[#121212] mb-3 flex flex-col justify-between p-3 relative group-hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954]">
                    {col.accreditation}
                  </span>
                  <span className="text-xs font-black text-[#1DB954]">
                    {col.verification_score}%
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  {col.aicte_code}
                </div>
              </div>
              <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#1DB954] transition-colors">
                {col.name}
              </h3>
              <p className="text-xs text-[#B3B3B3] truncate mt-0.5">
                {col.district}, {col.state}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
