import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight,
  Download, RefreshCw, Trash2, ArrowLeft, Check, Layers
} from 'lucide-react';
import { ApiClient, getDownloadUrl } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const BulkUpload: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState<'select' | 'mapping' | 'progress' | 'summary'>('select');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const collegeId = user?.college_id || 1;

  const standardFields = [
    { key: 'apaar_id', label: 'APAAR ID (12-Digit Luhn)', required: true },
    { key: 'name', label: 'Student Full Name', required: true },
    { key: 'father_name', label: 'Father Name', required: false },
    { key: 'mother_name', label: 'Mother Name', required: false },
    { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)', required: true },
    { key: 'gender', label: 'Gender', required: true },
    { key: 'category', label: 'Category (General/OBC/SC/ST/EWS)', required: false },
    { key: 'aadhaar_number', label: 'Aadhaar (12-Digit / Last-4)', required: true },
    { key: 'email', label: 'Email Address', required: false },
    { key: 'phone', label: 'Phone Number', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'branch', label: 'Branch / Stream', required: true },
    { key: 'admission_year', label: 'Admission Year', required: true },
    { key: 'current_semester', label: 'Current Semester', required: false },
    { key: 'cgpa', label: 'CGPA (0.0 to 10.0)', required: false },
    { key: 'enrollment_no', label: 'Enrollment / Registration No', required: true }
  ];

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await ApiClient.get('/uploads/history');
      setHistory(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = async (selected: File) => {
    setFile(selected);
    try {
      const formData = new FormData();
      formData.append('file', selected);
      const res = await ApiClient.post('/uploads/preview', formData);
      setPreviewData(res);
      setColumnMapping(res.suggested_mapping || {});
      setStep('mapping');
    } catch (err: any) {
      alert(`Error parsing upload file: ${err.message}`);
    }
  };

  const handleStartProcessing = async () => {
    if (!file) return;
    setStep('progress');
    setUploadProgress(15);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('college_id', String(collegeId));
      formData.append('column_mapping', JSON.stringify(columnMapping));
      formData.append('file', file);

      const res = await ApiClient.post('/uploads/process', formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(res);
      setStep('summary');
      fetchHistory();
    } catch (err: any) {
      clearInterval(progressInterval);
      alert(`Upload failed: ${err.message}`);
      setStep('select');
    }
  };

  const handleRollback = async (batchId: number) => {
    if (!confirm(`Are you sure you want to rollback batch #${batchId}? All associated student records will be removed.`)) return;
    try {
      const res = await ApiClient.post(`/uploads/${batchId}/rollback`);
      alert(res.message);
      fetchHistory();
    } catch (err: any) {
      alert(`Rollback failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#242424]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-8 h-8 text-[#1DB954]" />
            <span>Bulk Student Data Upload</span>
          </h1>
          <p className="text-xs text-[#B3B3B3] mt-1">
            Automated column mapping, 12-digit Luhn APAAR validation, partial success, and batch rollback
          </p>
        </div>

        <button
          onClick={() => window.open(getDownloadUrl('/uploads/template'), '_blank')}
          className="spotify-pill-secondary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Step 1: File Dropzone */}
      {step === 'select' && (
        <div className="bg-[#181818] p-8 rounded-2xl border border-dashed border-zinc-700 hover:border-[#1DB954] transition text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center text-[#1DB954] mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-white text-lg mb-1">Upload CSV or Excel File</h3>
          <p className="text-xs text-[#B3B3B3] max-w-md mb-5">
            Drag and drop your institutional admissions roster (.csv, .xlsx). First 20 rows will be previewed for validation mapping.
          </p>

          <label className="spotify-pill-btn text-xs py-2.5 px-6 cursor-pointer">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
            <span>Choose File from Computer</span>
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping & 20-Row Preview */}
      {step === 'mapping' && previewData && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-bold text-white text-base">Step 2: Column Header Mapping</h3>
              <p className="text-xs text-[#B3B3B3]">
                File: <b>{file?.name}</b> ({previewData.total_rows} records detected)
              </p>
            </div>
            <button onClick={() => setStep('select')} className="text-xs text-zinc-400 hover:text-white">
              Change File
            </button>
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {standardFields.map((field) => (
              <div key={field.key} className="bg-[#242424] p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
                  <span>{field.label}</span>
                  {field.required && <span className="text-[10px] text-amber-400">*Required</span>}
                </div>
                <select
                  value={Object.keys(columnMapping).find((k) => columnMapping[k] === field.key) || ''}
                  onChange={(e) => {
                    const newMap = { ...columnMapping };
                    // Clear previous key for this field
                    Object.keys(newMap).forEach((k) => {
                      if (newMap[k] === field.key) delete newMap[k];
                    });
                    if (e.target.value) {
                      newMap[e.target.value] = field.key;
                    }
                    setColumnMapping(newMap);
                  }}
                  className="w-full bg-[#181818] text-white text-xs p-2 rounded-lg border border-zinc-700 outline-none"
                >
                  <option value="">-- Unmapped --</option>
                  {previewData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* First 20 Rows Preview Table */}
          <div className="pt-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Preview of First 20 Rows
            </h4>
            <div className="overflow-x-auto max-h-56 bg-[#121212] rounded-xl border border-zinc-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#1a1a1a] border-b border-zinc-800 text-zinc-400 font-bold sticky top-0">
                  <tr>
                    {previewData.headers.map((h: string) => (
                      <th key={h} className="p-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  {previewData.preview_rows.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-zinc-800/40">
                      {previewData.headers.map((h: string) => (
                        <td key={h} className="p-2 whitespace-nowrap">{String(row[h] || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button onClick={() => setStep('select')} className="spotify-pill-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button onClick={handleStartProcessing} className="spotify-pill-btn text-xs py-2 px-6">
              Validate & Ingest Batch
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Green Progress Bar */}
      {step === 'progress' && (
        <div className="bg-[#181818] p-10 rounded-2xl border border-[#282828] text-center space-y-4">
          <h3 className="font-bold text-white text-lg">Processing Student Admissions File</h3>
          <p className="text-xs text-[#B3B3B3]">
            Executing 12-digit Luhn checksums, demographic range validations, and isolation forest anomaly screening...
          </p>

          {/* Spotify Green Progress Bar */}
          <div className="w-full max-w-md mx-auto bg-[#282828] h-3 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-[#1DB954] h-full rounded-full transition-all duration-300 shadow-md shadow-[#1DB954]/50"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#1DB954]">{uploadProgress}% Complete</span>
        </div>
      )}

      {/* Step 4: Summary & Error Report Download */}
      {step === 'summary' && uploadResult && (
        <div className="bg-[#181818] p-6 rounded-2xl border border-[#282828] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Batch Ingestion Completed</h3>
              <p className="text-xs text-[#B3B3B3]">Batch ID: #{uploadResult.batch_id} • Status: {uploadResult.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#242424] p-4 rounded-xl text-center">
              <span className="text-xs text-zinc-400 font-bold uppercase block">Total Records</span>
              <span className="text-2xl font-black text-white">{uploadResult.total_records}</span>
            </div>
            <div className="bg-[#242424] p-4 rounded-xl text-center">
              <span className="text-xs text-zinc-400 font-bold uppercase block">Successfully Created</span>
              <span className="text-2xl font-black text-[#1DB954]">{uploadResult.success_count}</span>
            </div>
            <div className="bg-[#242424] p-4 rounded-xl text-center">
              <span className="text-xs text-zinc-400 font-bold uppercase block">Validation Errors</span>
              <span className="text-2xl font-black text-amber-400">{uploadResult.error_count}</span>
            </div>
          </div>

          {uploadResult.error_count > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-200 flex items-center justify-between">
              <div>
                <b>Partial Success:</b> {uploadResult.error_count} records failed validation rules (e.g. invalid Luhn check digit, duplicate APAAR, or missing mandatory fields).
              </div>
              <button
                onClick={() => window.open(getDownloadUrl(`/uploads/${uploadResult.batch_id}/errors-csv`), '_blank')}
                className="spotify-pill-secondary text-xs py-1.5 px-3 shrink-0 ml-4 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Error Report</span>
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <button onClick={() => setStep('select')} className="spotify-pill-secondary text-xs py-2 px-4">
              Upload Another File
            </button>
            <button onClick={() => navigate('/students')} className="spotify-pill-btn text-xs py-2 px-6">
              View Students Roster
            </button>
          </div>
        </div>
      )}

      {/* Batch Upload History & Rollback Table */}
      <section className="bg-[#181818] p-5 rounded-2xl border border-[#282828] space-y-3">
        <h3 className="font-bold text-white text-base">Batch Ingestion History & Rollback Controls</h3>
        <p className="text-xs text-[#B3B3B3]">
          Audit record of all uploaded batches. Any batch can be rolled back safely to restore database integrity.
        </p>

        {loadingHistory ? (
          <div className="text-center py-6 text-xs text-zinc-500">Loading history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-[#282828] text-zinc-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Batch ID</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Total Records</th>
                  <th className="p-3">Success</th>
                  <th className="p-3">Errors</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {history.map((b) => (
                  <tr key={b.id} className="hover:bg-[#202020]">
                    <td className="p-3 font-mono font-bold text-zinc-300">#{b.id}</td>
                    <td className="p-3 font-semibold text-white">{b.filename}</td>
                    <td className="p-3 text-zinc-300">{b.total_records}</td>
                    <td className="p-3 text-[#1DB954] font-bold">{b.success_count}</td>
                    <td className="p-3 text-amber-400 font-bold">{b.error_count}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'COMPLETED' ? 'bg-[#1DB954]/20 text-[#1DB954]' :
                        b.status === 'ROLLED_BACK' ? 'bg-zinc-800 text-zinc-400 line-through' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status !== 'ROLLED_BACK' && (
                        <button
                          onClick={() => handleRollback(b.id)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 justify-end ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Rollback</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
