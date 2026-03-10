import React, { useState, useMemo } from 'react';
import { Download, Share2, History, LayoutDashboard, Search, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

import { useOfficials, Official } from '../hooks/useOfficials';
import { useTerms } from '../hooks/useTerms';
import { useDarkMode } from '../hooks/useDarkMode';
import { API_BASE } from '../utils/api';
import { Sun, Moon } from 'lucide-react';

import { DashboardStats } from '../components/DashboardStats';
import { OfficialsTable } from '../components/OfficialsTable';
import { OfficialFormSection } from '../components/OfficialFormSection';
import { EditOfficialModal } from '../components/EditOfficialModal';
import { ArchiveModal } from '../components/ArchiveModal';
import { HistoryModal } from '../components/HistoryModal';
import { ShareModal } from '../components/ShareModal';

export default function Admin() {
  // Queries & Mutations
  const { 
    officials, isLoading: isLoadingOfficials, 
    addOfficial, isAdding, 
    updateOfficial, isUpdating, 
    deleteOfficial, isDeleting 
  } = useOfficials();

  const { 
    terms, currentTerm, archiveOfficials, isArchiving 
  } = useTerms();

  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Local UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [downloadFields, setDownloadFields] = useState({
    name: true,
    category: true,
    position: true,
    contact: true,
  });

  // Derived State
  const displayTerm = useMemo(() => {
    if (officials.length > 0) {
      const termStrings = Array.from(new Set(officials.map(o => o.term_of_service).filter(Boolean)));
      if (termStrings.length > 0) return termStrings[0];
    }
    return currentTerm?.year || currentTerm?.name;
  }, [officials, currentTerm]);

  // Handlers
  const handleDownload = async () => {
    const selectedFields = Object.entries(downloadFields)
      .filter(([_, v]) => v)
      .map(([k, _]) => k)
      .join(',');

    const url = `${API_BASE}/export?fields=${selectedFields}${displayTerm ? `&term_of_service=${displayTerm}` : ''}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (official: Official) => {
    if (window.confirm(`Are you sure you want to delete ${official.name}?`)) {
      await deleteOfficial(official.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Church Symbols Association Official Management System</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all active:scale-95 text-xs sm:text-base"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
              <span>History</span>
            </button>
            <button 
              onClick={() => setIsArchiveOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95 text-sm sm:text-base"
            >
              <Archive className="w-5 h-5" />
              <span className="xs:hidden">Archive</span>
              <span className="hidden xs:inline">Archive Term</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <DashboardStats 
          officialsCount={officials.length} 
          archivedCount={0} // Fixed in HistoryModal, might want a global count query later
          currentTerm={currentTerm} 
        />

        {/* Main Content Grid */}
        <div className="space-y-8">
          
          {/* Form Section */}
          <OfficialFormSection 
            onSubmit={addOfficial}
            isSubmitting={isAdding}
            displayTerm={displayTerm}
            officialsExist={officials.length > 0}
          />

          {/* Table Controls (Search & Export) */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-colors">
            <div className="relative flex-1 max-w-full xl:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search officials..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-transparent dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 text-gray-900 dark:text-white transition-all outline-none font-medium"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-2 mr-2">
                {Object.entries(downloadFields).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={value} 
                      onChange={e => setDownloadFields({...downloadFields, [key]: e.target.checked})}
                      className="w-4 h-4 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500" 
                    />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{key}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold rounded-xl border border-green-100 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40 transition-all text-xs sm:text-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <span className="hidden xs:inline sm:hidden md:inline">XLSX</span>
                </button>
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold rounded-xl border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:hover:bg-blue-900/40 transition-all text-xs sm:text-sm active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {isLoadingOfficials ? (
            <div className="bg-white rounded-2xl h-64 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Syncing officials list...</p>
            </div>
          ) : (
            <OfficialsTable 
              officials={officials}
              searchTerm={searchTerm}
              onEdit={setEditingOfficial}
              onDelete={handleDelete}
              isDeleting={isDeleting}
              displayTerm={displayTerm}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <EditOfficialModal 
        isOpen={!!editingOfficial}
        onClose={() => setEditingOfficial(null)}
        official={editingOfficial}
        onUpdate={(id, formData) => updateOfficial({ id, formData })}
        isUpdating={isUpdating}
      />

      <ArchiveModal 
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={archiveOfficials}
        isArchiving={isArchiving}
        officialsCount={officials.length}
        electionTerms={terms}
        currentTerm={currentTerm}
      />

      <HistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activeOfficials={officials}
        activeTerm={displayTerm}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        officials={officials}
      />
    </div>
  );
}
