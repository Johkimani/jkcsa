import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert, Phone } from 'lucide-react';
import PhoneInput from 'react-phone-number-input/input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Official } from '../hooks/useOfficials';
import { POSITION_BY_CATEGORY, JUMUIYA_OPTIONS, JUMUIYA_ROLES } from '../constants/adminConstants';
import { resizeImage } from '../utils/imageOptimization';

interface EditOfficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  official: Official | null;
  onUpdate: (id: number, formData: FormData) => Promise<void>;
  isUpdating: boolean;
  mode?: 'csa' | 'jumuiya';
  allOfficials?: any[];
  displayTerm?: string;
  officialsExist?: boolean;
}

export function EditOfficialModal({ 
  isOpen, onClose, official, onUpdate, isUpdating, mode = 'csa', allOfficials = [],
  displayTerm, officialsExist
}: EditOfficialModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [position, setPosition] = useState('');
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [termOfService, setTermOfService] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (official) {
      setName(official.name || '');
      setCategory(official.category || '');
      setPosition(official.position || '');
      setContact(official.contact || '');
      setTermOfService(official.term_of_service || '');
      setPhoto(null);
    }
  }, [official]);

  const availableJumuiyaRoles = React.useMemo(() => {
    if (mode !== 'jumuiya' || !category) return JUMUIYA_ROLES;
    const occupiedRoles = allOfficials
      .filter(o => o.category === category && o.id !== official?.id)
      .map(o => o.position);
    return JUMUIYA_ROLES.filter(role => !occupiedRoles.includes(role));
  }, [mode, category, allOfficials, official]);

  const availableCSARoles = React.useMemo(() => {
    if (mode !== 'csa' || !category) return POSITION_BY_CATEGORY[category] || [];
    const occupiedRoles = allOfficials
      .filter(o => o.category === category && o.id !== official?.id)
      .map(o => o.position);
    return (POSITION_BY_CATEGORY[category] || []).filter(role => !occupiedRoles.includes(role));
  }, [mode, category, allOfficials, official]);

  if (!isOpen || !official) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !position) return;

    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', category);
    fd.append('position', position);
    if (contact) fd.append('contact', contact);
    if (termOfService) fd.append('term_of_service', termOfService);
    
    if (photo) {
      try {
        const optimizedPhotoBlob = await resizeImage(photo);
        fd.append('photo', optimizedPhotoBlob, 'photo.jpg');
      } catch (err) {
        console.error('Image optimization failed:', err);
        fd.append('photo', photo); // Fallback to original
      }
    }

    await onUpdate(official.id, fd);
    onClose();
  };

  const termMismatch = officialsExist && termOfService && termOfService !== displayTerm;
  const isInvalid = !name || !category || !position || !!contactError || isUpdating || !!termMismatch;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Edit Official</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Full Name *</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Category *</label>
              <select 
                value={category} 
                onChange={e => { setCategory(e.target.value); setPosition(''); }} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                required
              >
                <option value="">{mode === 'jumuiya' ? 'Select Jumuiya' : 'Select category'}</option>
                {mode === 'csa' 
                  ? Object.keys(POSITION_BY_CATEGORY).map(k => <option key={k} value={k}>{k}</option>)
                  : JUMUIYA_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)
                }
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase px-1">Position *</label>
              <select 
                value={position} 
                onChange={e => setPosition(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-50" 
                required 
                disabled={!category}
              >
                <option value="">Select position/role</option>
                {mode === 'csa'
                  ? (category && availableCSARoles.map(p => <option key={p} value={p}>{p}</option>))
                  : (category && availableJumuiyaRoles.map(p => <option key={p} value={p}>{p}</option>))
                }
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <PhoneInput 
                country="KE" 
                international 
                value={contact || undefined} 
                onChange={(val: any) => { setContact(val || ''); setContactError(val && !isValidPhoneNumber(val) ? 'Invalid' : ''); }} 
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 flex" 
              />
            </div>
            {contactError && <div className="text-red-500 text-[11px] font-bold mt-1 px-1">{contactError}</div>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Term of Service</label>
            <input 
              value={termOfService} 
              onChange={e => setTermOfService(e.target.value)} 
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${termMismatch ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
            />
            {officialsExist && displayTerm && (
              <p className={`text-[10px] mt-1 font-bold italic flex items-center gap-1 ${termMismatch ? 'text-red-600' : 'text-blue-600'}`}>
                {termMismatch 
                  ? `Error: Term must match active records (${displayTerm})`
                  : `Active year cycle: ${displayTerm}`
                }
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase px-1">New Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => setPhoto(e.target.files?.[0] || null)} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isInvalid} 
            className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isInvalid ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Update Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
