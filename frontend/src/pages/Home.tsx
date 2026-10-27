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
import { Student, College } from '../types';

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
        console.error('Failed to load home data:', err);
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
      {/* Official Top Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Officer'}</span>
            <span className="text-xl">🇮🇳</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
            AICTE APAAR National Authentication Gateway • Active Academic Session 2026-27
          </p>
        </div>

        {/* Quick KPI stats banner */}
        {metrics && (
          <div className="flex items-center gap-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl shadow-xs">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Total Students</div>
              <div className="text-base font-black text-slate-900 dark:text-white">{metrics.total_students.toLocaleString()}</div>
            </div>
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Verified</div>
              <div className="text-base font-black text-[#15803D] dark:text-emerald-400">{metrics.verified_percentage}%</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Active Flags</div>
              <div className="text-base font-black text-[#EA580C] dark:text-amber-400">{metrics.flagged_students}</div>
            </div>
          </div>
        )}
      </div>

      {/* Statutory Quick Action Hub */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => navigate('/verification')}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#0A3871] dark:hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all group shadow-xs hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0A3871] dark:text-blue-300 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-5 h-5 text-[#0A3871] dark:text-blue-400" />
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">Batch Verification Hub</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rule checks & DigiLocker sync</div>
        </div>

        <div
          onClick={() => navigate('/flags')}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#EA580C] dark:hover:border-amber-500 p-4 rounded-xl cursor-pointer transition-all group shadow-xs hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#EA580C] dark:text-amber-300 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-[#EA580C] dark:text-amber-400" />
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">Discrepancy Flags</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">150 anomalies under SLA review</div>
        </div>

        <div
          onClick={() => navigate('/bulk-upload')}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#15803D] dark:hover:border-emerald-500 p-4 rounded-xl cursor-pointer transition-all group shadow-xs hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-300 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform border border-emerald-200 dark:border-emerald-800">
            <UploadCloud className="w-5 h-5 text-[#15803D] dark:text-emerald-400" />
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">Bulk CSV/Excel Upload</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Column mapping & validation</div>
        </div>

        <div
          onClick={() => navigate('/dashboard')}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-400 p-4 rounded-xl cursor-pointer transition-all group shadow-xs hover:shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform border border-indigo-200 dark:border-indigo-800">
            <Building2 className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">National Map Analytics</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">State & compliance monitor</div>
        </div>
      </div>

      {/* Shelf 1: Pending Verifications */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('pending_verifications')}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {pendingStudents.length} awaiting checks
            </span>
          </h2>
          <button
            onClick={() => navigate('/students?verification_status=Pending')}
            className="text-xs font-bold text-[#0A3871] dark:text-blue-400 hover:underline flex items-center gap-1"
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
              <div className="w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 mb-3 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-300 relative overflow-hidden group-hover:shadow-md transition border border-slate-200 dark:border-slate-700">
                <span className="text-3xl font-black text-[#0A3871] dark:text-blue-400">{stu.name[0]}</span>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {stu.verification_status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-[#0A3871] dark:group-hover:text-blue-400 transition-colors">
                {stu.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {stu.branch}
              </p>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                {stu.apaar_id}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shelf 2: Flagged Records Under SLA Review */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="text-[#EA580C]">⚠️</span>
            <span>{t('flagged_this_week')}</span>
          </h2>
          <button
            onClick={() => navigate('/flags')}
            className="text-xs font-bold text-[#EA580C] hover:underline flex items-center gap-1"
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
              className="spotify-card w-52 shrink-0 cursor-pointer group border-amber-200 dark:border-amber-900/40 hover:border-amber-500"
            >
              <div className="w-full h-24 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 mb-2.5 flex flex-col justify-between border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  <span>DISCREPANCY</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-rose-950/60 text-red-800 dark:text-rose-300 border border-red-200 dark:border-red-800 font-bold">
                    HIGH SLA
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                  {stu.apaar_id}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-[#EA580C] transition-colors">
                {stu.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                {stu.anomaly_reasons ? JSON.parse(stu.anomaly_reasons || '[]')[0] : 'Discrepancy flagged'}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Shelf 3: Top AICTE Approved Colleges */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('top_colleges')}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              60 Institutions Ranked
            </span>
          </h2>
          <button
            onClick={() => navigate('/colleges')}
            className="text-xs font-bold text-[#0A3871] dark:text-blue-400 hover:underline flex items-center gap-1"
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
              <div className="w-full aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 mb-3 flex flex-col justify-between p-3 relative group-hover:shadow-md transition border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-[#0A3871] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {col.accreditation}
                  </span>
                  <span className="text-xs font-black text-[#15803D] dark:text-emerald-400">
                    {col.verification_score}%
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {col.aicte_code}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-[#0A3871] dark:group-hover:text-blue-400 transition-colors">
                {col.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {col.district}, {col.state}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
