import React from 'react';
import { Edit2, Trash2, Phone } from 'lucide-react';
import { Official } from '../hooks/useOfficials';
import { CATEGORY_ORDER, CATEGORY_COLORS, POSITION_RANK, DEFAULT_AVATAR } from '../constants/adminConstants';
import { UPLOAD_BASE } from '../utils/api';

interface OfficialsTableProps {
  officials: Official[];
  searchTerm: string;
  onEdit: (official: Official) => void;
  onDelete: (official: Official) => void;
  isDeleting: number | boolean;
  displayTerm?: string;
}

export function OfficialsTable({ officials, searchTerm, onEdit, onDelete, isDeleting, displayTerm }: OfficialsTableProps) {
  const filteredOfficials = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = officials.filter(o => {
      if (!q) return true;
      return (
        (o.name || '').toLowerCase().includes(q) ||
        (o.category || '').toLowerCase().includes(q) ||
        (o.position || '').toLowerCase().includes(q)
      );
    });

    const grouped: Record<string, Official[]> = {};
    filtered.forEach(o => {
      const c = o.category || 'Other';
      (grouped[c] ||= []).push(o);
    });

    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => (POSITION_RANK[a.position] ?? 9999) - (POSITION_RANK[b.position] ?? 9999));
    });

    const sorted: Official[] = [];
    CATEGORY_ORDER.forEach(cat => {
      if (grouped[cat]) sorted.push(...grouped[cat]);
    });
    Object.keys(grouped).forEach(cat => {
      if (!CATEGORY_ORDER.includes(cat)) sorted.push(...grouped[cat]);
    });

    return sorted;
  }, [officials, searchTerm]);

  const getPhotoUrl = (photo: string | null | undefined) => {
    if (!photo) return DEFAULT_AVATAR;
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
    return `${UPLOAD_BASE}${photo.startsWith('/') ? '' : '/'}${photo}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-6 text-white text-center">
        <h2 className="text-2xl font-bold italic underline">
          Current Officials ({filteredOfficials.length}) {displayTerm && `- ${displayTerm}`}
        </h2>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
              <th className="px-4 sm:px-6 py-4 font-bold border-b dark:border-gray-700">Official</th>
              <th className="px-4 sm:px-6 py-4 font-bold border-b dark:border-gray-700">Position</th>
              <th className="px-4 sm:px-6 py-4 font-bold border-b dark:border-gray-700">Contact</th>
              <th className="px-4 sm:px-6 py-4 font-bold border-b dark:border-gray-700 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredOfficials.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={getPhotoUrl(o.photo)} 
                        alt={o.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 ${o.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{o.name}</div>
                      <span className={`inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${CATEGORY_COLORS[o.category] || 'from-gray-500 to-gray-600'}`}>
                        {o.category}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{o.position}</div>
                  {o.term_of_service && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{o.term_of_service}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {o.contact ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600">
                      <Phone className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      {o.contact}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No contact</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <button 
                      onClick={() => onEdit(o)} 
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all active:scale-90"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(o)} 
                      disabled={isDeleting === o.id}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all disabled:opacity-50 active:scale-90"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOfficials.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/50">
                  No officials found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
