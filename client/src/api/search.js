const BASE = '/api/search';

export async function search(q, filters) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (filters && Object.keys(filters).length > 0) {
    params.set('filters', JSON.stringify(filters));
  }
  const url = params.toString() ? `${BASE}?${params.toString()}` : BASE;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Search failed');
  }
  return res.json();
}
