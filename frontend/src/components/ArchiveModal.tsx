import React, { useState } from 'react';
import { AlertTriangle, Calendar, Info, CheckCircle2 } from 'lucide-react';
import { ElectionTerm } from '../hooks/useTerms';
import { JUMUIYA_OPTIONS } from '../constants/adminConstants';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: any) => Promise<void>;
  isArchiving: boolean;
  officialsCount: number;
  electionTerms: ElectionTerm[];
  currentTerm: ElectionTerm | null;
  mode?: 'csa' | 'jumuiya';
  jumuiyaCountMap?: Record<string, number>;
  activeTerm?: string;
}

export function ArchiveModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isArchiving, 
  officialsCount, 
  electionTerms, 
  currentTerm,
  mode = 'csa',
  jumuiyaCountMap = {},
  activeTerm
}: ArchiveModalProps) {
  const [useExistingTerm, setUseExistingTerm] = useState(true);
  const [termName, setTermName] = useState('');
  const [termYear, setTermYear] = useState('');
  const [termStartDate, setTermStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [termEndDate, setTermEndDate] = useState('');
  const [termDescription, setTermDescription] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [selectedJumuiya, setSelectedJumuiya] = useState('all');

  React.useEffect(() => {
    if (isOpen) {
      // 1. Determine defaults for "New Term" fields
      const inferredYear = activeTerm || currentTerm?.year || new Date().getFullYear().toString();
      const inferredName = activeTerm ? `${activeTerm} Committee` : (currentTerm?.name || `${inferredYear} Committee`);
      
      setTermYear(inferredYear);
      setTermName(inferredName);

      // 2. Automatically switch to "New Term" mode if there's a mismatch with the globally active term
      if (activeTerm && currentTerm && activeTerm !== currentTerm.year.toString()) {
        setUseExistingTerm(false);
      } else {
        setUseExistingTerm(true);
      }
    }
  }, [isOpen, currentTerm, activeTerm]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!useExistingTerm && (!termName || !termYear || !termStartDate)) return;
    
    const payload: any = {};
    if (useExistingTerm) {
      payload.election_term_id = currentTerm?.id;
    } else {
      payload.name = termName;
      payload.year = termYear;
      payload.start_date = termStartDate;
      if (termEndDate) payload.end_date = termEndDate;
      if (termDescription) payload.description = termDescription;
    }

    if (mode === 'jumuiya') {
      payload.isJumuiya = true;
      if (selectedJumuiya !== 'all') {
        payload.category = selectedJumuiya;
      }
    }

    await onConfirm(payload);
    onClose();
  };

  const isInvalid = (!useExistingTerm && (!termName || !termYear || !termStartDate)) || !confirmed || isArchiving;
  
  const displayCount = mode === 'jumuiya' && selectedJumuiya !== 'all' 
    ? (jumuiyaCountMap[selectedJumuiya] || 0) 
    : officialsCount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-b border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Archive Current officials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This will move <span className="font-bold text-amber-700 dark:text-amber-500">{displayCount}</span> active officials to history. They will no longer appear on the main page.
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {mode === 'jumuiya' && (
            <section className="space-y-3">
              <h4 className="font-bold text-gray-900 dark:text-white">Target Jumuiya</h4>
              <select
                value={selectedJumuiya}
                onChange={(e) => setSelectedJumuiya(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
              >
                <option value="all">All Jumuiyas ({officialsCount} officials)</option>
                {JUMUIYA_OPTIONS.map(j => (
                  <option key={j} value={j}>{j} ({jumuiyaCountMap[j] || 0} officials)</option>
                ))}
              </select>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Target Election Term
            </h4>
            
            <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setUseExistingTerm(true)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${useExistingTerm ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Existing Term
              </button>
              <button 
                onClick={() => setUseExistingTerm(false)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${!useExistingTerm ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                New Term
              </button>
            </div>

            {useExistingTerm ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                  <Info className="w-4 h-4" />
                  Active Term: {currentTerm?.name || 'None'}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400/80 mt-1 ml-6">
                  Officials will be archived under the currently active {currentTerm?.year || termYear} cycle.
                </p>
                {currentTerm && activeTerm && currentTerm.year !== activeTerm && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>Term Mismatch Detected:</strong> Your official records are tagged with <span className="font-bold underline">{activeTerm}</span>, but the system's global "Active Term" is currently set to <span className="font-bold underline">{currentTerm.year}</span>. 
                      <br /><br />
                      To keep records clean, use <strong>"New Term"</strong> above to archive them under the correct {activeTerm} period.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-1">Term Name *</label>
                  <input 
                    type="text" 
                    value={termName} 
                    onChange={e => setTermName(e.target.value)} 
                    placeholder="e.g. 2024-2025 Committee" 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-1">Year *</label>
                    <input 
                      type="text" 
                      value={termYear} 
                      onChange={e => setTermYear(e.target.value)} 
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-1">Start Date *</label>
                    <input 
                      type="date" 
                      value={termStartDate} 
                      onChange={e => setTermStartDate(e.target.value)} 
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" 
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-900 transition-colors group">
            <input 
              type="checkbox" 
              checked={confirmed} 
              onChange={e => setConfirmed(e.target.checked)} 
              className="w-5 h-5 mt-0.5 text-blue-600 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-800" 
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              I acknowledge that this action is permanent and will move all current officials to the history records.
            </span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isInvalid} 
            className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isInvalid ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none' : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98]'}`}
          >
            {isArchiving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Archiving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm Archive
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
