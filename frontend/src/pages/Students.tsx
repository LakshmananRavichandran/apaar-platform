import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, Search, Filter, ShieldCheck, AlertTriangle,
  Download, Plus, LayoutGrid, List, CheckCircle2, ChevronLeft, ChevronRight,
  MoreVertical, CheckSquare
} from 'lucide-react';
import { ApiClient, getDownloadUrl } from '../services/api';
import { Student } from '../types';
import { useNowViewingStore } from '../store/useNowViewingStore';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setViewingStudent } = useNowViewingStore();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [verificationStatus, setVerificationStatus] = useState(searchParams.get('verification_status') || '');
  const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
  const [branchFilter, setBranchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 25,
        search: search || undefined,
        verification_status: verificationStatus || undefined,
        state: stateFilter || undefined,
        branch: branchFilter || undefined
      };
      const res = await ApiClient.get('/students', params);
      setStudents(res.students || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, verificationStatus, stateFilter, branchFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleStudentSelect = (stu: Student) => {
    setViewingStudent(stu);
    navigate(`/students/${stu.id}`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('action', bulkAction);
      formData.append('student_ids', JSON.stringify(selectedIds));
      await ApiClient.post('/students/bulk-action', formData);
      setSelectedIds([]);
      setBulkAction('');
      fetchStudents();
    } catch (err: any) {
      alert(`Bulk action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#1DB954]" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            {total.toLocaleString()} Authenticated Student Records across AICTE Approved Institutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-[#242424] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-[#181818] text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-[#181818] text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.open(getDownloadUrl('/reports/export?dataset=students&format=csv'), '_blank')}
            className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#181818] p-4 rounded-2xl border border-[#282828] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Student Name, 12-Digit APAAR ID, or Enrollment Number..."
              className="w-full bg-[#242424] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#1DB954] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#242424] text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-700 outline-none"
            >
              <option value="">All Verification Status</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Flagged">Flagged</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#242424] text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-700 outline-none"
            >
              <option value="">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Kerala">Kerala</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#242424] text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-700 outline-none"
            >
              <option value="">All Branches</option>
              <option value="Computer Science & Engineering">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics & Communication Engineering">Electronics (ECE)</option>
              <option value="Mechanical Engineering">Mechanical</option>
              <option value="Civil Engineering">Civil</option>
            </select>

            <button type="submit" className="spotify-pill-btn text-xs py-2 px-5">
              Apply Filter
            </button>
          </div>
        </form>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
            <span className="font-bold text-[#1DB954]">
              {selectedIds.length} students selected
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bg-[#242424] text-white text-xs px-3 py-1.5 rounded-lg border border-zinc-700 outline-none"
              >
                <option value="">Select Bulk Action</option>
                <option value="mark_alumni">Mark as Alumni (Passed Out)</option>
                <option value="mark_active">Mark Active</option>
                <option value="mark_dropped">Mark Dropped</option>
              </select>
              <button
                onClick={handleExecuteBulkAction}
                className="spotify-pill-btn text-xs py-1.5 px-4"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-12 text-[#B3B3B3] text-sm animate-pulse">
          Loading student registry...
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-[#181818] rounded-2xl border border-[#282828] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#282828] text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-[#1DB954] cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">12-Digit APAAR ID</th>
                  <th className="p-3">Institution</th>
                  <th className="p-3">Branch & Sem</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Trust Score</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {students.map((stu) => (
                  <tr
                    key={stu.id}
                    className="hover:bg-[#202020] transition cursor-pointer group"
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(stu.id)}
                        onChange={() => toggleSelectOne(stu.id)}
                        className="accent-[#1DB954] cursor-pointer"
                      />
                    </td>
                    <td className="p-3" onClick={() => handleStudentSelect(stu)}>
                      <div className="font-bold text-white group-hover:text-[#1DB954] transition-colors">
                        {stu.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {stu.dob} • {stu.gender}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-zinc-300" onClick={() => handleStudentSelect(stu)}>
                      {stu.apaar_id}
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-zinc-300" onClick={() => handleStudentSelect(stu)}>
                      {stu.college_name || 'AICTE College'}
                    </td>
                    <td className="p-3" onClick={() => handleStudentSelect(stu)}>
                      <div className="text-white truncate max-w-[160px]">{stu.branch}</div>
                      <div className="text-[11px] text-zinc-500">Semester {stu.current_semester} • {stu.admission_year}</div>
                    </td>
                    <td className="p-3 font-black text-white" onClick={() => handleStudentSelect(stu)}>
                      {stu.cgpa}
                    </td>
                    <td className="p-3" onClick={() => handleStudentSelect(stu)}>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        stu.verification_status === 'Verified' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                        stu.verification_status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' :
                        stu.verification_status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {stu.verification_status}
                      </span>
                    </td>
                    <td className="p-3" onClick={() => handleStudentSelect(stu)}>
                      <div className="font-bold text-[#1DB954]">{stu.trust_score}%</div>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStudentSelect(stu)}
                        className="text-xs font-bold text-[#1DB954] hover:underline px-2 py-1"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {students.map((stu) => (
            <div
              key={stu.id}
              onClick={() => handleStudentSelect(stu)}
              className="spotify-card cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-800 to-zinc-900 flex items-center justify-center font-bold text-white text-base">
                    {stu.name[0]}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    stu.verification_status === 'Verified' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                    stu.verification_status === 'Flagged' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {stu.verification_status}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm truncate group-hover:text-[#1DB954] transition-colors">
                  {stu.name}
                </h3>
                <p className="text-xs text-[#B3B3B3] line-clamp-1 mt-0.5">
                  {stu.branch}
                </p>
                <div className="text-[11px] font-mono text-zinc-500 mt-1">
                  {stu.apaar_id}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400">CGPA: <b className="text-white">{stu.cgpa}</b></span>
                <span className="text-[#1DB954] font-black">{stu.trust_score}% Trust</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between px-2 text-xs text-[#B3B3B3]">
        <div>
          Showing page <b>{page}</b> of <b>{totalPages}</b> ({total.toLocaleString()} total students)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-full bg-[#181818] hover:bg-[#282828] disabled:opacity-40 flex items-center justify-center text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-full bg-[#181818] hover:bg-[#282828] disabled:opacity-40 flex items-center justify-center text-white transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
