const BASE = '/api/people';

export async function getPeople() {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch people');
  }
  return res.json();
}

export async function getPerson(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch person');
  }
  return res.json();
}

export async function getPersonVideos(id) {
  const res = await fetch(`${BASE}/${id}/videos`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch person videos');
  }
  return res.json();
}

export async function createPerson(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create person');
  }
  return res.json();
}

export async function updatePerson(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to update person');
  }
  return res.json();
}

export async function deletePerson(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete person');
  }
  return res.json();
}
