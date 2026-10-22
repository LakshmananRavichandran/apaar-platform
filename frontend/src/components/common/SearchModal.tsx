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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#282828] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#1DB954]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, APAAR IDs, AICTE colleges, or discrepancy flags..."
            className="flex-1 bg-transparent text-white placeholder-[#777] outline-none text-base font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="text-xs bg-[#242424] hover:bg-[#333] px-2.5 py-1 rounded-md text-zinc-400 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="text-center py-6 text-sm text-[#B3B3B3] animate-pulse">
              Searching AICTE verified repositories...
            </div>
          )}

          {!query && (
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(s)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#242424] hover:bg-[#333] text-zinc-300 font-medium transition"
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
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Students</span>
              </div>
              <div className="space-y-1">
                {results.students.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStudent(s)}
                    className="p-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-[#1DB954] transition-colors">
                        {s.name}
                      </div>
                      <div className="text-xs text-[#B3B3B3]">
                        APAAR: <span className="font-mono text-zinc-300">{s.apaar_id}</span> • {s.college}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954]">
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
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Colleges</span>
              </div>
              <div className="space-y-1">
                {results.colleges.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCollege(c)}
                    className="p-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-[#B3B3B3]">
                        AICTE: {c.aicte_code} • {c.state}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
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
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Discrepancy Flags</span>
              </div>
              <div className="space-y-1">
                {results.flags.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFlag(f)}
                    className="p-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        {f.flag_type}: {f.student_name}
                      </div>
                      <div className="text-xs text-zinc-400 truncate max-w-md">
                        {f.description}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
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
