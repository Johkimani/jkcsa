export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/officials';
export const API_TERMS = `${API_BASE}/terms`;
export const API_ARCHIVE = `${API_BASE}/archive`;
export const API_HISTORY = `${API_BASE}/history`;
export const API_RESTORE = `${API_BASE}/restore`;

export const API_JUMUIYA_BASE = import.meta.env.VITE_API_JUMUIYA_BASE || 'http://localhost:3000/api/jumuiya-officials';
export const API_JUMUIYA_ARCHIVE = `${API_JUMUIYA_BASE}/archive`;
export const API_JUMUIYA_HISTORY = `${API_JUMUIYA_BASE}/term`;
export const API_JUMUIYA_RESTORE = `${API_JUMUIYA_BASE}/restore`;

export const UPLOAD_BASE = import.meta.env.VITE_UPLOAD_BASE || 'http://localhost:3000';
