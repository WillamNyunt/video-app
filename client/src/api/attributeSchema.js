const BASE = '/api/attribute-schema';

export async function getSchema() {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch attribute schema');
  }
  return res.json();
}

export async function createSchema(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create schema attribute');
  }
  return res.json();
}

export async function updateSchema(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update schema attribute');
  }
  return res.json();
}

export async function deleteSchema(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete schema attribute');
  }
  return res.json();
}
