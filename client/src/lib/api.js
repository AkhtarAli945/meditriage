const BASE = import.meta.env.VITE_API_URL || '/api';
export const EMERGENCY = import.meta.env.VITE_EMERGENCY_NUMBER || '1122';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('mt_token');
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}
export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
export const isoDay = (offset = 0) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);
