import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ApiClient } from '../../services/api';
import { useNowViewingStore } from '../../store/useNowViewingStore';

export const SearchModal: React.FC = () => {
  const navigate = useNavigate();
  const { searchOpen, setSearchOpen } = useAppStore();
  const { setViewingStudent, setViewingCollege } = useNowViewingStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    students: any[];
    colleges: any[];
    flags: any[];
  }>({ students: [], colleges: [], flags: [] });

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Aarav Sharma',
    'VJTI Mumbai',
    'Computer Science',
    'Maharashtra'
  ]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ students: [], colleges: [], flags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await ApiClient.get('/global-search', { q: query });
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!searchOpen) return null;

  const handleSelectStudent = (stu: any) => {
    setViewingStudent(stu);
    setSearchOpen(false);
    navigate(`/students/${stu.id}`);
  };

  const handleSelectCollege = (col: any) => {
    setViewingCollege(col);
    setSearchOpen(false);
    navigate(`/colleges/${col.id}`);
  };

  const handleSelectFlag = (f: any) => {
    setSearchOpen(false);
    navigate(`/flags?search=${f.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0A3871] dark:text-blue-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, APAAR IDs, AICTE colleges, or discrepancy flags..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-base font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-6 text-sm text-slate-500 animate-pulse">
              Searching AICTE verified repositories...
            </div>
          )}

          {!query && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Students Results */}
          {results.students.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
                <span>Students</span>
              </div>
              <div className="space-y-1">
                {results.students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group border border-slate-100 dark:border-slate-700"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0A3871] dark:group-hover:text-blue-400 transition-colors">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        APAAR: <span className="font-mono text-slate-700 dark:text-slate-300">{s.apaar_id}</span> • {s.college}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {s.trust_score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colleges Results */}
          {results.colleges.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0A3871] dark:text-blue-400" />
                <span>Colleges</span>
              </div>
              <div className="space-y-1">
                {results.colleges.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCollege(c)}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group border border-slate-100 dark:border-slate-700"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0A3871] dark:group-hover:text-blue-400 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        AICTE: {c.aicte_code} • {c.state}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-[#0A3871] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Score: {c.verification_score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags Results */}
          {results.flags.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C] dark:text-amber-400" />
                <span>Discrepancy Flags</span>
              </div>
              <div className="space-y-1">
                {results.flags.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFlag(f)}
                    className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer flex items-center justify-between transition group border border-amber-200 dark:border-amber-800/40"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        {f.flag_type}: {f.student_name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-md">
                        {f.description}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
