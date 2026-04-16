const BASE = '/api/locations';

export async function getLocations() {
  const res = await fetch(BASE, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch locations');
  }
  return res.json();
}

export async function getLocation(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch location');
  }
  return res.json();
}

export async function createLocation(formData) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create location');
  }
  return res.json();
}

export async function updateLocation(id, formData) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update location');
  }
  return res.json();
}

export async function deleteLocation(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete location');
  }
  return res.json();
}
