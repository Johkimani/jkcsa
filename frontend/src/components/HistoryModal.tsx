import React, { useState } from 'react';
import { 
  X, Search, Filter, Trash2, RotateCcw, ChevronLeft, ChevronRight, 
  Download, Image as ImageIcon, Phone, Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useHistory } from '../hooks/useHistory';
import { useTerms } from '../hooks/useTerms';
import { CATEGORY_COLORS, DEFAULT_AVATAR, JUMUIYA_OPTIONS, JUMUIYA_COLORS } from '../constants/adminConstants';
import { UPLOAD_BASE, API_BASE, API_JUMUIYA_BASE, API_HISTORY, API_JUMUIYA_HISTORY } from '../utils/api';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOfficials: any[];
  activeTerm?: string;
  mode?: 'csa' | 'jumuiya';
}

export function HistoryModal({ isOpen, onClose, activeOfficials, activeTerm, mode = 'csa' }: HistoryModalProps) {
  const [termFilter, setTermFilter] = useState('');
  const [jumuiyaFilter, setJumuiyaFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return DEFAULT_AVATAR;
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
    return `${UPLOAD_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
  };

  const { terms } = useTerms();
  const { 
    history, meta, isLoading, restoreOfficials, deleteArchived, 
    bulkDelete, isRestoring, isDeleting, isBulkDeleting 
  } = useHistory({ 
    termId: termFilter === 'all' ? undefined : termFilter,
    onlyArchived: true,
    page,
    limit,
    mode
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(o => o.id));
    }
  };

  const handleRestore = async (ids: number[]) => {
    const officialsToRestore = history.filter(o => ids.includes(o.id));
    if (officialsToRestore.length === 0) return;

    // 1. Ensure all officials being restored belong to the same term
    const firstRestoreTerm = officialsToRestore[0].term_name || officialsToRestore[0].term_of_service;
    const allSameTerm = officialsToRestore.every(o => (o.term_name || o.term_of_service) === firstRestoreTerm);

    if (!allSameTerm) {
      toast.error("Please only restore officials from a single term at a time.");
      return;
    }

    // 2. Safeguard against mixing with active table
    if (mode === 'csa' && activeOfficials.length > 0) {
      if (activeTerm && firstRestoreTerm && activeTerm !== firstRestoreTerm) {
        toast.error(`Please archive current officials from [${activeTerm}] before restoring officials from [${firstRestoreTerm}]`);
        return;
      }
      
      // If active officials exist but don't have a term yet (rare), we still block to avoid mixing
      if (!activeTerm) {
        toast.error("Please archive current officials before restoring historical records to maintain data consistency.");
        return;
      }
    }

    if (window.confirm(`Are you sure you want to restore ${ids.length} official(s)?`)) {
      await restoreOfficials(ids);
      setSelectedIds([]);
    }
  };

  const handleDownloadArchive = () => {
    if (!termFilter || termFilter === 'all') {
      toast.error('Please select a specific term to download.');
      return;
    }
    const currentTermObj = terms.find(t => t.id.toString() === termFilter);
    const termOfService = currentTermObj ? currentTermObj.name : '';
    
    const historyBase = mode === 'jumuiya' ? API_JUMUIYA_HISTORY : API_HISTORY;
    const url = `${historyBase}/${termFilter}/export?term_of_service=${encodeURIComponent(termOfService)}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this record?')) {
      await deleteArchived(id);
    }
  };

  const handleBulkDeleteAction = async () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} records? This cannot be undone.`)) {
      await bulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (window.confirm(`Permanently delete ${ids.length} records? This cannot be undone.`)) {
      await bulkDelete(ids);
      if (ids.length === selectedIds.length) setSelectedIds([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Archived Officials History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage records from previous election cycles</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm">
            <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800">
          <div className="flex-1 min-w-[200px] relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <select 
              value={termFilter} 
              onChange={e => { setTermFilter(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Terms</option>
              {terms
                .filter(t => mode === 'csa' ? Number(t.archived_csa_count || 0) > 0 : Number(t.archived_jumuiya_count || 0) > 0)
                .map(t => (
                  <option key={t.id} value={t.id}>{t.year}</option>
              ))}
            </select>
          </div>

          {mode === 'jumuiya' && (
            <div className="flex-1 min-w-[200px] relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select 
                value={jumuiyaFilter} 
                onChange={e => { setJumuiyaFilter(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Jumuiyas</option>
                {JUMUIYA_OPTIONS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!termFilter || termFilter === 'all' ? (
              <div className="text-xs text-gray-500 italic bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                Select a specific term to enable "Restore All" / "Delete All"
              </div>
            ) : (
              <>
                <button 
                  onClick={handleDownloadArchive}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-[11px] sm:text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all border border-green-100 dark:border-green-900/30 active:scale-95 flex-1 sm:flex-none"
                  title="Download records as XLSX"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Download</span>
                </button>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button 
                  onClick={() => handleRestore(history.map(o => o.id))} 
                  disabled={isRestoring || history.length === 0}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-[11px] sm:text-sm font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
                  title="Restore all officials in this term"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>Restore All</span>
                </button>
                <button 
                  onClick={() => handleBulkDelete(history.map(o => o.id))}
                  disabled={isBulkDeleting || history.length === 0}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[11px] sm:text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30 active:scale-95 disabled:opacity-50 flex-1 sm:flex-none"
                  title="Delete all officials in this term"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span>Delete All</span>
                </button>
              </>
            )}

            {selectedIds.length > 0 && (
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
            )}

            {selectedIds.length > 0 && (
              <>
                <button 
                  onClick={() => handleRestore(selectedIds)}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Restore Selected ({selectedIds.length})
                </button>
                <button 
                  onClick={handleBulkDeleteAction}
                  disabled={isBulkDeleting}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all disabled:opacity-50"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-gray-900/20 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
              <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900/50 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <p className="font-medium animate-pulse dark:text-gray-500">Loading archive data...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
              <p className="font-medium">No archived records found</p>
              <p className="text-sm">Try changing the term filter or check back later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.filter(o => mode !== 'jumuiya' || jumuiyaFilter === 'all' || o.category === jumuiyaFilter).map((o) => (
                <div key={o.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all hover:shadow-md flex items-center gap-4 group ${selectedIds.includes(o.id) ? 'border-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-50 dark:ring-indigo-900/20 bg-indigo-50/10 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="w-5 h-5 rounded-lg border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 dark:bg-gray-900"
                  />
                  
                  <div className="relative shrink-0">
                    <img 
                      src={getPhotoUrl(o.photo)} 
                      alt={o.name} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                    <div className="absolute -top-1 -right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                       <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{o.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${mode === 'jumuiya' ? (JUMUIYA_COLORS[o.category] || 'from-indigo-500 to-indigo-600') : (CATEGORY_COLORS[o.category] || 'from-gray-500 to-gray-600 shadow-sm')}`}>
                        {o.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <Award className="w-3 h-3" />
                        {o.position}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {o.term_name || o.term_of_service || 'Unknown Term'}
                      </div>
                    </div>
                    {o.contact && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2 py-1 rounded-lg">
                        <Phone className="w-3 h-3" />
                        {o.contact}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleRestore([o.id])}
                      className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(o.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-all"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Showing <span className="text-gray-900 dark:text-gray-100 font-bold">{history.length}</span> of <span className="text-gray-900 dark:text-gray-100 font-bold">{meta.total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all dark:text-gray-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all dark:text-gray-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Internal Icon used
function Award({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
  );
}
