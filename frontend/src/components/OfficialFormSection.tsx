import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-number-input/input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Upload, X, Check } from 'lucide-react';
import { POSITION_BY_CATEGORY, JUMUIYA_OPTIONS, JUMUIYA_ROLES } from '../constants/adminConstants';
import { resizeImage } from '../utils/imageOptimization';

interface OfficialFormSectionProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
  displayTerm?: string;
  officialsExist: boolean;
  mode?: 'csa' | 'jumuiya';
  allOfficials?: any[];
}

export function OfficialFormSection({ onSubmit, isSubmitting, displayTerm, officialsExist, mode = 'csa', allOfficials = [] }: OfficialFormSectionProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [position, setPosition] = useState('');
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [termOfService, setTermOfService] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (officialsExist && displayTerm) {
      setTermOfService(displayTerm);
    }
  }, [displayTerm, officialsExist]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const availableJumuiyaRoles = React.useMemo(() => {
    if (mode !== 'jumuiya' || !category) return JUMUIYA_ROLES;
    const occupiedRoles = allOfficials
      .filter(o => o.category === category)
      .map(o => o.position);
    return JUMUIYA_ROLES.filter(role => !occupiedRoles.includes(role));
  }, [mode, category, allOfficials]);

  const availableCSARoles = React.useMemo(() => {
    if (mode !== 'csa' || !category) return POSITION_BY_CATEGORY[category] || [];
    const occupiedRoles = allOfficials
      .filter(o => o.category === category)
      .map(o => o.position);
    return (POSITION_BY_CATEGORY[category] || []).filter(role => !occupiedRoles.includes(role));
  }, [mode, category, allOfficials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !position || !photo) return;

    try {
      const optimizedPhotoBlob = await resizeImage(photo);
      const fd = new FormData();
      fd.append('name', name);
      fd.append('category', category);
      fd.append('position', position);
      if (contact) fd.append('contact', contact);
      if (termOfService) fd.append('term_of_service', termOfService);
      fd.append('photo', optimizedPhotoBlob, 'photo.jpg');

      await onSubmit(fd);
      
      // Reset form
      setName('');
      setCategory('');
      setPosition('');
      setContact('');
      setPhoto(null);
      setPreview(null);
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  const termMismatch = officialsExist && termOfService && termOfService !== displayTerm;
  const isInvalid = !name || !category || !position || !photo || !!contactError || isSubmitting || !!termMismatch;

  return (
    <div className="mb-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Add New Official
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Name *</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Full Name" 
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all outline-none" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Category *</label>
            <select 
              value={category} 
              onChange={e => { setCategory(e.target.value); setPosition(''); }} 
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none appearance-none" 
              required
            >
              <option value="">{mode === 'jumuiya' ? 'Select Jumuiya' : 'Select category'}</option>
              {mode === 'csa' 
                ? Object.keys(POSITION_BY_CATEGORY).map(k => <option key={k} value={k}>{k}</option>)
                : JUMUIYA_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)
              }
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Position *</label>
            <select 
              value={position} 
              onChange={e => setPosition(e.target.value)} 
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800" 
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

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
            <PhoneInput 
              country="KE" 
              international 
              value={contact || undefined} 
              onChange={(val: any) => { setContact(val || ''); setContactError(val && !isValidPhoneNumber(val) ? 'Invalid' : ''); }} 
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 flex text-gray-900 dark:text-white" 
              placeholder="e.g. +254 ..." 
            />
            {contactError && <div className="text-red-500 text-xs mt-1 font-medium">{contactError}</div>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Term of Service</label>
            <input 
              value={termOfService} 
              onChange={e => setTermOfService(e.target.value)} 
              placeholder="e.g. 2024-2025" 
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none" 
            />
            {officialsExist && displayTerm && (
              <>
                <p className={`text-[11px] mt-1 font-medium italic flex items-center gap-1 ${termMismatch ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                  {termMismatch ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  {termMismatch 
                    ? `Warning: Must match currently active term (${displayTerm})`
                    : `Pre-filled to match current term (${displayTerm})`
                  }
                </p>
                {termMismatch && (
                  <p className="text-[10px] text-red-400 leading-tight mt-1">
                    To use a new year, please archive the current officials first.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Photo *</label>
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="hidden" 
                id="photo-upload"
                required 
              />
              <label 
                htmlFor="photo-upload" 
                className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${preview ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400 truncate">{photo?.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload photo...</span>
                  </>
                )}
              </label>
              {preview && (
                <button 
                  type="button"
                  onClick={() => { setPhoto(null); setPreview(null); }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-end items-center gap-4">
          <p className="text-xs text-gray-400 order-2 sm:order-1">* Required fields</p>
          <button 
            type="submit" 
            disabled={isInvalid} 
            className={`w-full sm:w-auto px-10 py-3.5 font-black text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 order-1 sm:order-2 ${isInvalid ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50' : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-blue-200 dark:hover:shadow-none active:scale-[0.98]'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Add Official
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
