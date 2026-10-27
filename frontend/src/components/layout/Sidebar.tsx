import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, LayoutDashboard, Users, GraduationCap, ShieldCheck,
  AlertTriangle, Copy, CheckSquare, UploadCloud, BarChart3,
  SearchCheck, UserCircle, Database, Activity, ShieldAlert,
  Sparkles, ExternalLink, Bookmark, Award
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { t, toggleAiDrawer } = useAppStore();

  const role = user?.role || 'STUDENT';

  const navItems = [
    { to: '/', label: t('home'), icon: Home, roles: ['ALL'] },
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'REGIONAL_OFFICER', 'AUDITOR'] },
    { to: '/students', label: t('students'), icon: Users, roles: ['ALL'] },
    { to: '/colleges', label: t('colleges'), icon: GraduationCap, roles: ['ALL'] },
    { to: '/verification', label: t('verification'), icon: ShieldCheck, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'REGIONAL_OFFICER', 'COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
    { to: '/flags', label: t('flags'), icon: AlertTriangle, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'REGIONAL_OFFICER', 'COLLEGE_ADMIN', 'COLLEGE_STAFF', 'AUDITOR'] },
    { to: '/duplicates', label: t('duplicates'), icon: Copy, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'REGIONAL_OFFICER', 'COLLEGE_ADMIN'] },
    { to: '/approvals', label: t('approvals'), icon: CheckSquare, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
    { to: '/bulk-upload', label: t('bulk_upload'), icon: UploadCloud, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'COLLEGE_STAFF'] },
    { to: '/reports', label: t('reports'), icon: BarChart3, roles: ['ALL'] },
    { to: '/verifier', label: t('verifier_portal'), icon: SearchCheck, roles: ['SUPER_ADMIN', 'VERIFIER', 'AUDITOR'] },
    { to: '/student-portal', label: t('student_portal'), icon: UserCircle, roles: ['SUPER_ADMIN', 'STUDENT'] },
    { to: '/audit-logs', label: t('audit_logs'), icon: Database, roles: ['SUPER_ADMIN', 'AICTE_OFFICER', 'AUDITOR'] },
    { to: '/system-health', label: t('system_health'), icon: Activity, roles: ['SUPER_ADMIN', 'AICTE_OFFICER'] },
  ];

  const allowedNav = navItems.filter(
    (item) => item.roles.includes('ALL') || (user && item.roles.includes(role))
  );

  return (
    <aside className="w-64 bg-slate-50 dark:bg-[#0B1120] flex flex-col h-screen select-none border-r border-slate-200 dark:border-slate-800 shrink-0 transition-colors duration-200">
      {/* Official Government Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0A3871] text-white flex flex-col items-center justify-center font-black text-sm shadow-sm shrink-0 border border-blue-900">
            <span className="text-[#EA580C] text-[10px] leading-tight font-extrabold">GOV</span>
            <span className="leading-none text-xs">AICTE</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-base tracking-tight">
              <span>APAAR</span>
              <span className="text-[#EA580C]">VERIFY</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              National Depository Portal
            </div>
          </div>
        </div>
        <div className="mt-2 text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>AICTE SIH26263</span>
          <span className="text-[#15803D] dark:text-emerald-400 font-bold">MoE GOVT. OF INDIA</span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0A3871] text-white font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/80 hover:text-[#0A3871] dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Ask APAAR AI Assistant trigger pill */}
        <div className="pt-2">
          <button
            onClick={toggleAiDrawer}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-[#0A3871] dark:text-blue-300 hover:bg-blue-100/80 transition-all text-xs font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Ask APAAR AI</span>
            </div>
            <span className="text-[9px] bg-blue-200/80 dark:bg-blue-800/60 text-[#0A3871] dark:text-blue-200 font-bold px-1.5 py-0.5 rounded">
              Assistant
            </span>
          </button>
        </div>
      </div>

      {/* Statutory Quick Filters Panel */}
      <div className="p-3 mx-2 mb-2 bg-white dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
            <span>STATUTORY FILTERS</span>
          </div>
          <span className="text-[9px] text-slate-500 font-semibold uppercase">{role}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <NavLink
            to="/students?verification_status=Flagged"
            className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-semibold transition hover:bg-amber-100"
          >
            Flagged (150)
          </NavLink>
          <NavLink
            to="/students?verification_status=Verified"
            className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold transition hover:bg-emerald-100"
          >
            Verified (4.8k)
          </NavLink>
          <NavLink
            to="/colleges?status=Approved"
            className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#0A3871] dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold transition hover:bg-blue-100"
          >
            60 Colleges
          </NavLink>
        </div>
      </div>

      {/* DPDP Act Compliance Footer */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <NavLink to="/privacy" className="hover:text-[#0A3871] dark:hover:text-blue-400 transition flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-3 h-3 text-[#15803D]" />
          <span>DPDP Act 2023 Compliant</span>
        </NavLink>
        <span className="font-mono text-slate-400">v1.0</span>
      </div>
    </aside>
  );
};
