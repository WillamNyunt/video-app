const BASE = '/api/settings';

export async function getSettings() {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch settings');
  }
  return res.json();
}

export async function updateSetting(key, value) {
  const res = await fetch(BASE, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update setting');
  }
  return res.json();
}
