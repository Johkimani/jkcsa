import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Send, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Official } from '../hooks/useOfficials';
import { JUMUIYA_OPTIONS } from '../constants/adminConstants';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  officials: Official[];
  mode: 'csa' | 'jumuiya';
}

export function ShareModal({ isOpen, onClose, officials, mode }: ShareModalProps) {
  const [fields, setFields] = useState({
    name: true,
    category: true,
    position: true,
    contact: true,
  });

  const [selectedJumuiya, setSelectedJumuiya] = useState<string>('All');
  const [chairpersonsOnly, setChairpersonsOnly] = useState(false);
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    let filtered = [...officials];

    if (mode === 'jumuiya') {
      if (chairpersonsOnly) {
        filtered = filtered.filter(o => o.position === 'Chairperson');
      } else if (selectedJumuiya !== 'All') {
        filtered = filtered.filter(o => o.category === selectedJumuiya);
      }
    }

    const text = filtered
      .map(o => {
        const parts = [];
        if (fields.name) parts.push(o.name);
        if (fields.category) parts.push(`[${o.category}]`);
        if (fields.position) parts.push(o.position);
        if (fields.contact && o.contact) parts.push(`(${o.contact})`);
        return parts.join(' - ');
      })
      .join('\n');
    setShareText(text);
  }, [officials, fields, selectedJumuiya, chairpersonsOnly, mode]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=Church Officials List&body=${encodeURIComponent(shareText)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="bg-indigo-600 dark:bg-indigo-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6" />
            <h3 className="text-xl font-bold">Share Officials List</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Include Fields</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fields).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFields(prev => ({ ...prev, [key as keyof typeof fields]: !value }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${value ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {value && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'jumuiya' && (
              <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Special Views</p>
                  <button
                    onClick={() => {
                        setChairpersonsOnly(!chairpersonsOnly);
                        if (!chairpersonsOnly) setSelectedJumuiya('All');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border ${chairpersonsOnly ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600'}`}
                  >
                    <span>Chairpersons of all Jumuiyas</span>
                    {chairpersonsOnly && <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>

                {!chairpersonsOnly && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter by Jumuiya</p>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...JUMUIYA_OPTIONS].map(j => (
                        <button
                          key={j}
                          onClick={() => setSelectedJumuiya(j)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedJumuiya === j ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-800'}`}
                        >
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</p>
            <textarea 
              value={shareText} 
              readOnly 
              className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 outline-none scrollbar-thin transition-colors" 
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 grid grid-cols-2 gap-3">
          <button 
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button 
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md hover:bg-green-700 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            WhatsApp
          </button>
          <button 
            onClick={shareEmail}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4" />
            Email List
          </button>
        </div>
      </div>
    </div>
  );
}
