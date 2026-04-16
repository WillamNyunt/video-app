const BASE = '/api/sessions';

export async function getSessions(locationId) {
  const url = locationId ? `${BASE}?locationId=${locationId}` : BASE;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch sessions');
  }
  return res.json();
}

export async function getSession(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch session');
  }
  return res.json();
}

export async function createSession(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create session');
  }
  return res.json();
}

export async function updateSession(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update session');
  }
  return res.json();
}

export async function deleteSession(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete session');
  }
  return res.json();
}
