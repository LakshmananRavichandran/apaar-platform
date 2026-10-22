import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, LayoutDashboard, Users, GraduationCap, ShieldCheck,
  AlertTriangle, Copy, CheckSquare, UploadCloud, BarChart3,
  SearchCheck, UserCircle, Database, Activity, ShieldAlert,
  Sparkles, ExternalLink, Bookmark
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
    <aside className="w-64 bg-[#121212] flex flex-col h-screen select-none border-r border-[#242424] shrink-0">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#1DB954]/20 animate-pulse">
          A
        </div>
        <div>
          <span className="font-black text-white text-lg tracking-tight flex items-center gap-1.5">
            APAAR<span className="text-[#1DB954]">VERIFY</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#B3B3B3] block">
            AICTE SIH26263
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#282828] text-white font-bold text-shadow'
                    : 'text-[#B3B3B3] hover:text-white hover:bg-[#1a1a1a]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#1DB954]' : 'text-[#B3B3B3] group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Ask APAAR AI Assistant trigger pill */}
        <div className="pt-3">
          <button
            onClick={toggleAiDrawer}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-950/60 to-[#181818] border border-emerald-800/40 text-emerald-400 hover:text-white hover:border-emerald-500/60 transition-all text-sm font-semibold shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#1DB954] animate-spin" style={{ animationDuration: '6s' }} />
              <span>Ask APAAR AI</span>
            </div>
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              Beta
            </span>
          </button>
        </div>
      </div>

      {/* Spotify "Your Library" Style Panel */}
      <div className="p-3 mx-2 mb-2 bg-[#181818] rounded-xl border border-[#282828]">
        <div className="flex items-center justify-between text-xs font-bold text-[#B3B3B3] mb-2 px-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>QUICK FILTERS</span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase">{role}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <NavLink
            to="/students?verification_status=Flagged"
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-300 font-medium transition"
          >
            Flagged (150)
          </NavLink>
          <NavLink
            to="/students?verification_status=Verified"
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-300 font-medium transition"
          >
            Verified (4.8k)
          </NavLink>
          <NavLink
            to="/colleges?status=Approved"
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-300 font-medium transition"
          >
            60 Colleges
          </NavLink>
        </div>
      </div>

      {/* DPDP Act Compliance Footer */}
      <div className="px-4 py-3 border-t border-[#242424] text-[10px] text-[#777] flex items-center justify-between">
        <NavLink to="/privacy" className="hover:text-[#1DB954] transition flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-[#1DB954]" />
          <span>DPDP Act 2023 Compliant</span>
        </NavLink>
        <span className="text-zinc-600">v1.0</span>
      </div>
    </aside>
  );
};
